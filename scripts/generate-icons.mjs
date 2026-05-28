import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appIcon = readFileSync(join(root, 'assets/icons/app-icon.png'));
const iconMark = readFileSync(join(root, 'assets/icons/icon-mark.png'));

async function writePng(path, size, source, options = {}) {
  let pipeline = sharp(source).resize(size, size, { fit: 'contain', background: options.background ?? { r: 0, g: 0, b: 0, alpha: 0 } });
  if (options.flattenBackground) {
    pipeline = pipeline.flatten({ background: options.flattenBackground });
  }
  const buffer = await pipeline.png().toBuffer();
  writeFileSync(path, buffer);
}

const publicSizes = [
  ['public/favicon-32.png', 32, iconMark],
  ['public/icon-mark-96.png', 96, iconMark],
  ['public/icon-192.png', 192, appIcon],
  ['public/icon-512.png', 512, appIcon],
  ['public/apple-touch-icon.png', 180, appIcon]
];

const launcherSizes = [
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192],
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', 48],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', 72],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 96],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', 144],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 192]
];

const foregroundSizes = [
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', 108],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', 162],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', 216],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', 324],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', 432]
];

for (const [relativePath, size, source] of publicSizes) {
  await writePng(join(root, relativePath), size, source);
  console.log(`wrote ${relativePath} (${size}px)`);
}

for (const [relativePath, size] of launcherSizes) {
  await writePng(join(root, relativePath), size, appIcon);
  console.log(`wrote ${relativePath} (${size}px)`);
}

for (const [relativePath, size] of foregroundSizes) {
  await writePng(join(root, relativePath), size, iconMark, {
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  });
  console.log(`wrote ${relativePath} (${size}px)`);
}
