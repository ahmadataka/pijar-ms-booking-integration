import { fetchOdooAreas } from "../odooAreas.js";

async function main() {
  const areas = await fetchOdooAreas();
  console.log(
    JSON.stringify(
      {
        count: areas.length,
        areas
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[fetchOdooAreas] failed");
  console.error(error);
  process.exit(1);
});
