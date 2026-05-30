import { fetchRoomBookings } from "./bookings.js";
import { buildOdooHandoffPreview } from "./handoffPreview.js";
import { buildOdooAccessPayloadPreview } from "./odooPayloadPreview.js";
import { buildOdooBookingPayload } from "./odooBookingPayload.js";
import {
  createOdooBooking,
  deleteOdooBooking,
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
    subject: booking.request.name || null,
    isCancelled: Boolean(booking.request.state === "cancelled" || booking.isCancelled),
    lastSyncedAt: new Date().toISOString()
  };
}

function needsUpdate(existing, booking) {
  return (
    !existing ||
    existing.lastModifiedDateTime !== (booking.lastModifiedDateTime || null)
  );
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

  const actions = [];
  for (const booking of bookingPayload.bookings) {
    const existing = stateByEventId.get(booking.source.microsoftEventId);

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
        actions[actions.length - 1].response = response;
      }
      continue;
    }

    if (existing.odooBookingId && needsUpdate(existing, booking)) {
      actions.push({
        action: "update",
        source: booking.source,
        odooBookingId: existing.odooBookingId,
        request: booking.request
      });
      if (execute) {
        const response = await updateOdooBooking(existing.odooBookingId, booking.request);
        upsertSyncStateBooking(
          state,
          buildStateEntry({
            roomEmail: room.emailAddress,
            booking,
            odooBookingId: existing.odooBookingId
          })
        );
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

  if (execute) {
    await saveSyncState(state);
  }

  return {
    roomEmail: room.emailAddress,
    startIso,
    endIso,
    actions
  };
}
