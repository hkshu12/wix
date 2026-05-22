import Dexie, { type Table } from 'dexie'

export type CustomTrackRow = {
  id: string
  name: string
  addedAt: number
  data: ArrayBuffer
}

class CustomTrackDatabase extends Dexie {
  tracks!: Table<CustomTrackRow, string>

  constructor() {
    super('ambient-mixer-db')
    this.version(1).stores({
      tracks: 'id, addedAt, name',
    })
  }
}

export const customTrackDb = new CustomTrackDatabase()

export async function saveCustomTrack(name: string, data: ArrayBuffer): Promise<CustomTrackRow> {
  const id = crypto.randomUUID()
  const row: CustomTrackRow = { id, name, addedAt: Date.now(), data }
  await customTrackDb.tracks.put(row)
  return row
}

export async function listCustomTracks(): Promise<CustomTrackRow[]> {
  return customTrackDb.tracks.orderBy('addedAt').reverse().toArray()
}

export async function deleteCustomTrack(id: string): Promise<void> {
  await customTrackDb.tracks.delete(id)
}
