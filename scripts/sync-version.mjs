#!/usr/bin/env node
/**
 * Sync package.json and Android version fields from VERSION (e.g. 1.2.3).
 * Usage: VERSION=1.2.3 node scripts/sync-version.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.env.VERSION?.replace(/^v/i, '');

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error('VERSION must be a semver like 1.2.3 (optional leading v).');
  process.exit(1);
}

const [major, minor, patch] = version.split('.').map((part) => Number.parseInt(part, 10));
const versionCode = major * 10_000 + minor * 100 + patch;

const packagePath = path.join(root, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.version = version;
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const gradlePath = path.join(root, 'android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
writeFileSync(gradlePath, gradle);

console.log(`Synced version ${version} (versionCode ${versionCode})`);
