import { runProductionSync } from "../productionSync.js";

function readArgs() {
  const flags = process.argv.slice(2);
  return {
    execute: flags.includes("--execute"),
    includeUnmapped: flags.includes("--include-unmapped")
  };
}

async function main() {
  const { execute, includeUnmapped } = readArgs();
  const result = await runProductionSync({
    execute,
    includeUnmapped
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[runProductionSync] failed");
  console.error(error);
  process.exit(1);
});
