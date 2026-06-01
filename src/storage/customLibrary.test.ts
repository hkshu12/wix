import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCustomTrack, importStoredCustomTrack, listCustomTracks, listStoredCustomTracks, revokeCustomTrackUrls, saveCustomTrack } from './customLibrary';

describe('custom sound library persistence', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('white-noise-mixer-test');
  });

  it('persists imported audio files with retrievable metadata and object URLs', async () => {
    const file = new File(['audio-bytes'], 'focus-loop.mp3', { type: 'audio/mpeg' });

    const saved = await saveCustomTrack(file, { databaseName: 'white-noise-mixer-test' });
    const tracks = await listCustomTracks({ databaseName: 'white-noise-mixer-test' });

    expect(saved.title).toBe('focus-loop');
    expect(saved.kind).toBe('custom');
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      id: saved.id,
      title: 'focus-loop',
      mimeType: 'audio/mpeg',
      size: file.size
    });
    expect(tracks[0].objectUrl).toMatch(/^blob:/);
  });

  it('deletes imported tracks by id', async () => {
    const saved = await saveCustomTrack(new File(['x'], 'wave.wav', { type: 'audio/wav' }), {
      databaseName: 'white-noise-mixer-test'
    });

    await deleteCustomTrack(saved.id, { databaseName: 'white-noise-mixer-test' });

    expect(await listCustomTracks({ databaseName: 'white-noise-mixer-test' })).toEqual([]);
  });

  it('imports stored track bytes without preserving the original id', async () => {
    const bytes = new TextEncoder().encode('stored-audio').buffer;
    const imported = await importStoredCustomTrack(
      {
        title: 'nap-loop',
        fileName: 'nap-loop.wav',
        mimeType: 'audio/wav',
        size: bytes.byteLength,
        createdAt: 1_700_000_000_000,
        bytes
      },
      { databaseName: 'white-noise-mixer-test' }
    );

    const stored = await listStoredCustomTracks({ databaseName: 'white-noise-mixer-test' });
    expect(imported.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(stored).toHaveLength(1);
    expect(new Uint8Array(stored[0].bytes)).toEqual(new Uint8Array(bytes));
  });

  it('preserves a provided track id on import', async () => {
    const bytes = new TextEncoder().encode('stored-audio').buffer;
    const trackId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const imported = await importStoredCustomTrack(
      {
        id: trackId,
        title: 'nap-loop',
        fileName: 'nap-loop.wav',
        mimeType: 'audio/wav',
        size: bytes.byteLength,
        createdAt: 1_700_000_000_000,
        bytes
      },
      { databaseName: 'white-noise-mixer-test' }
    );

    expect(imported.id).toBe(trackId);
    expect((await listCustomTracks({ databaseName: 'white-noise-mixer-test' }))[0]?.id).toBe(trackId);
  });

  it('revokes generated object URLs without touching non-blob URLs', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    revokeCustomTrackUrls([
      { objectUrl: 'blob:first' },
      { objectUrl: 'https://example.com/audio.mp3' },
      { objectUrl: 'blob:second' }
    ]);

    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith('blob:first');
    expect(revoke).toHaveBeenCalledWith('blob:second');
    revoke.mockRestore();
  });
});
