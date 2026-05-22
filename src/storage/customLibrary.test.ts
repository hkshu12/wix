import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCustomTrack, listCustomTracks, revokeCustomTrackUrls, saveCustomTrack } from './customLibrary';

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
