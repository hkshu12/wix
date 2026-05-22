# White Noise Mixer

Cross-platform white noise mixer for Web, PWA, and Android.

## Development

```bash
npm ci
npm run dev
```

## Release & deployment

GitHub Actions workflows under `.github/workflows/`:

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | Push/PR to `main` | Lint, test, and build |
| `pages.yml` | Push to `main` | Deploy latest web build to GitHub Pages |
| `release.yml` | Tag `v*.*.*` or manual | Versioned GitHub Release (web zip + Android APK) and Pages deploy |

### GitHub Pages

1. In the repository **Settings → Pages**, set **Source** to **GitHub Actions**.
2. After `pages.yml` or `release.yml` succeeds, the site is served at  
   `https://<user>.github.io/<repo>/` (for example `https://hkshu12.github.io/wix/`).

The build uses `VITE_BASE_PATH=/<repo>/` so assets and routing work on project Pages.

### Create a versioned release

Push an annotated semver tag (recommended):

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Or run **Actions → Release → Run workflow**, enter a version like `1.0.0`, and optionally enable **Create tag**.

Each release publishes:

- `white-noise-mixer-web-v<version>.zip` — production `dist/`
- `white-noise-mixer-v<version>-android.apk` — debug APK (`assembleDebug`)

Version numbers are synced to `package.json` and `android/app/build.gradle` during the release build.
