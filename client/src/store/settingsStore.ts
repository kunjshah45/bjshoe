import { create } from 'zustand';
import { GameSettings } from '@blackjack/shared';

// Extended settings type that includes UI/audio settings
export interface AppSettings extends GameSettings {
  soundEffects: boolean;
  backgroundMusic: boolean;
  musicVolume: number; // 0-100
  animationSpeed: 'normal' | 'fast' | 'instant';
}

export const DEFAULT_SETTINGS: AppSettings = {
  deckCount: 6,
  dealerHitsSoft17: true,
  askInsurance: true,
  autoLastBet: true,
  soundEffects: true,
  backgroundMusic: true,
  musicVolume: 50,
  animationSpeed: 'normal',
};

interface SettingsState extends AppSettings {
  setDeckCount: (count: 2 | 4 | 6 | 8 | 10) => void;
  setDealerHitsSoft17: (value: boolean) => void;
  setAskInsurance: (value: boolean) => void;
  setAutoLastBet: (value: boolean) => void;
  setSoundEffects: (value: boolean) => void;
  setBackgroundMusic: (value: boolean) => void;
  setMusicVolume: (value: number) => void;
  setAnimationSpeed: (speed: 'normal' | 'fast' | 'instant') => void;
  resetToDefaults: () => void;
  getGameSettings: () => GameSettings;
}

const STORAGE_KEY = 'blackjack-settings';

const hasLocalStorage = typeof window !== 'undefined' && !!window.localStorage;

function loadPersistedSettings(): AppSettings {
  if (!hasLocalStorage) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(state: AppSettings) {
  if (!hasLocalStorage) return;
  try {
    const toPersist: AppSettings = {
      deckCount: state.deckCount,
      dealerHitsSoft17: state.dealerHitsSoft17,
      askInsurance: state.askInsurance,
      autoLastBet: state.autoLastBet,
      soundEffects: state.soundEffects,
      backgroundMusic: state.backgroundMusic,
      musicVolume: state.musicVolume,
      animationSpeed: state.animationSpeed,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    // ignore quota / serialization errors
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadPersistedSettings(),

  setDeckCount: (count) => set({ deckCount: count }),
  setDealerHitsSoft17: (value) => set({ dealerHitsSoft17: value }),
  setAskInsurance: (value) => set({ askInsurance: value }),
  setAutoLastBet: (value) => set({ autoLastBet: value }),
  setSoundEffects: (value) => set({ soundEffects: value }),
  setBackgroundMusic: (value) => set({ backgroundMusic: value }),
  setMusicVolume: (value) => set({ musicVolume: Math.max(0, Math.min(100, value)) }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  resetToDefaults: () => set(DEFAULT_SETTINGS),

  getGameSettings: () => {
    const state = get();
    return {
      deckCount: state.deckCount,
      dealerHitsSoft17: state.dealerHitsSoft17,
      askInsurance: state.askInsurance,
      autoLastBet: state.autoLastBet,
    };
  },
}));

// Save to localStorage whenever any persisted field changes.
useSettingsStore.subscribe((state) => persistSettings(state));
