import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Room, Player } from '@blackjack/shared';

const STORAGE_KEY = 'blackjack-player';
const MODE_STORAGE_KEY = 'blackjack-mode';
const LAST_ROOM_STORAGE_KEY = 'blackjack-last-room';
export const STARTING_CHIPS = 1000;

const hasLocalStorage = typeof window !== 'undefined' && !!window.localStorage;

export type GameMode = 'solo' | 'multi' | null;

const ADJECTIVES = [
  'Lucky', 'Wild', 'Cool', 'Lone', 'Silver', 'Royal', 'Diamond',
  'Vegas', 'Quick', 'Smooth', 'High', 'Sly', 'Bold', 'Iron', 'Neon',
];
const NOUNS = [
  'Ace', 'King', 'Joker', 'Shark', 'Card', 'Bet', 'Chip', 'Star',
  'Stack', 'Wolf', 'Fox', 'Hawk', 'Dealer', 'Player',
];

function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${adj}${noun}${num}`;
}

function loadPersistedPlayer(): Player | null {
  if (!hasLocalStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Player>;
    if (!parsed.id || !parsed.nickname) return null;
    return {
      id: parsed.id,
      nickname: parsed.nickname,
      chips: typeof parsed.chips === 'number' ? parsed.chips : STARTING_CHIPS,
      lastBet: typeof parsed.lastBet === 'number' ? parsed.lastBet : 10,
    };
  } catch {
    return null;
  }
}

function persistPlayer(p: Player | null) {
  if (!hasLocalStorage) return;
  try {
    if (p) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function loadPersistedMode(): GameMode {
  if (!hasLocalStorage) return null;
  const raw = window.localStorage.getItem(MODE_STORAGE_KEY);
  return raw === 'solo' || raw === 'multi' ? raw : null;
}

function persistMode(mode: GameMode) {
  if (!hasLocalStorage) return;
  if (mode === null) window.localStorage.removeItem(MODE_STORAGE_KEY);
  else window.localStorage.setItem(MODE_STORAGE_KEY, mode);
}

function loadPersistedLastRoom(): string | null {
  if (!hasLocalStorage) return null;
  return window.localStorage.getItem(LAST_ROOM_STORAGE_KEY);
}

function persistLastRoom(code: string | null) {
  if (!hasLocalStorage) return;
  if (!code) window.localStorage.removeItem(LAST_ROOM_STORAGE_KEY);
  else window.localStorage.setItem(LAST_ROOM_STORAGE_KEY, code);
}

function getOrCreatePlayer(): Player {
  const persisted = loadPersistedPlayer();
  if (persisted) return persisted;
  return {
    id: uuidv4(),
    nickname: generateNickname(),
    chips: STARTING_CHIPS,
    lastBet: 10,
  };
}

interface GameState {
  player: Player;
  room: Room | null;
  isConnected: boolean;
  gameMode: GameMode;
  lastRoomCode: string | null;
  setPlayer: (player: Player) => void;
  updatePlayer: (patch: Partial<Player>) => void;
  setRoom: (room: Room | null) => void;
  setConnected: (status: boolean) => void;
  setGameMode: (mode: GameMode) => void;
  setLastRoomCode: (code: string | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  player: getOrCreatePlayer(),
  room: null,
  isConnected: false,
  gameMode: loadPersistedMode(),
  lastRoomCode: loadPersistedLastRoom(),
  setPlayer: (player) => set({ player }),
  updatePlayer: (patch) => set({ player: { ...get().player, ...patch } }),
  setRoom: (room) => set({ room }),
  setConnected: (isConnected) => set({ isConnected }),
  setGameMode: (gameMode) => set({ gameMode }),
  setLastRoomCode: (lastRoomCode) => set({ lastRoomCode }),
}));

// Persist player, mode, last room whenever they change.
useGameStore.subscribe((state) => {
  persistPlayer(state.player);
  persistMode(state.gameMode);
  persistLastRoom(state.lastRoomCode);
});
