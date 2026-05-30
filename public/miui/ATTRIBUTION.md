# MIUI White Noise app assets

Visual assets under this directory are extracted from **小米白噪音**
(`com.miui.whitenoise`) APK resources (`assets/scene/`, `assets/icons/`) for UI
parity. Scene metadata (titles, descriptions, layer recipes) is derived from
`assets/scene/prebuilt_scene_config.json` and per-scene `*.json` mix files in
that package.

Audio playback in this web/Android port uses separate CC0 loops under
`public/sounds/`, mapped to the closest built-in equivalents — not the
original MP3 stems from the APK.

Do not redistribute extracted artwork outside this project without complying
with Xiaomi’s terms for the original application.
