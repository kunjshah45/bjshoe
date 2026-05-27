import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { startBgMusic, stopBgMusic, setBgMusicVolume } from '../services/audio';

// Drives the background music lifecycle:
//   - Plays while gameMode is 'solo' or 'multi' AND settings.backgroundMusic is on
//   - Pauses on ModeSelect (gameMode === null) or when the toggle goes off
//   - Live-updates volume when settings.musicVolume changes
// Browser autoplay rules apply: the actual .play() only succeeds once the
// user has gestured (which they do by clicking Play Solo / Play with Friends).
export function useBgMusic() {
  const gameMode = useGameStore((s) => s.gameMode);
  const backgroundMusic = useSettingsStore((s) => s.backgroundMusic);
  const musicVolume = useSettingsStore((s) => s.musicVolume);

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
}
