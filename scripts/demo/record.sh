#!/usr/bin/env bash
# Screen recording helper for the Gochi demo video.
# Uses macOS screencapture to record a specific region or full screen.
#
# Usage:
#   ./scripts/demo/record.sh           # full screen, 2-min cap
#   ./scripts/demo/record.sh 90        # 90-second cap
#   ./scripts/demo/record.sh --region  # pick region interactively (click-drag)

set -euo pipefail

DURATION="${1:-120}"
OUTPUT_DIR="$(dirname "$0")/../../demo-output"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_FILE="${OUTPUT_DIR}/recording_${TIMESTAMP}.mov"

mkdir -p "$OUTPUT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           GOCHI DEMO RECORDING SCRIPT                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Output → demo-output/recording_${TIMESTAMP}.mov"
echo "  Duration → ${DURATION}s (stop early: Ctrl+C)"
echo ""
echo "  DEMO SCRIPT — do these steps during recording:"
echo ""
echo "  0:00  Show landing page (gochi.edycu.dev)"
echo "  0:10  Scroll down to show feature cards + sponsor strip"
echo "  0:20  Click HATCH YOUR GOCHI → play page"
echo "  0:30  Connect wallet (MetaMask, switch to 0G Galileo)"
echo "  0:45  Mint your Gochi → watch hatching animation"
echo "  1:00  Feed the pet → stat bar updates + memory archived"
echo "  1:15  Play with the pet → see mood increase"
echo "  1:25  Open chat → type 'Hello!' → show TEE response"
echo "  1:40  Show Core Memories panel (Merkle roots visible)"
echo "  1:50  Click ChainScan link to show on-chain proof"
echo "  2:00  End"
echo ""

# Countdown
for i in 5 4 3 2 1; do
  printf "  Starting in %d...\r" "$i"
  sleep 1
done
echo "  🔴 RECORDING — press Ctrl+C to stop early          "
echo ""

# Record
# -v = video, -x = no sound icon, -C = include cursor
screencapture -v -x -C -T 0 "$OUTPUT_FILE" &
SC_PID=$!

# Auto-stop after DURATION seconds
sleep "$DURATION" && kill "$SC_PID" 2>/dev/null || true

wait "$SC_PID" 2>/dev/null || true

echo ""
echo "  ✓ Saved: $OUTPUT_FILE"
echo ""
echo "  Next steps:"
echo "  → Make GIF:   npm run demo:gif -- $OUTPUT_FILE"
echo "  → Trim clip:  npm run demo:trim -- $OUTPUT_FILE 0 90"
echo ""
