export interface Player {
  id: string;
  nickname: string;
  chips: number;
  lastBet: number;
}

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface GameSettings {
  deckCount: 2 | 4 | 6 | 8 | 10;
  dealerHitsSoft17: boolean;
  askInsurance: boolean;
  autoLastBet: boolean;
}

export type RoomStatus = "waiting" | "betting" | "playing" | "resolving";

export type PlayerAction = "hit" | "stand" | "double" | "split" | "surrender" | "insurance";

export interface PlayerHand {
  id: string; // Unique hand ID (for splits)
  cards: Card[];
  bet: number;
  isFinished: boolean; // Did they bust, stand, etc?
  canSplit: boolean;
  canDouble: boolean;
  canSurrender: boolean; // Can surrender (first 2 cards only)
  insuranceBet?: number; // Side bet for insurance (when dealer shows Ace)
  result?: "win" | "loss" | "push" | "blackjack" | "surrender";
}

export interface ActivePlayerState {
  playerId: string;
  hands: PlayerHand[];
  currentHandIndex: number;
}

export interface Round {
  dealerCards: Card[];
  activePlayers: ActivePlayerState[];
  turnIndex: number; // Whose turn is it in the activePlayers array? (-1 for betting, length for dealer)
  insuranceOffered: boolean; // Was insurance offered this round?
  insuranceClosed: boolean; // Can players still take insurance?
}

export interface Room {
  id: string;
  hostId: string;
  players: Player[]; // max 7
  status: RoomStatus;
  settings: GameSettings;
  shoe: Card[]; // server-authoritative, client won't receive the full shoe
  currentRound: Round | null;
}

// WebSocket Payload Types
export interface PlaceBetPayload {
  playerId: string;
  amount: number;
}

export interface PlayerActionPayload {
  playerId: string;
  action: PlayerAction;
}

export interface InsurancePayload {
  playerId: string;
  takeInsurance: boolean; // true = place insurance bet, false = decline
}
