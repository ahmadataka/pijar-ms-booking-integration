import { createOdooBooking } from "../odooBookings.js";

function readArgs() {
  const [, , roomId, organizerId, startDatetime, endDatetime, ...rest] = process.argv;

  if (!roomId || !organizerId || !startDatetime || !endDatetime) {
    throw new Error(
      "Usage: node src/scripts/createMinimalOdooBookingTest.js <roomId> <organizerId> <startDatetime> <endDatetime> [--execute]"
    );
  }

  return {
    roomId: Number(roomId),
    organizerId: Number(organizerId),
    startDatetime,
    endDatetime,
    execute: rest.includes("--execute")
  };
}

async function main() {
  const { roomId, organizerId, startDatetime, endDatetime, execute } = readArgs();
  const payload = {
    name: "Codex minimal Odoo booking test",
    room_id: roomId,
    organizer_id: organizerId,
    start_datetime: startDatetime,
    end_datetime: endDatetime
  };

  if (!execute) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          payload
        },
        null,
        2
      )
    );
    return;
  }

  const response = await createOdooBooking(payload);
  console.log(
    JSON.stringify(
      {
        mode: "execute",
        payload,
        response
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[createMinimalOdooBookingTest] failed");
  console.error(error);
  process.exit(1);
});
