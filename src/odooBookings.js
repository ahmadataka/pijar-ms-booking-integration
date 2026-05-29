import { odooPost } from "./odooClient.js";

export async function createOdooBooking(payload) {
  return odooPost("/api/v1/bookings", payload);
}
