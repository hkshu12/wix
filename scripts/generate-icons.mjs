import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconSvg = readFileSync(join(root, 'public/icon.svg'));
const foregroundSvg = readFileSync(join(root, 'public/icon-foreground.svg'));

async function writePng(path, size, source) {
  const buffer = await sharp(source).resize(size, size).png().toBuffer();
  writeFileSync(path, buffer);
}

const publicSizes = [
  ['public/favicon-32.png', 32],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180]
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

for (const [relativePath, size] of publicSizes) {
  await writePng(join(root, relativePath), size, iconSvg);
  console.log(`wrote ${relativePath} (${size}px)`);
}

for (const [relativePath, size] of launcherSizes) {
  await writePng(join(root, relativePath), size, iconSvg);
  console.log(`wrote ${relativePath} (${size}px)`);
}

for (const [relativePath, size] of foregroundSizes) {
  await writePng(join(root, relativePath), size, foregroundSvg);
  console.log(`wrote ${relativePath} (${size}px)`);
}
