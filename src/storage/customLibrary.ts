import { readFileAsArrayBuffer, type FileReadProgress } from '../lib/readFileWithProgress';

export interface CustomLibraryOptions {
  databaseName?: string;
  onReadProgress?: (progress: FileReadProgress) => void;
}

export interface CustomTrack {
  id: string;
  kind: 'custom';
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
  objectUrl: string;
}

interface StoredCustomTrack extends Omit<CustomTrack, 'objectUrl'> {
  bytes: ArrayBuffer;
}

const STORE_NAME = 'tracks';
export const CUSTOM_LIBRARY_DATABASE_NAME = 'white-noise-mixer';
const DEFAULT_DATABASE = CUSTOM_LIBRARY_DATABASE_NAME;

export async function saveCustomTrack(file: File, options: CustomLibraryOptions = {}): Promise<CustomTrack> {
  const db = await openDatabase(options.databaseName);
  const id = createTrackId();
  const storedTrack: StoredCustomTrack = {
    id,
    kind: 'custom',
    title: stripExtension(file.name),
    fileName: file.name,
    mimeType: file.type || 'audio/mpeg',
    size: file.size,
    createdAt: Date.now(),
    bytes: await readFileAsArrayBuffer(file, options.onReadProgress)
  };

  await writeToStore(db, 'readwrite', (store) => store.put(storedTrack));
  db.close();

  return toCustomTrack(storedTrack);
}

export async function listCustomTracks(options: CustomLibraryOptions = {}): Promise<CustomTrack[]> {
  const db = await openDatabase(options.databaseName);
  const storedTracks = await readAllFromStore(db);
  db.close();

  return storedTracks.sort((left, right) => right.createdAt - left.createdAt).map(toCustomTrack);
}

export async function deleteCustomTrack(id: string, options: CustomLibraryOptions = {}): Promise<void> {
  const db = await openDatabase(options.databaseName);

  await writeToStore(db, 'readwrite', (store) => store.delete(id));
  db.close();
}

export function clearCustomLibrary(databaseName = DEFAULT_DATABASE): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onerror = () => reject(request.error ?? new Error('Failed to delete custom library database'));
    request.onsuccess = () => resolve();
    request.onblocked = () => resolve();
  });
}

export function revokeCustomTrackUrls(tracks: Array<Pick<CustomTrack, 'objectUrl'>>): void {
  for (const track of tracks) {
    if (track.objectUrl.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(track.objectUrl);
    }
  }
}

function openDatabase(databaseName = DEFAULT_DATABASE): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function writeToStore<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function readAllFromStore(db: IDBDatabase): Promise<StoredCustomTrack[]> {
  return writeToStore(db, 'readonly', (store) => store.getAll() as IDBRequest<StoredCustomTrack[]>);
}

function toCustomTrack(track: StoredCustomTrack): CustomTrack {
  return {
    id: track.id,
    kind: track.kind,
    title: track.title,
    fileName: track.fileName,
    mimeType: track.mimeType,
    size: track.size,
    createdAt: track.createdAt,
    objectUrl: createObjectUrl(new Blob([track.bytes], { type: track.mimeType }), track.id)
  };
}

function createObjectUrl(blob: Blob, id: string): string {
  if (typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }

  return `blob:${id}`;
}

function createTrackId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `track-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '') || fileName;
}
