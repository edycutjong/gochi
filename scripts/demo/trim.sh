#!/usr/bin/env bash
# Trim a recording to a shorter clip for upload or GIF conversion.
#
# Usage:
#   npm run demo:trim -- demo-output/recording.mov 10 90
#   # → trims from 0:10 to 1:30, saves as recording_clip_10-90.mov

set -euo pipefail

INPUT="${1:?Usage: npm run demo:trim -- <file.mov> <start_sec> <end_sec>}"
START="${2:?Provide start second}"
END="${3:?Provide end second}"

BASENAME="$(basename "$INPUT" .mov)"
BASENAME="${BASENAME%.mp4}"
OUTDIR="$(dirname "$INPUT")"
OUTPUT="${OUTDIR}/${BASENAME}_clip_${START}-${END}.mov"
DURATION="$(echo "$END - $START" | bc)"

echo ""
echo "  Trimming: $INPUT"
echo "  Range:    ${START}s → ${END}s (${DURATION}s)"
echo "  Output:   $OUTPUT"
echo ""

ffmpeg -v warning \
  -ss "$START" -t "$DURATION" \
  -i "$INPUT" \
  -c copy \
  -y "$OUTPUT"

SIZE="$(du -sh "$OUTPUT" | cut -f1)"
echo "  ✓ Saved: $OUTPUT (${SIZE})"
echo ""
echo "  Convert to GIF: npm run demo:gif -- $OUTPUT"
echo ""
