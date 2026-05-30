import { fetchPilotRooms } from "../rooms.js";
import { indexRoomMappingsByEmail, loadRoomMappings } from "../roomMappings.js";
import { indexUserMappingsByEmail, loadUserMappings } from "../userMappings.js";
import { syncSingleRoom } from "../roomSync.js";

function readArgs() {
  const [, , roomEmail, startIso, endIso, ...flags] = process.argv;

  if (!roomEmail || !startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/runSingleRoomSync.js <roomEmail> <startIso> <endIso> [--execute]"
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

  const roomMappingsByEmail = indexRoomMappingsByEmail(await loadRoomMappings());
  const userMappingsByEmail = indexUserMappingsByEmail(await loadUserMappings());
  const result = await syncSingleRoom({
    room,
    roomMapping: roomMappingsByEmail.get((room.emailAddress || "").toLowerCase()) || null,
    userMappingsByEmail,
    startIso,
    endIso,
    execute
  });

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        ...result
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[runSingleRoomSync] failed");
  console.error(error);
  process.exit(1);
});
