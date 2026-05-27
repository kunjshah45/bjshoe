import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { useGameStore } from './src/store/gameStore';
import { useActiveRoom } from './src/hooks/useActiveRoom';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { TableScreen } from './src/screens/TableScreen';
import { useMultiSocket } from './src/hooks/useMultiSocket';
import { useBgMusic } from './src/hooks/useBgMusic';
import { FEATURES } from './src/config';

function MultiRoot() {
  useMultiSocket();
  const room = useActiveRoom();
  if (!room || room.status === 'waiting') return <LobbyScreen />;
  return <TableScreen />;
}

export default function App() {
  const gameMode = useGameStore((s) => s.gameMode);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  useBgMusic();

  // If a returning user has gameMode === 'multi' from localStorage but the
  // current build has multiplayer disabled, drop them back to mode select.
  useEffect(() => {
    if (!FEATURES.multiplayer && gameMode === 'multi') {
      setGameMode(null);
    }
  }, [gameMode, setGameMode]);

  if (showHowToPlay) return <HowToPlayScreen onBack={() => setShowHowToPlay(false)} />;
  if (gameMode === null) return <ModeSelectScreen onHowToPlay={() => setShowHowToPlay(true)} />;
  if (gameMode === 'solo') return <TableScreen />;
  if (!FEATURES.multiplayer) return <ModeSelectScreen onHowToPlay={() => setShowHowToPlay(true)} />;
  return <MultiRoot />;
}
