# 🃏 Blackjack Game — Product Requirements Document

> A free-to-play, browser-based Blackjack experience with multiplayer rooms, immersive UI, and strategic ad monetization.

---

## 📌 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Game Rules & Logic](#game-rules--logic)
4. [Resolution & Payout Matrix](#resolution--payout-matrix)
5. [Features](#features)
6. [Multiplayer Room System](#multiplayer-room-system)
7. [Settings](#settings)
8. [UI/UX Design](#uiux-design)
9. [Sound & Music](#sound--music)
10. [Ad Monetization Strategy](#ad-monetization-strategy)
11. [Architecture Overview](#architecture-overview)
12. [Data Models](#data-models)
13. [API Endpoints](#api-endpoints)
14. [Screens & User Flows](#screens--user-flows)
15. [Out of Scope](#out-of-scope)

---

## Project Overview

A polished, addictive Blackjack web game playable anonymously or with friends via room codes. Inspired by [247blackjack.com](https://www.247blackjack.com/), but with richer multiplayer capabilities, deeper settings, atmospheric UI, and a non-intrusive ad layer designed to maximize session time and revenue.

**Core Goals:**

- Maximize time-on-site through engaging UX, music, and social play
- Monetize via tasteful, non-disruptive ad placements
- Support solo play (vs. dealer) and multiplayer rooms (vs. friends + dealer)
- Zero sign-up required — full anonymous play supported

---

## Tech Stack

### Client (Frontend)
- **Framework:** Expo / React Native (supports iOS, Android, and Web from a single codebase)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind for React Native) or StyleSheet
- **Animations:** React Native Reanimated (for 60fps card flips and chip tosses)
- **State Management:** Zustand
- **Audio:** Expo-AV (replaces Howler.js for better native support)

### Server (Backend)
- **Runtime:** Node.js + Express
- **Language:** TypeScript (shared models with client)
- **Real-time:** Socket.IO
- **Database:** PostgreSQL (with Prisma or Drizzle ORM)
- **In-Memory Cache:** Redis (for fast, ephemeral room state)

---

## Game Rules & Logic

### Deck & Shuffle

- Supported deck counts: **2, 4, 6, 8, 10** (user configurable)
- Deck is shuffled using a **cryptographically random Fisher-Yates shuffle**
- Cards are dealt from the top of the shoe; each draw is truly random from the remaining cards
- A **cut card** is placed at 75% of shoe depth; reshuffle triggers at the start of the next round when reached

### Card Values

| Card    | Value                               |
| ------- | ----------------------------------- |
| 2–10    | Face value                          |
| J, Q, K | 10                                  |
| Ace     | 1 or 11 (whichever keeps hand ≤ 21) |

### Turn Order

1. Player places bet
2. Dealer deals 2 cards to player (face up), 2 to self (1 face up, 1 hole card)
3. **Insurance offered** if dealer shows Ace (if enabled in settings)
4. Player acts: Hit / Stand / Double Down / Split / Surrender
5. Dealer reveals hole card and acts per dealer rules
6. Resolution and payout

### Player Actions

| Action          | Condition                                           |
| --------------- | --------------------------------------------------- |
| **Hit**         | Always available (unless busted)                    |
| **Stand**       | Always available                                    |
| **Double Down** | First two cards only                                |
| **Split**       | Two cards of equal value (up to 3 splits = 4 hands) |
| **Surrender**   | First two cards only (late surrender)               |
| **Insurance**   | Dealer shows Ace + setting is ON                    |

### Dealer Rules

- Dealer always stands on hard 17
- **Dealer hits on soft 17**: Configurable (default: ON)
- Dealer reveals hole card only after player completes all actions

### Natural Blackjack

- An initial two-card hand totaling 21
- Pays **3:2**
- If dealer also has Blackjack → **Push**

### Bust

- Any hand exceeding 21 immediately loses

---

## Resolution & Payout Matrix

| Hand Condition               | Outcome                          | Payout Odds          |
| :--------------------------- | :------------------------------- | :------------------- |
| Player Hand > 21             | **Player Bust** (Immediate Loss) | Lose Bet             |
| Dealer Hand > 21             | **Dealer Bust** (Player Wins)    | 1:1                  |
| Player Total > Dealer Total  | **Player Wins**                  | 1:1                  |
| Dealer Total > Player Total  | **Dealer Wins**                  | Lose Bet             |
| Player Total == Dealer Total | **Push** (Tie)                   | 0:0 (Bet Returned)   |
| Initial Hand == 21           | **Natural Blackjack**            | 3:2                  |
| Insurance Win                | Dealer has Blackjack             | 2:1 on insurance bet |

---

## Features

### 👤 Player Identity

- Fully **anonymous play** — no account required
- Auto-generated avatar + nickname on first visit (e.g., "LuckyAce42")
- Identity stored in `localStorage` and session cookie
- Optional: player can customize their nickname before entering a room

### 🎮 Game Modes

1. **Solo vs. Dealer** — Classic single-player Blackjack
2. **Multiplayer Room** — Play alongside friends, all vs. the same dealer

### 💰 Betting System

- Starting chip balance: **$1,000** (free chips, resets on session or daily)
- Minimum bet: **$10** | Maximum bet: **$500** (per hand)
- Chip denominations: $10, $25, $50, $100, $500
- **Auto Last Bet** (configurable): Pre-fills the previous round's bet amount

### 🃏 Chip Balance & Session

- Balance stored in `localStorage` (anonymous session)
- If balance hits $0 → offer free chip reload ($500 topup, shown with an ad)
- No real money involved

---

## Multiplayer Room System

### Room Creation

- Host clicks **"Create Room"**
- System generates a **6-character alphanumeric join code** (e.g., `BJ7X2K`)
- Host shares code with friends
- Room holds up to **7 players** (standard Blackjack table)

### Joining a Room

- Guest enters join code on home screen
- Instantly joins if room is open; shown waiting screen if round in progress
- Late joiners spectate current round, join next

### Room Gameplay Flow

1. All players place bets simultaneously (30-second timer)
2. Cards dealt to each player in order (left to right), then dealer
3. Each player acts on their turn (30-second timer per action)
4. Dealer acts after all players
5. Resolution shown simultaneously for all players
6. Next round begins automatically after 10-second pause

### Room State (via WebSocket)

- Real-time sync of: bets, cards, actions, chip balances
- Players can see each other's hands and chip counts
- Live chat (optional): emoji reactions only (👏🎉😱😤)

---

## Settings

Accessible via ⚙️ icon — persisted in `localStorage`.

| Setting                    | Options                 | Default |
| -------------------------- | ----------------------- | ------- |
| **Number of Decks**        | 2, 4, 6, 8, 10          | 6       |
| **Dealer Hits on Soft 17** | On / Off                | On      |
| **Ask Insurance**          | On / Off                | On      |
| **Auto Last Bet**          | On / Off                | On      |
| **Sound Effects**          | On / Off                | On      |
| **Background Music**       | On / Off                | On      |
| **Music Volume**           | 0–100% slider           | 50%     |
| **Animation Speed**        | Normal / Fast / Instant | Normal  |

---

## UI/UX Design

### Aesthetic Direction

- **Dark luxury casino theme** — deep green felt table, gold accents, soft neon chip glow
- Inspired by high-end Vegas poker rooms, not cartoonish apps
- Card flip animations (CSS 3D transform), chip stack animations, smooth deal sequences
- Subtle particle effects (e.g., confetti burst on Blackjack win)

### Key Screens

1. **Home / Lobby** — Mode selection, room code entry, settings access
2. **Game Table** — Main playing surface
3. **Results Overlay** — Win/loss/push summary with payout breakdown
4. **Settings Drawer** — Slide-in panel, no page navigation
5. **Room Lobby** — Player list, chip counts, ready status

### Table Layout

```
┌──────────────────────────────────────────────────┐
│              DEALER HAND + SCORE                 │
│                                                  │
│  [P2 Hand]   [P3 Hand]   [P4 Hand]  ← Multiplayer│
│                                                  │
│           [PLAYER HAND + SCORE]                  │
│                                                  │
│   [HIT]  [STAND]  [DOUBLE]  [SPLIT]  [SURRENDER] │
│                                                  │
│  Chips: $850     Bet: $100     [DEAL / REBET]    │
└──────────────────────────────────────────────────┘
```

### Micro-interactions

- Chip click = satisfying "clink" sound + bounce animation
- Card deal = smooth slide-in with slight rotation variance
- Win = gold glow + chip rain animation
- Bust = red flash + subtle shake

---

## Sound & Music

Use **Howler.js** for all audio management.

### Background Music

- Looping ambient casino jazz track (royalty-free)
- Subtle, non-distracting — designed to extend sessions
- Fades out during result announcement, resumes after

### Sound Effects

| Event              | Sound                 |
| ------------------ | --------------------- |
| Card deal          | Soft paper slide      |
| Chip placement     | Ceramic clink         |
| Win                | Cash register / coins |
| Blackjack          | Upbeat chime burst    |
| Bust               | Low thud              |
| Dealer card reveal | Tension sting         |
| Button click       | Soft click            |

### Recommended Royalty-Free Sources

- [freesound.org](https://freesound.org) — SFX
- [incompetech.com](https://incompetech.com) — Casino/jazz background music

---

## Ad Monetization Strategy

> Goal: Revenue without killing immersion. Ads feel part of the experience, not interruptions.

### Placement Rules

- **Never** show ads mid-hand or during active gameplay
- **Always** show ads at natural break points (between rounds, chip reload)
- Frequency cap: max **1 interstitial per 10 minutes per user**

### Ad Placements

| Placement                  | Type                   | Trigger                     | Frequency        |
| -------------------------- | ---------------------- | --------------------------- | ---------------- |
| **Sidebar Banner**         | Display (300×600)      | Always visible, low opacity | Persistent       |
| **Between Rounds**         | Native banner (728×90) | Bottom of results overlay   | Every 3–5 rounds |
| **Chip Reload Modal**      | Rewarded-style         | When chips hit $0           | On demand        |
| **Room Waiting Screen**    | Display (320×50)       | While waiting to join round | Per room entry   |
| **Settings Drawer Footer** | Small banner (320×50)  | When settings open          | Always           |

### Chip Reload Ad Flow

```
Chips = $0
  → Modal: "You're out of chips!"
  → "Watch a short ad to get $500 free chips"
  → [Watch Ad] button → Ad plays → Chips reload
  → Alternatively: [Wait 30 min] for free reload (no ad)
```

### Revenue Optimization Notes

- Use **Google Ad Manager** for programmatic fill
- Implement **lazy loading** — ads only load when near viewport
- A/B test interstitial frequency (every 3 vs. every 5 rounds)
- Track **session length vs. ad impressions** to find optimal cadence
- Consider **non-intrusive sponsored chip bundles** (e.g., "Bonus chips brought to you by [Brand]")

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT                              │
│  Game Engine │ UI Components │ Socket Client │ Ad Layer │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   SERVER.                               │
│  Game Logic │ Room Manager │ Socket.IO │ REST API       │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │ PostgreSQL  │           │    Redis      │
    │ (rooms,     │           │ (room state,  │
    │  sessions)  │           │  active hands)│
    └─────────────┘           └──────────────┘
```

### Game Engine (Client-Side)

- Deck generation, shuffle, and draw logic runs **client-side** for solo play
- For multiplayer, **server is authoritative** — all game state lives in Redis and is broadcast via WebSocket
- Prevents cheating in multiplayer; keeps solo play snappy and offline-capable

---

## Data Models

### Player (localStorage / session)

```ts
interface Player {
  id: string; // UUID, generated on first visit
  nickname: string; // e.g., "LuckyAce42"
  chips: number; // current balance
  lastBet: number; // for Auto Last Bet
}
```

### Room

```ts
interface Room {
  id: string; // e.g., "BJ7X2K"
  hostId: string;
  players: Player[]; // max 7
  status: "waiting" | "betting" | "playing" | "resolving";
  settings: GameSettings;
  shoe: Card[]; // server-authoritative
  currentRound: Round;
}
```

### GameSettings

```ts
interface GameSettings {
  deckCount: 2 | 4 | 6 | 8 | 10;
  dealerHitsSoft17: boolean;
  askInsurance: boolean;
  autoLastBet: boolean;
}
```

### Card

```ts
interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank:
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "J"
    | "Q"
    | "K"
    | "A";
  faceUp: boolean;
}
```

---

## API Endpoints

| Method | Endpoint              | Description                   |
| ------ | --------------------- | ----------------------------- |
| `POST` | `/rooms`              | Create a new room             |
| `GET`  | `/rooms/:code`        | Get room info by join code    |
| `POST` | `/rooms/:code/join`   | Join a room                   |
| `POST` | `/rooms/:code/leave`  | Leave a room                  |
| `WS`   | `/rooms/:code/socket` | WebSocket connection for room |

### WebSocket Events

| Event           | Direction       | Payload                                                            |
| --------------- | --------------- | ------------------------------------------------------------------ |
| `place_bet`     | Client → Server | `{ playerId, amount }`                                             |
| `player_action` | Client → Server | `{ playerId, action: 'hit'│'stand'│'double'│'split'│'surrender' }` |
| `game_state`    | Server → Client | Full `Room` object                                                 |
| `round_result`  | Server → Client | `{ results: PlayerResult[] }`                                      |
| `player_joined` | Server → Client | `{ player: Player }`                                               |
| `player_left`   | Server → Client | `{ playerId: string }`                                             |

---

## Screens & User Flows

### Solo Flow

```
Home → [Play vs Dealer] → Game Table → Place Bet → Deal
  → Player Actions → Dealer Acts → Results → Repeat
```

### Multiplayer Flow

```
Home → [Create Room] → Share Code → Wait for Players → Start
  OR
Home → [Join Room] → Enter Code → Wait / Join Table
  → All Place Bets → Take Turns → Dealer Acts → Results → Repeat
```

### Chip Reload Flow

```
Chips = $0 → Modal appears → Watch Ad or Wait
  → Chips restored → Continue playing
```

---

## Out of Scope

The following are explicitly **not** included in v1:

- Real-money gambling or payment processing
- User accounts / login / social login
- Mobile native app (web responsive only)
- Tournament or leaderboard features
- Side bets (Perfect Pairs, 21+3, etc.)
- Card counting detection / prevention
- Live dealer video streaming
