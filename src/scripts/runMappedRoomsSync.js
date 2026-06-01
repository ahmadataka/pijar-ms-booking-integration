import { fetchPilotRooms } from "../rooms.js";
import { indexRoomMappingsByEmail, loadRoomMappings } from "../roomMappings.js";
import { indexUserMappingsByEmail, loadUserMappings } from "../userMappings.js";
import { syncSingleRoom } from "../roomSync.js";

function readArgs() {
  const [, , startIso, endIso, ...flags] = process.argv;

  if (!startIso || !endIso) {
    throw new Error(
      "Usage: node src/scripts/runMappedRoomsSync.js <startIso> <endIso> [--execute] [--include-unmapped]"
    );
  }

  return {
    startIso,
    endIso,
    execute: flags.includes("--execute"),
    includeUnmapped: flags.includes("--include-unmapped")
  };
}

async function main() {
  const { startIso, endIso, execute, includeUnmapped } = readArgs();
  const rooms = await fetchPilotRooms();
  const roomMappingsByEmail = indexRoomMappingsByEmail(await loadRoomMappings());
  const userMappingsByEmail = indexUserMappingsByEmail(await loadUserMappings());

  const selectedRooms = rooms.filter((room) => {
    const mapping = roomMappingsByEmail.get((room.emailAddress || "").toLowerCase()) || null;
    if (includeUnmapped) return true;
    return Boolean(mapping?.odooRoomId);
  });

  const results = [];
  for (const room of selectedRooms) {
    const mapping = roomMappingsByEmail.get((room.emailAddress || "").toLowerCase()) || null;
    const result = await syncSingleRoom({
      room,
      roomMapping: mapping,
      userMappingsByEmail,
      startIso,
      endIso,
      execute
    });
    results.push(result);
  }

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        startIso,
        endIso,
        roomCount: results.length,
        rooms: results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[runMappedRoomsSync] failed");
  console.error(error);
  process.exit(1);
});
