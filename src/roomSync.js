import { fetchRoomBookings } from "./bookings.js";
import { buildOdooHandoffPreview } from "./handoffPreview.js";
import { buildOdooAccessPayloadPreview } from "./odooPayloadPreview.js";
import { buildOdooBookingPayload } from "./odooBookingPayload.js";
import {
  createOdooBooking,
  deleteOdooBooking,
  fetchOdooBookings,
  updateOdooBooking
} from "./odooBookings.js";
import {
  indexSyncStateByMicrosoftEventId,
  loadSyncState,
  removeSyncStateBooking,
  saveSyncState,
  upsertSyncStateBooking
} from "./syncState.js";

function isPastBooking(booking) {
  const end = booking.request?.end_datetime;
  if (!end) return false;
  const parsed = parseDateTimeValue(end);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}

function parseDateTimeValue(value) {
  if (!value || typeof value !== "string") return new Date(Number.NaN);

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }

  if (value.includes("T")) {
    return new Date(value);
  }

  return new Date(value.replace(" ", "T"));
}

function isFutureOrActiveStateEntry(entry) {
  const end = parseDateTimeValue(entry?.endDatetime || "");
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() >= Date.now();
}

function overlapsSyncWindow(entry, startIso, endIso) {
  const start = parseDateTimeValue(entry?.startDatetime || "");
  const end = parseDateTimeValue(entry?.endDatetime || "");
  const windowStart = new Date(startIso);
  const windowEnd = new Date(endIso);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    Number.isNaN(windowStart.getTime()) ||
    Number.isNaN(windowEnd.getTime())
  ) {
    return false;
  }

  return start.getTime() <= windowEnd.getTime() && end.getTime() >= windowStart.getTime();
}

function buildStateEntry({ roomEmail, booking, odooBookingId }) {
  return {
    roomEmail,
    microsoftEventId: booking.source.microsoftEventId,
    iCalUId: booking.source.iCalUId,
    odooBookingId,
    lastModifiedDateTime: booking.lastModifiedDateTime || null,
    requestFingerprint: buildRequestFingerprint(booking.request),
    startDatetime: booking.request?.start_datetime || null,
    endDatetime: booking.request?.end_datetime || null,
    subject: booking.request.name || null,
    isCancelled: Boolean(booking.request.state === "cancelled" || booking.isCancelled),
    lastSyncedAt: new Date().toISOString()
  };
}

function wrapActionError(message, details = {}) {
  return new Error(
    `${message}\n${JSON.stringify(details, null, 2)}`
  );
}

function buildRequestFingerprint(request) {
  if (!request) return null;
  const guestContactIds = Array.isArray(request.guest_contact_ids)
    ? [...request.guest_contact_ids].sort((a, b) => a - b)
    : [];

  return JSON.stringify({
    room_id: request.room_id ?? null,
    organizer_id: request.organizer_id ?? null,
    start_datetime: request.start_datetime ?? null,
    end_datetime: request.end_datetime ?? null,
    description: request.description ?? null,
    guest_contact_ids: guestContactIds
  });
}

function needsUpdate(existing, booking) {
  const nextFingerprint = buildRequestFingerprint(booking.request);
  if ((existing.requestFingerprint || null) !== nextFingerprint) {
    return true;
  }

  return (
    !existing ||
    existing.lastModifiedDateTime !== (booking.lastModifiedDateTime || null)
  );
}

function indexOdooBookingsByMicrosoftEventId(bookings) {
  const index = new Map();
  for (const booking of bookings) {
    if (booking.microsoftEventId) {
      index.set(booking.microsoftEventId, booking);
    }
  }
  return index;
}

function buildFallbackStateEntry(roomEmail, booking) {
  if (!booking) return null;

  return {
    roomEmail,
    microsoftEventId: booking.microsoftEventId,
    iCalUId: null,
    odooBookingId: booking.id,
    lastModifiedDateTime: null,
    requestFingerprint: buildRequestFingerprint({
      room_id: booking.roomId,
      organizer_id: booking.organizerId,
      start_datetime: booking.startDatetime,
      end_datetime: booking.endDatetime,
      description: booking.description,
      guest_contact_ids: booking.guestContactIds
    }),
    startDatetime: booking.startDatetime,
    endDatetime: booking.endDatetime,
    subject: booking.name || null,
    isCancelled: false,
    lastSyncedAt: null
  };
}

export async function syncSingleRoom({
  room,
  roomMapping,
  userMappingsByEmail,
  startIso,
  endIso,
  execute = false
}) {
  const bookings = await fetchRoomBookings(room.emailAddress, startIso, endIso);
  const handoffRoom = buildOdooHandoffPreview({
    room,
    mapping: roomMapping,
    bookings
  });
  const accessPayload = buildOdooAccessPayloadPreview(handoffRoom, userMappingsByEmail);
  const bookingPayload = buildOdooBookingPayload(accessPayload);
  const state = await loadSyncState();
  const stateByEventId = indexSyncStateByMicrosoftEventId(state);
  const odooBookings =
    roomMapping?.odooRoomId != null ? await fetchOdooBookings() : [];
  const odooBookingsByEventId = indexOdooBookingsByMicrosoftEventId(
    odooBookings.filter((item) => item.roomId === roomMapping?.odooRoomId)
  );

  const actions = [];
  const currentEventIds = new Set(
    bookingPayload.bookings
      .map((booking) => booking?.source?.microsoftEventId || null)
      .filter(Boolean)
  );

  for (const booking of bookingPayload.bookings) {
    const fallback = buildFallbackStateEntry(
      room.emailAddress,
      odooBookingsByEventId.get(booking.source.microsoftEventId)
    );
    const existing =
      stateByEventId.get(booking.source.microsoftEventId) || fallback;

    if (!booking.ready) {
      actions.push({
        action: "skip",
        reason: "not-ready",
        source: booking.source,
        missing: booking.missing
      });
      continue;
    }

    if (isPastBooking(booking)) {
      actions.push({
        action: "skip",
        reason: "past-booking",
        source: booking.source,
        request: booking.request
      });
      continue;
    }

    if (booking.request.isCancelled || booking.isCancelled) {
      if (existing?.odooBookingId) {
        actions.push({
          action: "delete",
          source: booking.source,
          odooBookingId: existing.odooBookingId,
          existing
        });
      } else {
        actions.push({
          action: "skip",
          reason: "cancelled-without-state",
          source: booking.source
        });
      }
      continue;
    }

    if (!existing) {
      actions.push({
        action: "create",
        source: booking.source,
        request: booking.request,
        booking
      });
      continue;
    }

    if (existing.odooBookingId && needsUpdate(existing, booking)) {
      actions.push({
        action: "replace",
        source: booking.source,
        odooBookingId: existing.odooBookingId,
        request: booking.request,
        booking,
        existing
      });
      continue;
    }

    actions.push({
      action: "noop",
      source: booking.source,
      odooBookingId: existing.odooBookingId
    });
  }

  const staleEntries = (state.bookings || []).filter((entry) => {
    if (entry.roomEmail !== room.emailAddress) return false;
    if (!entry.microsoftEventId || !entry.odooBookingId) return false;
    if (currentEventIds.has(entry.microsoftEventId)) return false;
    if (!overlapsSyncWindow(entry, startIso, endIso)) return false;
    if (!isFutureOrActiveStateEntry(entry)) return false;
    return true;
  });

  for (const entry of staleEntries) {
    actions.push({
      action: "delete",
      reason: "missing-from-microsoft-window",
      source: {
        microsoftEventId: entry.microsoftEventId,
        iCalUId: entry.iCalUId || null
      },
      odooBookingId: entry.odooBookingId,
      existing: entry
    });
  }

  if (execute) {
    const deleteActions = actions.filter((item) => item.action === "delete");
    const replaceActions = actions.filter((item) => item.action === "replace");
    const createActions = actions.filter((item) => item.action === "create");

    for (const action of deleteActions) {
      const response = await deleteOdooBooking(action.odooBookingId);
      removeSyncStateBooking(state, action.source.microsoftEventId);
      await saveSyncState(state);
      action.response = response;
    }

    for (const action of replaceActions) {
      if (action.odooBookingId) {
        const response = await deleteOdooBooking(action.odooBookingId);
        removeSyncStateBooking(state, action.source.microsoftEventId);
        await saveSyncState(state);
        action.deleteResponse = response;
      }
    }

    for (const action of [...replaceActions, ...createActions]) {
      let response;
      try {
        response = await createOdooBooking(action.request);
      } catch (error) {
        throw wrapActionError("Odoo create failed during sync", {
          action: action.action,
          source: action.source,
          request: action.request,
          originalError: error.message
        });
      }

      const odooBookingId = response?.schedule?.id || null;
      upsertSyncStateBooking(
        state,
        buildStateEntry({
          roomEmail: room.emailAddress,
          booking: action.booking,
          odooBookingId
        })
      );
      await saveSyncState(state);
      action.response = response;
      if (action.action === "replace") {
        action.updateStrategy = "delete-then-create";
      }
    }
  }

  return {
    roomEmail: room.emailAddress,
    startIso,
    endIso,
    actions
  };
}
