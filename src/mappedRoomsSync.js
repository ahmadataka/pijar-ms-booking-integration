import { fetchPilotRooms } from "./rooms.js";
import { indexRoomMappingsByEmail, loadRoomMappings } from "./roomMappings.js";
import { indexUserMappingsByEmail, loadUserMappings } from "./userMappings.js";
import { syncSingleRoom } from "./roomSync.js";

export async function runMappedRoomsSync({
  startIso,
  endIso,
  execute = false,
  includeUnmapped = false
}) {
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

  return {
    startIso,
    endIso,
    roomCount: results.length,
    rooms: results
  };
}
