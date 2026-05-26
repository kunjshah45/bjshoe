import { create } from 'zustand';
import {
  Room,
  GameSettings,
  createShoe,
  shuffleShoe,
  startBettingPhase,
  placeBet as enginePlaceBet,
  handlePlayerAction as engineHandleAction,
  placeInsuranceBet as enginePlaceInsurance,
  declineInsurance as engineDeclineInsurance,
  closeInsurancePhase as engineCloseInsurance,
} from '@blackjack/shared';
import { useGameStore, STARTING_CHIPS } from './gameStore';

interface SoloState {
  room: Room | null;
  startGame: (settings: GameSettings) => void;
  startRound: () => void;
  placeBet: (amount: number) => void;
  playerAction: (action: 'hit' | 'stand' | 'double' | 'split' | 'surrender') => void;
  placeInsurance: (amount: number) => void;
  declineInsurance: () => void;
  closeInsurancePhase: () => void;
  claimFreeChips: () => void;
  endGame: () => void;
}

function syncPlayerChips(room: Room) {
  const me = room.players[0];
  if (!me) return;
  useGameStore.getState().updatePlayer({
    chips: me.chips,
    lastBet: me.lastBet,
  });
}

// Mutate the engine's view of the player so chip changes during a round take effect.
function applyExternalChips(room: Room, chips: number) {
  if (room.players[0]) room.players[0].chips = chips;
}

export const useSoloStore = create<SoloState>((set, get) => ({
  room: null,

  startGame: (settings) => {
    const player = useGameStore.getState().player;
    const room: Room = {
      id: 'solo',
      hostId: player.id,
      players: [{ ...player }],
      status: 'waiting',
      settings,
      shoe: shuffleShoe(createShoe(settings.deckCount)),
      currentRound: null,
    };
    set({ room });
  },

  startRound: () => {
    const room = get().room;
    if (!room) return;
    startBettingPhase(room);
    set({ room: { ...room } });
  },

  placeBet: (amount) => {
    const room = get().room;
    if (!room) return;
    const player = useGameStore.getState().player;
    applyExternalChips(room, player.chips);
    enginePlaceBet(room, player.id, amount);
    syncPlayerChips(room);
    set({ room: { ...room } });
  },

  playerAction: (action) => {
    const room = get().room;
    if (!room) return;
    const player = useGameStore.getState().player;
    applyExternalChips(room, player.chips);
    engineHandleAction(room, player.id, action);
    syncPlayerChips(room);
    set({ room: { ...room } });
  },

  placeInsurance: (amount) => {
    const room = get().room;
    if (!room) return;
    const player = useGameStore.getState().player;
    applyExternalChips(room, player.chips);
    enginePlaceInsurance(room, player.id, amount);
    syncPlayerChips(room);
    set({ room: { ...room } });
  },

  declineInsurance: () => {
    const room = get().room;
    if (!room) return;
    const player = useGameStore.getState().player;
    engineDeclineInsurance(room, player.id);
    set({ room: { ...room } });
  },

  closeInsurancePhase: () => {
    const room = get().room;
    if (!room) return;
    engineCloseInsurance(room);
    syncPlayerChips(room);
    set({ room: { ...room } });
  },

  claimFreeChips: () => {
    useGameStore.getState().updatePlayer({ chips: STARTING_CHIPS });
    const room = get().room;
    if (room) {
      applyExternalChips(room, STARTING_CHIPS);
      set({ room: { ...room } });
    }
  },

  endGame: () => set({ room: null }),
}));
