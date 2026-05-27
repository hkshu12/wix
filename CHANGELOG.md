# Changelog

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
