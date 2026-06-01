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
  const parsed = new Date(end.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}

function buildStateEntry({ roomEmail, booking, odooBookingId }) {
  return {
    roomEmail,
    microsoftEventId: booking.source.microsoftEventId,
    iCalUId: booking.source.iCalUId,
    odooBookingId,
    lastModifiedDateTime: booking.lastModifiedDateTime || null,
    requestFingerprint: buildRequestFingerprint(booking.request),
    subject: booking.request.name || null,
    isCancelled: Boolean(booking.request.state === "cancelled" || booking.isCancelled),
    lastSyncedAt: new Date().toISOString()
  };
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
          odooBookingId: existing.odooBookingId
        });
        if (execute) {
        const response = await deleteOdooBooking(existing.odooBookingId);
        removeSyncStateBooking(state, booking.source.microsoftEventId);
        await saveSyncState(state);
        actions[actions.length - 1].response = response;
      }
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
        request: booking.request
      });
      if (execute) {
        const response = await createOdooBooking(booking.request);
        const odooBookingId = response?.schedule?.id || null;
        upsertSyncStateBooking(
          state,
          buildStateEntry({
            roomEmail: room.emailAddress,
            booking,
            odooBookingId
          })
        );
        await saveSyncState(state);
        actions[actions.length - 1].response = response;
      }
      continue;
    }

    if (existing.odooBookingId && needsUpdate(existing, booking)) {
      actions.push({
        action: "replace",
        source: booking.source,
        odooBookingId: existing.odooBookingId,
        request: booking.request
      });
      if (execute) {
        let response;

        try {
          response = await updateOdooBooking(existing.odooBookingId, booking.request);
          actions[actions.length - 1].updateStrategy = "patch-or-put";
          upsertSyncStateBooking(
            state,
            buildStateEntry({
              roomEmail: room.emailAddress,
              booking,
              odooBookingId: existing.odooBookingId
            })
          );
        } catch (updateError) {
          const created = await createOdooBooking(booking.request);
          const newOdooBookingId = created?.schedule?.id || null;

          if (existing.odooBookingId) {
            await deleteOdooBooking(existing.odooBookingId);
          }

          response = {
            replacement: {
              create: created,
              deletedOdooBookingId: existing.odooBookingId,
              updateError: updateError.message
            }
          };
          actions[actions.length - 1].updateStrategy = "create-then-delete";
          upsertSyncStateBooking(
            state,
            buildStateEntry({
              roomEmail: room.emailAddress,
              booking,
              odooBookingId: newOdooBookingId
            })
          );
        }
        await saveSyncState(state);
        actions[actions.length - 1].response = response;
      }
      continue;
    }

    actions.push({
      action: "noop",
      source: booking.source,
      odooBookingId: existing.odooBookingId
    });
  }

  return {
    roomEmail: room.emailAddress,
    startIso,
    endIso,
    actions
  };
}
