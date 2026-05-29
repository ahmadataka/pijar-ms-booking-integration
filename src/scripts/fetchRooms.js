import { fetchPilotRooms } from "../rooms.js";

async function main() {
  const rooms = await fetchPilotRooms();
  console.log(JSON.stringify({ count: rooms.length, rooms }, null, 2));
}

main().catch((error) => {
  console.error("[fetchRooms] failed");
  console.error(error);
  process.exit(1);
});
