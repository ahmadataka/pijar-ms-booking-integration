import { createOdooBooking } from "../odooBookings.js";

function readArgs() {
  const [, , roomId, organizerId, startDatetime, endDatetime, guestIdsArg, ...rest] =
    process.argv;

  if (!roomId || !organizerId || !startDatetime || !endDatetime || !guestIdsArg) {
    throw new Error(
      "Usage: node src/scripts/createOdooBookingWithGuestsTest.js <roomId> <organizerId> <startDatetime> <endDatetime> <guestIdsCsv> [--execute]"
    );
  }

  const guestContactIds = guestIdsArg
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return {
    roomId: Number(roomId),
    organizerId: Number(organizerId),
    startDatetime,
    endDatetime,
    guestContactIds,
    execute: rest.includes("--execute")
  };
}

async function main() {
  const { roomId, organizerId, startDatetime, endDatetime, guestContactIds, execute } =
    readArgs();

  const payload = {
    name: "Codex Odoo booking guest sync test",
    room_id: roomId,
    organizer_id: organizerId,
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    guest_contact_ids: guestContactIds
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
  console.error("[createOdooBookingWithGuestsTest] failed");
  console.error(error);
  process.exit(1);
});
