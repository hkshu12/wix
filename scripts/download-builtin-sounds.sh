#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/sounds"
BASE="https://raw.githubusercontent.com/lavenderdotpet/CC0-Public-Domain-Sounds/main"

mkdir -p "$OUT"

download() {
  local remote_path="$1"
  local out_name="$2"
  local url="${BASE}/${remote_path}"
  echo "→ ${out_name} (${remote_path})"
  curl -fsSL "$url" -o "${OUT}/${out_name}"
}

# CC0 — lavenderdotpet/CC0-Public-Domain-Sounds (see public/sounds/ATTRIBUTION.md)
download "40-cc0-water-splash-slime-sfx/loop_rain.ogg" "rain.ogg"
download "40-cc0-water-splash-slime-sfx/loop_water_02.ogg" "ocean.ogg"
download "30-cc0-sfx-loops/ambient_01.ogg" "fireplace.ogg"
download "30-cc0-sfx-loops/ambient_03.ogg" "forest.ogg"
download "30-cc0-sfx-loops/noise_01.ogg" "brown-noise.ogg"
download "30-cc0-sfx-loops/noise_02.ogg" "pink-noise.ogg"

# Longer distant thunder (CC0) + extended campfire crackle loop
curl -fsSL "${BASE}/Micro%20Pack%20-%20Chairmat/Fake%20Thunder%201.wav" -o "${OUT}/thunder.wav"
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -i "${OUT}/thunder.wav" -c:a libvorbis -q:a 4 "${OUT}/thunder.ogg" >/dev/null 2>&1
  rm -f "${OUT}/thunder.wav"

  for i in 1 2 3 4; do
    curl -fsSL "${BASE}/100-CC0-wood-metal-SFX/wood_cracking_0${i}.ogg" -o "/tmp/wc${i}.ogg"
  done
  printf "file '/tmp/wc1.ogg'\nfile '/tmp/wc2.ogg'\nfile '/tmp/wc3.ogg'\nfile '/tmp/wc4.ogg'\n" > /tmp/campfire-list.txt
  ffmpeg -y -f concat -safe 0 -i /tmp/campfire-list.txt -c:a libvorbis -q:a 5 /tmp/campfire-base.ogg >/dev/null 2>&1
  ffmpeg -y -stream_loop 9 -i /tmp/campfire-base.ogg -c:a libvorbis -q:a 5 -t 24 "${OUT}/campfire.ogg" >/dev/null 2>&1
  rm -f /tmp/wc*.ogg /tmp/campfire-list.txt /tmp/campfire-base.ogg
else
  echo "ffmpeg not found; keeping short thunder/campfire from direct downloads." >&2
  download "100-cc0-sfx-2/sfx100v2_thunder_01.ogg" "thunder.ogg"
fi

echo "Done. $(ls -1 "$OUT"/*.ogg | wc -l) built-in ambience files in public/sounds/"
