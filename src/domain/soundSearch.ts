import type { PlayableSound } from '../audio/audioGraphPlan';

function soundSearchHaystack(sound: PlayableSound): string {
  if (sound.kind === 'built-in') {
    return `${sound.title} ${sound.subtitle} ${sound.id}`;
  }

  return `${sound.title} ${sound.fileName}`;
}

/** Case-insensitive filter by title, subtitle, id, or custom file name. Empty query returns all sounds. */
export function filterSoundsByQuery(sounds: PlayableSound[], query: string): PlayableSound[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return sounds;
  }

  return sounds.filter((sound) => soundSearchHaystack(sound).toLowerCase().includes(normalized));
}
