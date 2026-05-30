import { deleteOdooBooking } from "../odooBookings.js";

function readArgs() {
  const [, , bookingId, ...rest] = process.argv;

  if (!bookingId) {
    throw new Error(
      "Usage: node src/scripts/deleteOdooBooking.js <bookingId> [--execute]"
    );
  }

  return {
    bookingId: Number(bookingId),
    execute: rest.includes("--execute")
  };
}

async function main() {
  const { bookingId, execute } = readArgs();

  if (!execute) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          bookingId
        },
        null,
        2
      )
    );
    return;
  }

  const response = await deleteOdooBooking(bookingId);
  console.log(
    JSON.stringify(
      {
        mode: "execute",
        bookingId,
        response
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[deleteOdooBooking] failed");
  console.error(error);
  process.exit(1);
});
