import { runMappedRoomsSync } from "../mappedRoomsSync.js";

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
  const result = await runMappedRoomsSync({
    startIso,
    endIso,
    execute,
    includeUnmapped
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
  console.error("[runMappedRoomsSync] failed");
  console.error(error);
  process.exit(1);
});
