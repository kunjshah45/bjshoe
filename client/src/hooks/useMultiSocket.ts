import { useEffect } from 'react';
import { socket } from '../services/socket';
import { useGameStore } from '../store/gameStore';

// Lives at the App level (only when gameMode === 'multi') so listeners survive
// the Lobby ↔ Table screen switch. LobbyScreen previously owned these and tore
// them down on unmount, which silently dropped every game_state after Start
// Round — making Deal appear broken.
export function useMultiSocket() {
  const setConnected = useGameStore((s) => s.setConnected);
  const setRoom = useGameStore((s) => s.setRoom);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleGameState = (gameState: any) => {
      setRoom(gameState);
      const { player, updatePlayer } = useGameStore.getState();
      const me = gameState.players?.find((p: any) => p.id === player.id);
      if (me && (me.chips !== player.chips || me.lastBet !== player.lastBet)) {
        updatePlayer({ chips: me.chips, lastBet: me.lastBet });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('game_state', handleGameState);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('game_state', handleGameState);
      socket.disconnect();
    };
  }, [setConnected, setRoom]);
}
