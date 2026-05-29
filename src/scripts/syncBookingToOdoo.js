import { fetchPilotRooms } from "../rooms.js";
import { fetchRoomBookings } from "../bookings.js";
import { buildOdooHandoffPreview } from "../handoffPreview.js";
import { buildOdooAccessPayloadPreview } from "../odooPayloadPreview.js";
import { buildOdooBookingPayload } from "../odooBookingPayload.js";
import { createOdooBooking } from "../odooBookings.js";
import { indexRoomMappingsByEmail, loadRoomMappings } from "../roomMappings.js";
import { indexUserMappingsByEmail, loadUserMappings } from "../userMappings.js";

function readArgs() {
  const [, , roomEmail, startIso, endIso, ...flags] = process.argv;

  if (!roomEmail || !startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/syncBookingToOdoo.js <roomEmail> <startIso> <endIso> [--execute]"
    );
  }

  return {
    roomEmail,
    startIso,
    endIso,
    execute: flags.includes("--execute")
  };
}

async function main() {
  const { roomEmail, startIso, endIso, execute } = readArgs();
  const rooms = await fetchPilotRooms();
  const room = rooms.find(
    (item) => (item.emailAddress || "").toLowerCase() === roomEmail.toLowerCase()
  );

  if (!room) {
    throw new Error(`Room not found in Microsoft pilot set: ${roomEmail}`);
  }

  const bookings = await fetchRoomBookings(room.emailAddress, startIso, endIso);
  const roomMappingsByEmail = indexRoomMappingsByEmail(await loadRoomMappings());
  const userMappingsByEmail = indexUserMappingsByEmail(await loadUserMappings());
  const handoffRoom = buildOdooHandoffPreview({
    room,
    mapping: roomMappingsByEmail.get((room.emailAddress || "").toLowerCase()) || null,
    bookings
  });
  const accessPayload = buildOdooAccessPayloadPreview(handoffRoom, userMappingsByEmail);
  const bookingPayload = buildOdooBookingPayload(accessPayload);
  const readyBookings = bookingPayload.bookings.filter((item) => item.ready);

  if (!execute) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          roomEmail,
          startIso,
          endIso,
          readyCount: readyBookings.length,
          bookings: readyBookings
        },
        null,
        2
      )
    );
    return;
  }

  const results = [];
  for (const booking of readyBookings) {
    const response = await createOdooBooking(booking.request);
    results.push({
      source: booking.source,
      request: booking.request,
      response
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: "execute",
        roomEmail,
        startIso,
        endIso,
        createdCount: results.length,
        results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[syncBookingToOdoo] failed");
  console.error(error);
  process.exit(1);
});
