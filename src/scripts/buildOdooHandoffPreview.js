import { fetchPilotRooms } from "../rooms.js";
import { fetchRoomBookings } from "../bookings.js";
import { pilotRoomEmails } from "../pilotRooms.js";
import { buildOdooHandoffPreview } from "../handoffPreview.js";
import { indexRoomMappingsByEmail, loadRoomMappings } from "../roomMappings.js";

function readArgs() {
  const [, , startIso, endIso] = process.argv;

  if (!startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/buildOdooHandoffPreview.js <startIso> <endIso>"
    );
  }

  return { startIso, endIso };
}

async function main() {
  const { startIso, endIso } = readArgs();
  const rooms = await fetchPilotRooms();
  const allowed = new Set(pilotRoomEmails.map((x) => x.toLowerCase()));
  const selectedRooms = rooms.filter((room) =>
    allowed.has((room.emailAddress || "").toLowerCase())
  );
  const roomMappings = await loadRoomMappings();
  const roomMappingsByEmail = indexRoomMappingsByEmail(roomMappings);

  const handoffRooms = [];
  for (const room of selectedRooms) {
    const bookings = await fetchRoomBookings(room.emailAddress, startIso, endIso);
    const mapping = roomMappingsByEmail.get((room.emailAddress || "").toLowerCase()) || null;

    handoffRooms.push(
      buildOdooHandoffPreview({
        room,
        mapping,
        bookings
      })
    );
  }

  console.log(
    JSON.stringify(
      {
        startIso,
        endIso,
        roomCount: handoffRooms.length,
        handoffRooms
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[buildOdooHandoffPreview] failed");
  console.error(error);
  process.exit(1);
});
