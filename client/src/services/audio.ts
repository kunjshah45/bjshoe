// Simple HTML5 Audio wrapper for the web build. Lazily preloads each SFX
// once and reuses a small pool of clones so rapid-fire plays (chip clicks)
// don't cut each other off. No-op on native (we're web-only for now).

import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

type SfxId = 'chipClick' | 'win' | 'blackjack' | 'lose' | 'settings';

const SFX_PATHS: Record<SfxId, string> = {
  chipClick: '/audio/setting-sound-2.mp3',
  win: '/audio/winning.mp3',
  blackjack: '/audio/winning-1-blackjack.mp3',
  lose: '/audio/lossing.mp3',
  settings: '/audio/setting-sound-1.mp3',
};

const PRELOADED: Partial<Record<SfxId, HTMLAudioElement>> = {};

function isWeb(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

function preload(id: SfxId): HTMLAudioElement | undefined {
  if (!isWeb()) return undefined;
  if (PRELOADED[id]) return PRELOADED[id];
  const el = new Audio(SFX_PATHS[id]);
  el.preload = 'auto';
  PRELOADED[id] = el;
  return el;
}

// Preload all SFX on first import on the web. Cheap (browsers handle Range
// requests well and these files are tiny).
if (isWeb()) {
  (Object.keys(SFX_PATHS) as SfxId[]).forEach(preload);
}

export function playSfx(id: SfxId, volume: number = 1.0): void {
  if (!isWeb()) return;
  if (!useSettingsStore.getState().soundEffects) return;
  const base = preload(id);
  if (!base) return;
  // Clone so overlapping plays (multiple rapid chip clicks) don't cancel.
  const node = base.cloneNode(true) as HTMLAudioElement;
  node.volume = Math.max(0, Math.min(1, volume));
  // Browsers block autoplay until first user gesture; .play() returns a Promise
  // that rejects in that case. Swallow it — the first click satisfies the
  // gesture requirement, so subsequent plays succeed.
  void node.play().catch(() => {});
}
