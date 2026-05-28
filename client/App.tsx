import 'react-native-get-random-values';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useGameStore } from './src/store/gameStore';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { TableScreen } from './src/screens/TableScreen';
import { useBgMusic } from './src/hooks/useBgMusic';
import { FEATURES } from './src/config';

// Lazy-loaded: HowToPlayScreen and MultiRoot pull their own dependency
// trees (multi pulls socket.io, lobby, useMultiSocket). Keeping them
// out of the initial bundle so solo users get a faster first paint.
const HowToPlayScreen = lazy(() => import('./src/screens/HowToPlayScreen').then((m) => ({ default: m.HowToPlayScreen })));
const MultiRoot = lazy(() => import('./src/screens/MultiRoot'));

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
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

  if (showHowToPlay) {
    return (
      <Suspense fallback={<Loading />}>
        <HowToPlayScreen onBack={() => setShowHowToPlay(false)} />
      </Suspense>
    );
  }
  if (gameMode === null) return <ModeSelectScreen onHowToPlay={() => setShowHowToPlay(true)} />;
  if (gameMode === 'solo') return <TableScreen />;
  if (!FEATURES.multiplayer) return <ModeSelectScreen onHowToPlay={() => setShowHowToPlay(true)} />;
  return (
    <Suspense fallback={<Loading />}>
      <MultiRoot />
    </Suspense>
  );
}
