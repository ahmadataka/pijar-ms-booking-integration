import { fetchRoomBookings } from "../bookings.js";

function readArgs() {
  const [, , roomEmail, startIso, endIso] = process.argv;

  if (!roomEmail || !startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/fetchBookings.js <roomEmail> <startIso> <endIso>"
    );
  }

  return { roomEmail, startIso, endIso };
}

async function main() {
  const { roomEmail, startIso, endIso } = readArgs();
  const bookings = await fetchRoomBookings(roomEmail, startIso, endIso);

  console.log(
    JSON.stringify(
      {
        roomEmail,
        startIso,
        endIso,
        count: bookings.length,
        bookings
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[fetchBookings] failed");
  console.error(error);
  process.exit(1);
});
