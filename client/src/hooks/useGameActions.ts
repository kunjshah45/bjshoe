import { useGameStore } from '../store/gameStore';
import { useSoloStore } from '../store/soloStore';
import { useSettingsStore } from '../store/settingsStore';
import { socket } from '../services/socket';

type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

export interface GameActions {
  startRound: () => void;
  placeBet: (amount: number) => void;
  playerAction: (action: Action) => void;
  placeInsurance: (amount: number) => void;
  declineInsurance: () => void;
  closeInsurancePhase: () => void;
  emitSettings: () => void;
}

export function useGameActions(): GameActions {
  const gameMode = useGameStore((s) => s.gameMode);
  const getSettings = useSettingsStore((s) => s.getGameSettings);
  const solo = useSoloStore.getState;

  if (gameMode === 'solo') {
    return {
      startRound: () => solo().startRound(),
      placeBet: (amount) => solo().placeBet(amount),
      playerAction: (action) => solo().playerAction(action),
      placeInsurance: (amount) => solo().placeInsurance(amount),
      declineInsurance: () => solo().declineInsurance(),
      closeInsurancePhase: () => solo().closeInsurancePhase(),
      emitSettings: () => {
        // Settings are read live from the store on next solo round; no server emit.
      },
    };
  }

  return {
    startRound: () => socket.emit('start_round'),
    placeBet: (amount) => socket.emit('place_bet', { amount }),
    playerAction: (action) => socket.emit('player_action', { action }),
    placeInsurance: (amount) => socket.emit('place_insurance', { amount }),
    declineInsurance: () => socket.emit('decline_insurance'),
    closeInsurancePhase: () => socket.emit('close_insurance_phase'),
    emitSettings: () => socket.emit('update_settings', getSettings()),
  };
}
