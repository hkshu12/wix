# Changelog

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
