import { graphGet } from "./graphClient.js";
import { config } from "./config.js";

function normalizeRoom(room) {
  return {
    id: room.id || null,
    displayName: room.displayName || null,
    emailAddress: room.emailAddress || null,
    capacity: room.capacity ?? null,
    building: room.building || null,
    floor: room.floor ?? null,
    floorLabel: room.floorLabel || null,
    city: room.city || null,
    tags: room.tags || []
  };
}

export async function fetchRooms() {
  const result = await graphGet("/places/microsoft.graph.room");
  const items = Array.isArray(result.value) ? result.value : [];

  return items.map(normalizeRoom);
}

export async function fetchPilotRooms() {
  const rooms = await fetchRooms();
  const buildingName = config.microsoft.buildingName;

  return rooms.filter((room) => room.building === buildingName);
}
