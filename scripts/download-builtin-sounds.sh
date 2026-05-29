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
download "40-cc0-water-splash-slime-sfx/loop_water_01.ogg" "stream.ogg"
download "30-cc0-sfx-loops/ambient_01.ogg" "fireplace.ogg"
download "30-cc0-sfx-loops/ambient_03.ogg" "forest.ogg"
download "30-cc0-sfx-loops/noise_01.ogg" "brown-noise.ogg"
download "30-cc0-sfx-loops/noise_02.ogg" "pink-noise.ogg"
download "30-cc0-sfx-loops/noise_03.ogg" "white-noise.ogg"
download "100-cc0-sfx-2/sfx100v2_loop_highway.ogg" "highway.ogg"
download "100-cc0-sfx-2/sfx100v2_loop_ambient_02.ogg" "airplane.ogg"
download "100-cc0-sfx-2/sfx100v2_loop_machine_01.ogg" "office.ogg"
download "100-cc0-sfx-2/sfx100v2_loop_construction_site.ogg" "construction-site.ogg"

# Night cafe ambience loop (CC0 — BB_2HTC Samples Vol 4)
curl -fsSL "${BASE}/BB_2HTC%20Samples%20Vol%204/Loops/2023-04-15%20Sometimes%2C%20You%20Don%27t%20Make%20it%20to%20Level%20Two%20-%20Night%20Cafe%20Vibes.wav" -o "${OUT}/cafe.wav"
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -i "${OUT}/cafe.wav" -c:a libvorbis -q:a 5 "${OUT}/cafe.ogg" >/dev/null 2>&1
  rm -f "${OUT}/cafe.wav"
else
  echo "ffmpeg not found; cannot build cafe.ogg from Night Cafe Vibes.wav" >&2
  exit 1
fi

# Train carriage loop (CC0 — MMRetroArcadeSoundsPack, extended for seamless playback)
download "MMRetroArcadeSoundsPack1_0_5/Vehicles/ogg/TrainLoop1.ogg" "train-base.ogg"
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -stream_loop 8 -i "${OUT}/train-base.ogg" -c:a libvorbis -q:a 5 -t 24 "${OUT}/train.ogg" >/dev/null 2>&1
  rm -f "${OUT}/train-base.ogg"
else
  echo "ffmpeg not found; cannot extend train.ogg from TrainLoop1.ogg" >&2
  exit 1
fi

# Large room fan (CC0 — bb Fans and Drones pack)
curl -fsSL "${BASE}/bb%20-%20Fans%20and%20Drones%20(Jul%202021)/Large%20Fan.wav" -o "${OUT}/fan.wav"
if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -i "${OUT}/fan.wav" -c:a libvorbis -q:a 5 "${OUT}/fan.ogg" >/dev/null 2>&1
  rm -f "${OUT}/fan.wav"
else
  echo "ffmpeg not found; cannot build fan.ogg from Large Fan.wav" >&2
  exit 1
fi

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
