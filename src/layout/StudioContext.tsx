import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { PlayableSound } from '../audio/audioGraphPlan';
import type { MixerState } from '../domain/mixer';
import type { SleepTimerPresetMinutes } from '../domain/sleepTimer';
import type { CustomTrack } from '../storage/customLibrary';

export interface StudioContextValue {
  mixer: MixerState;
  setMixer: Dispatch<SetStateAction<MixerState>>;
  customTracks: CustomTrack[];
  importStatus: string;
  allSounds: PlayableSound[];
  selectedLayers: Array<{ layer: MixerState['layers'][number]; sound: PlayableSound }>;
  handleImport: (files: FileList | null) => Promise<void>;
  handleDeleteCustomTrack: (track: CustomTrack) => Promise<void>;
  handlePlayToggle: () => Promise<void>;
  sleepTimerRemainingLabel: string;
  sleepTimerActive: boolean;
  sleepTimerFading: boolean;
  startSleepTimer: (minutes: SleepTimerPresetMinutes) => void;
  cancelSleepTimer: () => void;
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
