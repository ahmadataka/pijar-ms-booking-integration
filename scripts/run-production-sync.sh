#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$ROOT_DIR/data/logs"
NODE_BIN="/opt/homebrew/bin/node"

mkdir -p "$LOG_DIR"

cd "$ROOT_DIR"
"$NODE_BIN" src/scripts/runProductionSync.js --execute >> "$LOG_DIR/production-sync.log" 2>&1
