import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { startBgMusic, stopBgMusic, setBgMusicVolume } from '../services/audio';

// Drives the background music lifecycle:
//   - Plays while gameMode is 'solo' or 'multi' AND settings.backgroundMusic is on
//   - Pauses on ModeSelect (gameMode === null) or when the toggle goes off
//   - Pauses when the tab is hidden (visibilitychange) — fixes "music keeps
//     playing after I close the window" on macOS Chrome / installed PWAs
//   - Pauses on pagehide / beforeunload as a final safety net
//   - Live-updates volume when settings.musicVolume changes
// Browser autoplay rules apply: the actual .play() only succeeds once the
// user has gestured (which they do by clicking Play Solo / Play with Friends).
export function useBgMusic() {
  const gameMode = useGameStore((s) => s.gameMode);
  const backgroundMusic = useSettingsStore((s) => s.backgroundMusic);
  const musicVolume = useSettingsStore((s) => s.musicVolume);

  // Mirror the desired playing state in a ref so the visibility listener can
  // read the current intent without re-binding on every render.
  const shouldPlayRef = useRef(false);
  shouldPlayRef.current = !!gameMode && backgroundMusic;

  useEffect(() => {
    if (gameMode && backgroundMusic) {
      startBgMusic();
    } else {
      stopBgMusic();
    }
  }, [gameMode, backgroundMusic]);

  useEffect(() => {
    setBgMusicVolume(musicVolume / 100);
  }, [musicVolume]);

  // Visibility + unload listeners — only meaningful on web.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopBgMusic();
      } else if (document.visibilityState === 'visible' && shouldPlayRef.current) {
        startBgMusic();
      }
    };
    const handleHide = () => stopBgMusic();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleHide);
    window.addEventListener('beforeunload', handleHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleHide);
      window.removeEventListener('beforeunload', handleHide);
    };
  }, []);
}
