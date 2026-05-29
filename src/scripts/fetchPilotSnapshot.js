import { fetchPilotRooms } from "../rooms.js";
import { fetchRoomBookings } from "../bookings.js";
import { pilotRoomEmails } from "../pilotRooms.js";

function readArgs() {
  const [, , startIso, endIso] = process.argv;

  if (!startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/fetchPilotSnapshot.js <startIso> <endIso>"
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

  const bookingsByRoom = [];
  for (const room of selectedRooms) {
    const bookings = await fetchRoomBookings(room.emailAddress, startIso, endIso);
    bookingsByRoom.push({
      room,
      bookingCount: bookings.length,
      bookings
    });
  }

  console.log(
    JSON.stringify(
      {
        startIso,
        endIso,
        roomCount: selectedRooms.length,
        bookingsByRoom
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[fetchPilotSnapshot] failed");
  console.error(error);
  process.exit(1);
});
