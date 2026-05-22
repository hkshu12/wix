#!/usr/bin/env node
/** Icons generated via ffmpeg in CI/setup — see README */
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/icons')
if (!existsSync(join(dir, 'icon-192.png'))) {
  console.warn('Run: ffmpeg to generate icons, or use public/favicon.svg')
}
