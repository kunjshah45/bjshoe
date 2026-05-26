import { useGameStore } from '../store/gameStore';
import { useSoloStore } from '../store/soloStore';

export function useActiveRoom() {
  const gameMode = useGameStore((s) => s.gameMode);
  const multiRoom = useGameStore((s) => s.room);
  const soloRoom = useSoloStore((s) => s.room);
  return gameMode === 'solo' ? soloRoom : multiRoom;
}
