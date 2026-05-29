import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { PlayableSound } from '../audio/audioGraphPlan';
import type { MixerState } from '../domain/mixer';
import type { CustomTrack } from '../storage/customLibrary';
import type { MixerPreset } from '../storage/mixerPresets';

export interface StudioContextValue {
  mixer: MixerState;
  setMixer: Dispatch<SetStateAction<MixerState>>;
  customTracks: CustomTrack[];
  importStatus: string;
  importProgress: number | null;
  allSounds: PlayableSound[];
  selectedLayers: Array<{ layer: MixerState['layers'][number]; sound: PlayableSound }>;
  handleImport: (files: FileList | null) => Promise<void>;
  exportCustomLibrary: () => Promise<string>;
  importCustomLibraryBackup: (files: FileList | null) => Promise<string>;
  exportMixerPresets: () => string;
  importMixerPresetsBackup: (files: FileList | null) => Promise<string>;
  exportFullAppBackup: () => Promise<string>;
  importFullAppBackup: (files: FileList | null) => Promise<string>;
  handleDeleteCustomTrack: (track: CustomTrack) => Promise<void>;
  handlePlayToggle: () => Promise<void>;
  sleepTimerRemainingLabel: string;
  sleepTimerActive: boolean;
  sleepTimerFading: boolean;
  sleepTimerFadeSeconds: number;
  setSleepTimerFadeSeconds: (seconds: number) => void;
  playbackFadeInSeconds: number;
  setPlaybackFadeInSeconds: (seconds: number) => void;
  screenWakeLockEnabled: boolean;
  screenWakeLockSupported: boolean;
  setScreenWakeLockEnabled: (enabled: boolean) => void;
  startSleepTimer: (minutes: number) => boolean;
  startSleepTimerAtClock: (hour: number, minute: number) => boolean;
  cancelSleepTimer: () => void;
  wakeTimerRemainingLabel: string;
  wakeTimerActive: boolean;
  wakeTimerFading: boolean;
  wakeTimerFadeSeconds: number;
  setWakeTimerFadeSeconds: (seconds: number) => void;
  startWakeTimer: (minutes: number) => boolean;
  startWakeTimerAtClock: (hour: number, minute: number) => boolean;
  cancelWakeTimer: () => void;
  mixerPresets: MixerPreset[];
  saveMixerPreset: (name: string) => void;
  loadMixerPreset: (id: string) => void;
  renameMixerPreset: (id: string, name: string) => void;
  deleteMixerPreset: (id: string) => void;
  copyMixerShare: () => Promise<void>;
  copyMixerShareLink: () => Promise<void>;
  pasteMixerShareFromClipboard: () => Promise<string | null>;
  importMixerShare: (text: string) => void;
  failedSoundIds: string[];
  retryLayerLoad: (soundId: string) => void;
  clearAllAppData: () => Promise<void>;
  /** Call from a user gesture (e.g. landing CTA) so restored mixes can autoplay on studio. */
  primeAudioContext: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ value, children }: { value: StudioContextValue; children: ReactNode }) {
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within AppLayout');
  }
  return ctx;
}
