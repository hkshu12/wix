# Changelog

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
