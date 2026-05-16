#!/usr/bin/env bash
# Mixes background music into the pitch video at 5% volume.
# Usage:
#   npm run demo:addmusic                          # auto-picks latest pitch-video + bg-music.mp3
#   npm run demo:addmusic -- video.mp4 music.mp3  # explicit files

set -euo pipefail

DEMO_DIR="$(cd "$(dirname "$0")/../../demo-output" && pwd)"

# Resolve inputs
VIDEO="${1:-}"
MUSIC="${2:-}"

if [[ -z "$VIDEO" ]]; then
  VIDEO=$(ls -t "$DEMO_DIR"/pitch-video_*.mp4 2>/dev/null | head -1)
  [[ -z "$VIDEO" ]] && { echo "No pitch-video_*.mp4 found in demo-output/"; exit 1; }
fi

if [[ -z "$MUSIC" ]]; then
  MUSIC="$DEMO_DIR/bg-music.mp3"
  [[ ! -f "$MUSIC" ]] && { echo "No music file found. Place your Suno track at demo-output/bg-music.mp3"; exit 1; }
fi

BASENAME=$(basename "$VIDEO" .mp4)
OUT="$DEMO_DIR/${BASENAME}_music.mp4"
VIDEO_DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")

echo ""
echo "  Video  → $VIDEO"
echo "  Music  → $MUSIC"
echo "  Output → $OUT"
echo "  Volume → 5%"
echo ""

# Loop music to cover full video duration, mix at 5% volume, copy video stream
ffmpeg -y \
  -i "$VIDEO" \
  -stream_loop -1 -i "$MUSIC" \
  -filter_complex "[1:a]volume=0.05,afade=t=out:st=$(echo "$VIDEO_DURATION - 1.5" | bc):d=1.5[a]" \
  -map 0:v \
  -map "[a]" \
  -c:v copy \
  -c:a aac -b:a 128k \
  -shortest \
  "$OUT"

SIZE=$(du -sh "$OUT" | cut -f1)
echo ""
echo "  ✓ Done! $OUT ($SIZE)"
echo "  → Upload this file to YouTube / HackQuest"
echo ""
