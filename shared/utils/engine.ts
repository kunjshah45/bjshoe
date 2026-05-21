import { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

/**
 * Creates a standard shoe with the specified number of decks
 */
export function createShoe(deckCount: number): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ suit, rank, faceUp: false });
      }
    }
  }
  return shoe;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleShoe(shoe: Card[]): Card[] {
  const shuffled = [...shoe];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculates the best possible value of a hand.
 * Returns both the numeric value and whether it is "soft" (contains an Ace counted as 11).
 */
export function calculateHandValue(cards: Card[]): { total: number; isSoft: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }

  // Adjust for Aces if busted
  let isSoft = aces > 0;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
    if (aces === 0) isSoft = false;
  }

  return { total, isSoft };
}

/**
 * Checks if a hand is a Natural Blackjack (21 in the first two cards)
 */
export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const { total } = calculateHandValue(cards);
  return total === 21;
}

/**
 * Checks if a hand is busted
 */
export function isBusted(cards: Card[]): boolean {
  return calculateHandValue(cards).total > 21;
}

/**
 * Draws a card from the shoe
 */
export function drawCard(shoe: Card[], faceUp: boolean = true): { card: Card; newShoe: Card[] } {
  if (shoe.length === 0) throw new Error("Shoe is empty!");
  const newShoe = [...shoe];
  const card = { ...newShoe.pop()!, faceUp };
  return { card, newShoe };
}
