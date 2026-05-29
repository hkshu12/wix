# Changelog

## [1.50.0] - 2026-05-29

### Added

- Built-in **溪流** ambience loop (CC0 `loop_water_01`) for meditation, relaxation, and natural soundscapes—distinct from rain and ocean waves.

### Changed

- Landing page feature list: seventeen built-in ambiences (including 溪流).

## [1.49.0] - 2026-05-29

### Added

- **`useMixerShareDeepLink` unit tests**: cover redirecting non-studio routes with `?share=`, importing once when the custom library is ready, preserving other query params when stripping `share`, and no-op without a share param—reduces regression risk on v1.19.0 share deep links.

## [1.48.0] - 2026-05-29

### Added

- **Studio wake timer UI regression tests**: mirror sleep-timer coverage for starting a wake countdown from the mixer drawer, dock countdown label, screen-reader start/cancel announcements, and cancel flow—reduces regression risk on the v1.41.0 wake feature.

## [1.47.0] - 2026-05-29

### Added

- Built-in **白噪音** ambience loop (CC0 `noise_03`) alongside pink and brown noise—bright, even spectrum for focus, baby soothing, and masking sudden environmental sounds.

### Changed

- Landing page feature list: sixteen built-in ambiences (including 白噪音).

## [1.46.0] - 2026-05-29

### Added

- **Wake timer on lock-screen Media Session**: when a wake countdown is active, the system media subtitle shows「唤醒定时 · MM:SS」(matching sleep timer on lock screen and PWA), so you can see nap/morning alarm time without opening the mixer drawer.

## [1.45.0] - 2026-05-28

### Fixed

- **Android share link copy**: copying a mixer share link from the APK now uses the public GitHub Pages URL (`https://hkshu12.github.io/wix/studio?share=…`) instead of `https://localhost/…`, so links work for friends in the browser and via the app deep link.

## [1.44.0] - 2026-05-28

### Added

- **Android mixer share deep links**: opening a GitHub Pages `https://hkshu12.github.io/wix/studio?share=…` link on a device with the wix APK installed launches the app and imports the mix (cold start and while the app is running).

## [1.43.0] - 2026-05-28

### Changed

- **Brand icons**: new wix app icon (full wordmark) for PWA, Apple Touch, and Android launcher; waveform mark for favicon and adaptive icon foreground.
- **Theme**: UI accents and gradients updated to match the icon palette (deep blue `#1a4fd6` to cyan `#00d4ff`).

## [1.42.0] - 2026-05-28

### Added

- **Autoplay on layer select and session restore**: choosing an ambience in Studio starts playback without an extra tap on Play; saved mixes resume after refresh once the custom library is ready. Removing all layers pauses automatically. Manual play/pause (dock button, Space, lock-screen controls) is unchanged.

### Changed

- Landing page copy reflects tap-to-play and auto-resume after refresh.

## [1.41.1] - 2026-05-28

### Fixed

- **Android in-app update download**: create the `cache/updates` directory before saving the release APK. Fixes `ENOENT` when downloading updates (e.g. `wix-1.41.0.apk`) because Capacitor `Filesystem.downloadFile` does not create missing parent folders on Android.

## [1.41.0] - 2026-05-28

### Added

- **Wake timer with gradual volume ramp**: schedule a countdown in the mixer drawer; when it fires, playback starts if paused and master volume fades in from silence to your current level over a configurable 10–120 seconds—gentle wake-ups for naps and mornings. Mutually exclusive with the sleep timer; preference and active countdown persist across refresh.

## [1.40.0] - 2026-05-28

### Added

- **Master volume slider screen-reader announcements**: dragging the master volume slider in the mixer drawer announces volume in the shared playback status region (in 5% steps while dragging, and the final value on release), matching keyboard **+** / **−** behavior for assistive tech users.

## [1.39.0] - 2026-05-28

### Added

- Built-in **工地** ambience loop (CC0 construction-site recording) for masking nearby renovation, urban focus, and layered city soundscapes.

### Changed

- Landing page feature list: fifteen built-in ambiences (including 工地), Studio sound search, playback fade-in, screen wake lock, and keyboard master-volume screen-reader announcements.

## [1.38.0] - 2026-05-28

### Added

- **Sound search on Studio**: filter built-in ambiences and imported tracks by title, description, or file name so you can find the right layer quickly as the library grows.

## [1.37.0] - 2026-05-28

### Added

- **Keyboard master volume screen-reader announcements**: pressing **+** / **−** (or **=** / numpad) to adjust master volume is announced in the shared playback status region (e.g.「主音量 87%」), so assistive tech users hear volume changes without opening the mixer drawer.

## [1.36.0] - 2026-05-28

### Added

- Built-in **办公室** ambience loop (CC0 machine/HVAC recording) for office focus, remote work, and masking environmental noise.

## [1.35.0] - 2026-05-28

### Fixed

- **Audio resumes after tab or app return**: when playback is active, returning to the wix tab or foreground app resumes the Web Audio context and re-syncs layers—fixes silent playback while the UI still shows “playing” after backgrounding.

## [1.34.0] - 2026-05-28

### Added

- **Sleep timer screen-reader announcements**: starting, cancelling, or finishing a sleep timer is announced in the shared playback status region (alongside play/pause and layer toggles), so assistive tech users hear timer events without relying only on the drawer countdown.

## [1.33.0] - 2026-05-28

### Added

- Optional **screen wake lock** while playing: enable in the mixer drawer to keep the display on during bedside or baby-soothing sessions (released automatically when you pause; preference is remembered on supported browsers and PWAs).

## [1.32.0] - 2026-05-28

### Added

- Optional **playback fade-in**: choose off or 2/4/6/8 seconds in the mixer drawer so master volume ramps from silence when you press play—gentler for sleep and baby-soothing (preference is remembered).

## [1.31.0] - 2026-05-28

### Added

- Settings: **clear all on-device data** with a two-step confirmation—removes mixer snapshot, scene presets, sleep timer, theme preference, intro visit flag, and imported custom audio (built-in ambiences are unchanged).

## [1.30.0] - 2026-05-28

### Added

- Configurable sleep timer fade-out: choose 10, 30, 60, or 120 seconds in the mixer drawer; your choice is remembered for the next timer (default remains 30 seconds).

## [1.29.0] - 2026-05-28

### Fixed

- Android update check and APK download use native HTTP (`CapacitorHttp`) and `Filesystem.downloadFile`, fixing spurious “Failed to fetch” errors in the WebView.
- Release notes on the Update screen render as Markdown inside a scrollable area instead of raw text overflowing the layout.

### Changed

- Settings, About, and Update pages use product-oriented copy instead of implementation details (WebView, IndexedDB, Service Worker, etc.).

## [1.28.0] - 2026-05-28

### Added

- Per-track **retry load** in the mixer drawer when an ambience layer fails after automatic retries: other layers keep playing, and you can clear the cache and reload without restarting the whole mix.

## [1.27.0] - 2026-05-28

### Added

- Built-in **飞机舱** ambience loop (CC0 cabin hum recording) for long flights, focus, and masking environmental noise.

## [1.26.0] - 2026-05-28

### Added

- Built-in **公路** ambience loop (CC0 highway traffic recording) for commuting, travel, and masking environmental noise.

## [1.25.0] - 2026-05-28

### Added

- Built-in **列车** ambience loop (CC0 train carriage recording) for travel, reading, and masking environmental noise.

## [1.24.0] - 2026-05-28

### Added

- Built-in **咖啡馆** ambience loop (CC0 night-cafe recording) for focus, reading, and remote-work background noise.

## [1.23.0] - 2026-05-28

### Changed

- Landing page feature list and steps now describe custom sleep timer (5–480 min), nine built-in ambiences including fan, mixer share links, keyboard shortcuts, and lock-screen media controls.

## [1.22.0] - 2026-05-28

### Added

- Built-in **风扇** ambience loop (CC0 large-room fan recording) for sleep, baby soothing, and masking room noise.

## [1.21.0] - 2026-05-28

### Added

- Studio keyboard shortcuts: **M** toggles the mixer drawer; **+** / **−** (or **=** / numpad) adjust master volume in 5% steps without opening the drawer. Listed in the **?** shortcuts help.

## [1.20.0] - 2026-05-28

### Added

- Custom sleep timer duration: set any whole number of minutes from 5 to 480 in the mixer drawer (e.g. 90-minute naps or longer baby-soothing sessions), alongside the existing 15–60 minute presets.

## [1.19.0] - 2026-05-27

### Added

- Mixer share deep links: copy a `/studio?share=…` URL from the mixer drawer, or open a friend’s link to import built-in ambience layers and master settings automatically (custom tracks still require local import).

## [1.18.0] - 2026-05-27

### Added

- Web Media Session API on supported browsers and PWAs: lock-screen and system media controls show the current mix title and artwork, with play/pause wired to the studio mixer (including active sleep-timer countdown in the subtitle).

## [1.17.0] - 2026-05-27

### Added

- Studio keyboard shortcuts help: press **?** to open a short reference (Space play/pause, Esc close); a hint appears in the mixer drawer on desktop.

## [1.16.0] - 2026-05-27

### Added

- Custom audio import shows a progress bar while the file is read into memory, so long recordings no longer look stuck on a static status message.

## [1.15.0] - 2026-05-27

### Added

- Studio keyboard shortcut: press **Space** to play or pause when the mixer drawer and Android menu are closed; ignored while typing in form fields inside the drawer.

## [1.14.0] - 2026-05-27

### Added

- Studio landscape layout: wider ambience grids on tablets, a right-side play/mixer rail on short landscape phones, and PWA install orientation set to **any** so home-screen apps can rotate.

## [1.13.0] - 2026-05-27

### Added

- Mixer share codes: copy the current mix as JSON from the studio drawer, or paste a friend’s code to restore built-in ambience layers and master settings (custom imported tracks are skipped on the recipient device).

## [1.12.0] - 2026-05-27

### Added

- Screen reader announcements for play/pause and adding or removing ambience layers via a dedicated `role="status"` live region on the studio page (sleep timer announcements unchanged).

## [1.11.0] - 2026-05-27

### Changed

- Landing page feature list and steps now describe sleep timer, named mixer presets, and mix persistence after refresh.

## [1.10.0] - 2026-05-27

### Added

- UI motion respects the system **Reduce motion** setting: drawer, Android nav panel, and update progress transitions use zero duration when `prefers-reduced-motion: reduce` is enabled (audio fade-out unchanged).

## [1.9.0] - 2026-05-27

### Added

- Mixer bottom drawer traps keyboard focus while open: Tab cycles inside the panel, Escape closes and restores focus to the control that opened the drawer; scrim is no longer in the tab order.

## [1.8.0] - 2026-05-27

### Added

- Built-in and custom audio loading retries transient network and server errors (up to 3 attempts with exponential backoff) before playback fails; 404 responses are not retried.

## [1.7.0] - 2026-05-27

### Added

- Sleep timer survives page refresh: remaining countdown and fade-out master volume restore from local storage until the timer ends or you cancel it.

## [1.6.0] - 2026-05-27

### Fixed

- PWA manifest `start_url`, `scope`, and icon paths now follow `VITE_BASE_PATH`, so Add to Home Screen works on GitHub Pages subdirectory deployments.

## [1.5.0] - 2026-05-27

### Added

- Android GitHub Release APK auto-check on launch; download and install from the Update screen (`ApkInstaller` native plugin).
- Platform-specific **Settings**, **About**, and **Update** routes; Android side drawer menu (Web uses top tabs + studio links).
- Android skips the marketing landing page and opens the studio directly.

## [1.4.0] - 2026-05-27

### Added

- Named mixer presets: save the current layer mix and master settings (up to 12), load with one tap, or delete from the mixer drawer.

## [1.3.0] - 2026-05-27

### Added

- Mixer snapshot persistence: active layers, per-layer controls, master volume, stereo width, and global playback rate restore after refresh (playback stays paused until you press play).

## [1.2.0] - 2026-05-27

### Added

- Sleep timer with 15/30/45/60 minute presets: countdown in the studio dock and drawer, 30-second master-volume fade-out before auto-pause.

## [1.1.0] - 2026-05-23

### Added

- CC0 built-in ambience loops (rain, ocean, campfire, fireplace, thunder, forest, brown/pink noise) replacing procedural synthesis.
- `npm run sounds:download` script and `public/sounds/ATTRIBUTION.md` for audio provenance.
- Mobile safe-area padding for status bar and notch (`viewport-fit=cover`).
- Bottom dock and mixer/import drawer on the studio page (remote-style UX).
- Simpler high-contrast **W** app icon; relative favicon paths for GitHub Pages.

### Changed

- Built-in audio loads via `fetch` + `decodeAudioData` from bundled OGG files (~1.9 MB).

## [1.0.0] - 2026-05-22

- Initial Web / PWA / Android release with multi-track mixer and custom import.
