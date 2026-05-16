#!/usr/bin/env bash
# Convert a screen recording (.mov/.mp4) to an optimised GIF.
# Uses a two-pass ffmpeg palette approach for crisp colours at small file size.
#
# Usage:
#   npm run demo:gif                             # converts latest recording
#   npm run demo:gif -- demo-output/foo.mov      # specific file
#   npm run demo:gif -- demo-output/foo.mov 720  # custom width (default 800)
#   npm run demo:gif -- demo-output/foo.mov 800 0 30  # width, start, end (seconds)

set -euo pipefail

OUTPUT_DIR="$(dirname "$0")/../../demo-output"

# Resolve input file
INPUT="${1:-}"
if [[ -z "$INPUT" ]]; then
  # Auto-pick the most recent recording
  INPUT="$(ls -t "${OUTPUT_DIR}"/recording_*.mov 2>/dev/null | head -1 || true)"
  if [[ -z "$INPUT" ]]; then
    echo "No recording found in demo-output/. Run npm run demo:record first."
    exit 1
  fi
  echo "Using latest recording: $INPUT"
fi

WIDTH="${2:-800}"       # output width in px (height auto-scales)
START="${3:-0}"         # trim start (seconds)
END="${4:-0}"           # trim end (0 = full duration)
FPS=15                  # GIF frame rate — 12-15fps looks smooth

BASENAME="$(basename "$INPUT" .mov)"
BASENAME="${BASENAME%.mp4}"
PALETTE="/tmp/gochi_palette.png"
GIF_OUT="${OUTPUT_DIR}/${BASENAME}.gif"

# Build time filter
TIME_FILTER=""
if [[ "$START" != "0" ]]; then
  TIME_FILTER="-ss ${START}"
fi
DURATION_FILTER=""
if [[ "$END" != "0" ]]; then
  DURATION_FILTER="-t $(echo "$END - $START" | bc)"
fi

SCALE_FILTER="fps=${FPS},scale=${WIDTH}:-1:flags=lanczos"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║            GOCHI GIF CONVERTER                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Input   → $INPUT"
echo "  Output  → $GIF_OUT"
echo "  Size    → ${WIDTH}px wide @ ${FPS}fps"
[[ "$START" != "0" || "$END" != "0" ]] && echo "  Trim    → ${START}s → ${END}s"
echo ""

# Pass 1 — generate palette for best colour quality
echo "  [1/2] Generating colour palette..."
ffmpeg -v warning $TIME_FILTER $DURATION_FILTER \
  -i "$INPUT" \
  -vf "${SCALE_FILTER},palettegen=stats_mode=full" \
  -y "$PALETTE"

# Pass 2 — render GIF using palette
echo "  [2/2] Rendering GIF..."
ffmpeg -v warning $TIME_FILTER $DURATION_FILTER \
  -i "$INPUT" \
  -i "$PALETTE" \
  -filter_complex "${SCALE_FILTER}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  -y "$GIF_OUT"

SIZE="$(du -sh "$GIF_OUT" | cut -f1)"
echo ""
echo "  ✓ Done! ${GIF_OUT} (${SIZE})"
echo ""
echo "  Tip: if the GIF is too large, try a narrower width:"
echo "       npm run demo:gif -- $INPUT 600"
echo "  Or trim to just the key moment:"
echo "       npm run demo:gif -- $INPUT 800 10 40"
echo ""
