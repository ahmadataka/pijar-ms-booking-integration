import { fetchPilotRooms } from "../rooms.js";
import { fetchRoomBookings } from "../bookings.js";
import { pilotRoomEmails } from "../pilotRooms.js";
import { buildOdooHandoffPreview } from "../handoffPreview.js";
import { indexRoomMappingsByEmail, loadRoomMappings } from "../roomMappings.js";
import { buildOdooAccessPayloadPreview } from "../odooPayloadPreview.js";
import { indexUserMappingsByEmail, loadUserMappings } from "../userMappings.js";

function readArgs() {
  const [, , startIso, endIso] = process.argv;

  if (!startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/buildOdooAccessPayloadPreview.js <startIso> <endIso>"
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

  const roomMappingsByEmail = indexRoomMappingsByEmail(await loadRoomMappings());
  const userMappingsByEmail = indexUserMappingsByEmail(await loadUserMappings());

  const payloads = [];
  for (const room of selectedRooms) {
    const bookings = await fetchRoomBookings(room.emailAddress, startIso, endIso);
    const handoffRoom = buildOdooHandoffPreview({
      room,
      mapping: roomMappingsByEmail.get((room.emailAddress || "").toLowerCase()) || null,
      bookings
    });

    payloads.push(buildOdooAccessPayloadPreview(handoffRoom, userMappingsByEmail));
  }

  console.log(
    JSON.stringify(
      {
        startIso,
        endIso,
        roomCount: payloads.length,
        payloads
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[buildOdooAccessPayloadPreview] failed");
  console.error(error);
  process.exit(1);
});
