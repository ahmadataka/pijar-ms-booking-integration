import { fetchOdooBookings } from "../odooBookings.js";

function readArgs() {
  const [, , roomIdArg] = process.argv;
  return {
    roomId: roomIdArg ? Number(roomIdArg) : null
  };
}

async function main() {
  const { roomId } = readArgs();
  const bookings = await fetchOdooBookings();
  const filtered = roomId
    ? bookings.filter((booking) => booking.roomId === roomId)
    : bookings;

  console.log(
    JSON.stringify(
      {
        count: filtered.length,
        bookings: filtered
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[fetchOdooBookings] failed");
  console.error(error);
  process.exit(1);
});
