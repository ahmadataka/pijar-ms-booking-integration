import { odooDelete, odooPatch, odooPost } from "./odooClient.js";

export async function createOdooBooking(payload) {
  return odooPost("/api/v1/bookings", payload);
}

export async function deleteOdooBooking(bookingId) {
  return odooDelete(`/api/v1/bookings/${bookingId}`);
}

export async function updateOdooBooking(bookingId, payload) {
  return odooPatch(`/api/v1/bookings/${bookingId}`, payload);
}
