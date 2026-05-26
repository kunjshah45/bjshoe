import 'react-native-get-random-values';
import React, { useState } from 'react';
import { useGameStore } from './src/store/gameStore';
import { useActiveRoom } from './src/hooks/useActiveRoom';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { TableScreen } from './src/screens/TableScreen';
import { useMultiSocket } from './src/hooks/useMultiSocket';

function MultiRoot() {
  useMultiSocket();
  const room = useActiveRoom();
  if (!room || room.status === 'waiting') return <LobbyScreen />;
  return <TableScreen />;
}

export default function App() {
  const gameMode = useGameStore((s) => s.gameMode);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  if (showHowToPlay) return <HowToPlayScreen onBack={() => setShowHowToPlay(false)} />;
  if (gameMode === null) return <ModeSelectScreen onHowToPlay={() => setShowHowToPlay(true)} />;
  if (gameMode === 'solo') return <TableScreen />;
  return <MultiRoot />;
}
