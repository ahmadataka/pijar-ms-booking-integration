import { odooGet } from "./odooClient.js";

function normalizeArea(area) {
  return {
    id: area.id ?? null,
    name: area.name ?? null,
    areaName: area.area_name ?? null,
    macAddress: area.mac_address ?? null,
    roomType: area.room_type ?? null,
    capacity: area.capacity ?? null,
    status: area.status ?? null,
    description: area.description ?? null,
    roomInformation: area.room_information ?? null
  };
}

export async function fetchOdooAreas(params = {}) {
  const data = await odooGet("/api/v1/areas", params);
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return items.map(normalizeArea);
}
