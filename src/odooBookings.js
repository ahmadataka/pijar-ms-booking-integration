import { odooDelete, odooGet, odooPatch, odooPost, odooPut } from "./odooClient.js";

const MICROSOFT_SYNC_PREFIX = "Synced from Microsoft booking ";

function normalizeBooking(booking) {
  const checkInAccesses = Array.isArray(booking.check_in_accesses)
    ? booking.check_in_accesses
    : [];

  return {
    id: booking.id ?? null,
    name: booking.name ?? null,
    roomId: booking.room?.id ?? booking.room_id ?? null,
    organizerId: booking.organizer?.id ?? booking.organizer_id ?? null,
    startDatetime: booking.start_datetime ?? null,
    endDatetime: booking.end_datetime ?? null,
    description: booking.description ?? null,
    guestContactIds: checkInAccesses
      .map((item) => item?.contact?.id ?? null)
      .filter((value) => Number.isInteger(value) && value > 0)
      .sort((a, b) => a - b),
    microsoftEventId: extractMicrosoftEventId(booking.description)
  };
}

function extractMicrosoftEventId(description) {
  if (typeof description !== "string") return null;
  if (!description.startsWith(MICROSOFT_SYNC_PREFIX)) return null;
  return description.slice(MICROSOFT_SYNC_PREFIX.length).trim() || null;
}

export async function createOdooBooking(payload) {
  return odooPost("/api/v1/bookings", payload);
}

export async function deleteOdooBooking(bookingId) {
  return odooDelete(`/api/v1/bookings/${bookingId}`);
}

export async function updateOdooBooking(bookingId, payload) {
  const path = `/api/v1/bookings/${bookingId}`;

  try {
    return await odooPatch(path, payload);
  } catch (patchError) {
    try {
      return await odooPut(path, payload);
    } catch (putError) {
      throw new Error(
        `Odoo update ${path} failed via PATCH and PUT.\nPATCH: ${patchError.message}\nPUT: ${putError.message}`
      );
    }
  }
}

export async function fetchOdooBookings(params = {}) {
  const data = await odooGet("/api/v1/bookings", params);
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return items.map(normalizeBooking);
}
