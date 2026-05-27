import { describe, expect, it } from 'vitest';
import { createInitialMixerState, setMasterVolume, toggleLayer } from './mixer';
import { MIXER_SHARE_TYPE, MIXER_SHARE_VERSION, parseMixerShare, serializeMixerShare } from './mixerShare';

describe('mixerShare', () => {
  it('round-trips mixer globals and layers', () => {
    let state = createInitialMixerState();
    state = toggleLayer(state, 'rain');
    state = toggleLayer(state, 'ocean');
    state = setMasterVolume(state, 0.5);

    const json = serializeMixerShare(state);
    const parsed = parseMixerShare(json);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.snapshot.masterVolume).toBe(0.5);
    expect(parsed.snapshot.layers).toHaveLength(2);
    expect(parsed.snapshot.layers.map((layer) => layer.soundId).sort()).toEqual(['ocean', 'rain']);
  });

  it('rejects empty, invalid JSON, wrong type, and unsupported version', () => {
    expect(parseMixerShare('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(parseMixerShare('{not json')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(parseMixerShare(JSON.stringify({ type: 'other', version: 1 }))).toEqual({
      ok: false,
      reason: 'wrong-type'
    });
    expect(
      parseMixerShare(
        JSON.stringify({
          type: MIXER_SHARE_TYPE,
          version: MIXER_SHARE_VERSION + 1,
          masterVolume: 0.5,
          stereoWidth: 0.5,
          playbackRate: 1,
          layers: []
        })
      )
    ).toEqual({ ok: false, reason: 'unsupported-version' });
  });

  it('drops invalid layer entries but keeps valid ones', () => {
    const payload = {
      type: MIXER_SHARE_TYPE,
      version: MIXER_SHARE_VERSION,
      masterVolume: 0.8,
      stereoWidth: 0.6,
      playbackRate: 1,
      layers: [{ soundId: 'rain', volume: 0.7, pan: 0, playbackRate: 1, muted: false }, { soundId: '' }]
    };

    const result = parseMixerShare(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.layers).toHaveLength(1);
      expect(result.snapshot.layers[0]?.soundId).toBe('rain');
    }
  });
});
