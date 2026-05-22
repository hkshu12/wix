import Dexie, { type Table } from 'dexie'
import type { CustomSoundRecord } from '../audio/types'

class AmbientDatabase extends Dexie {
  customSounds!: Table<CustomSoundRecord, string>

  constructor() {
    super('AmbientMixDB')
    this.version(1).stores({
      customSounds: 'id, name, createdAt',
    })
  }
}

export const db = new AmbientDatabase()

export async function saveCustomSound(
  name: string,
  blob: Blob,
): Promise<CustomSoundRecord> {
  const record: CustomSoundRecord = {
    id: crypto.randomUUID(),
    name,
    mimeType: blob.type || 'audio/mpeg',
    size: blob.size,
    createdAt: Date.now(),
    blob,
  }
  await db.customSounds.add(record)
  return record
}

export async function listCustomSounds(): Promise<CustomSoundRecord[]> {
  return db.customSounds.orderBy('createdAt').reverse().toArray()
}

export async function deleteCustomSound(id: string): Promise<void> {
  await db.customSounds.delete(id)
}

export async function getCustomSound(id: string): Promise<CustomSoundRecord | undefined> {
  return db.customSounds.get(id)
}
