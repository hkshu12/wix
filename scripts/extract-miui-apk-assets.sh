#!/usr/bin/env bash
# Extract MIUI White Noise (com.miui.whitenoise) scene wallpapers and tab icons
# from an APK into public/miui/. Usage:
#   ./scripts/extract-miui-apk-assets.sh /path/to/app.apk

set -euo pipefail

APK="${1:?Usage: $0 /path/to/miui-whitenoise.apk}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

unzip -q -o "$APK" -d "$TMP/apk"

copy_scene() {
  local src_name="$1"
  local dest="$2"
  local src
  src="$(find "$TMP/apk/assets/scene" -maxdepth 1 -name "$src_name" | head -1)"
  if [[ -z "$src" ]]; then
    echo "Missing scene asset: $src_name" >&2
    exit 1
  fi
  cp "$src" "$ROOT/public/miui/scenes/$dest"
}

copy_icon() {
  local src_name="$1"
  local dest="$2"
  local src
  src="$(find "$TMP/apk/assets/icons" -maxdepth 1 -name "$src_name" | head -1)"
  if [[ -z "$src" ]]; then
    echo "Missing icon asset: $src_name" >&2
    exit 1
  fi
  cp "$src" "$ROOT/public/miui/icons/$dest"
  cp "$ROOT/public/miui/icons/$dest" "$ROOT/public/miui/icons/${dest%.png}-active.png"
}

mkdir -p "$ROOT/public/miui/scenes" "$ROOT/public/miui/icons"

# Filenames inside APK use Unicode escapes when extracted on some filesystems.
copy_scene '*U590f#U96e8.jpg' 'summer-rain.jpg'
copy_scene '*U68ee#U6797.jpg' 'forest.jpg'
copy_scene '*U7089#U706b.jpg' 'fireplace.jpg'
copy_scene '*U6d77#U6d0b.jpg' 'ocean.jpg'

copy_icon '*U590f#U96e8.png' 'summer-rain.png'
copy_icon '*U68ee#U6797.png' 'forest.png'
copy_icon '*U7089#U706b.png' 'fireplace.png'
copy_icon '*U8fd1#U6d77.png' 'ocean.png'

echo "Extracted APK scene assets into public/miui/"
