# Blackjack Monorepo — Claude Reference

## What this is

Browser-based Blackjack with multiplayer rooms (host + up to 7 players vs. one dealer). Anonymous play, free chips, server-authoritative shoe, real-time sync via Socket.IO. Solo mode and ads are still on the roadmap; today every session requires a server room.

## Tech stack

### Client (`client/`)
- Expo SDK `~54.0.33`, React Native `0.81.5`, React `19.1.0`
- `react-native-web ^0.21.0` for web target (Metro/Expo Web)
- Zustand `^5.0.13` for state (persistence is hand-rolled, see gotcha)
- `socket.io-client ^4.8.3`
- `@react-native-community/slider`, `react-native-get-random-values`, `uuid`
- TypeScript `~5.9.2`
- Audio (Howler.js / expo-av) NOT installed yet

### Server (`server/`)
- Node + Express 5, Socket.IO `^4.8.3`, TypeScript
- `redis ^5.12.1` is a dependency but is NOT wired up — rooms live in an in-memory `Map`
- `nodemon` + `ts-node` for dev

### Shared (`shared/`)
- Workspace package `@blackjack/shared` — direct TS source (`main`/`types` both point at `index.ts`)
- Holds canonical types and the `engine.ts` deck/shuffle/value utilities (used by server today; available to client)

### Socket URL
- Hardcoded in `client/src/services/socket.ts:7` as `http://192.168.0.64:3001`
- Not env-driven — must be edited per environment

## Run commands

- Server: `cd server && npm run dev` — listens on port 3001 (`PORT` env override supported)
- Client web: `cd client && npm run web` — Expo web (Metro)
- Client mobile: `cd client && npm run ios|android`
- Root has no scripts; npm workspaces means installs from root, work from each workspace

## Repo layout

```
blackjack/
  package.json                     # workspaces: client, server, shared
  project-details.md               # original 1-page spec
  game-design-plan.md              # PRD
  TASK_BREAKDOWN.md                # task tracker (stale — verify against code)
  shared/
    index.ts                       # re-exports types + utils
    types.ts                       # Player, Room, Card, Round, GameSettings, payloads
    utils/engine.ts                # createShoe, shuffleShoe, calculateHandValue, isBlackjack, isBusted, drawCard
  server/
    src/
      index.ts                     # Express + Socket.IO entry; emits sanitizedRoom
      gameManager.ts               # in-memory rooms Map, room create/join/leave/settings
      gameEngine.ts                # betting, dealing, actions, insurance, dealer turn, resolution
  client/
    App.tsx                        # ~600 LOC — lobby + table screens, all hooks, all styles
    metro.config.js                # monorepo Metro config (watchFolders, nodeModulesPaths)
    AGENTS.md                      # warning: always read Expo SDK 54 versioned docs
    CLAUDE.md                      # just @AGENTS.md
    src/
      services/socket.ts           # Socket.IO client, hardcoded URL
      store/gameStore.ts           # player (persisted), room, isConnected
      store/settingsStore.ts       # AppSettings (persisted)
      components/
        CardView.tsx               # card render + deal/flip/sweep animations
        SettingsModal.tsx          # settings UI (host-gated rules)
        CelebrationEffect.tsx      # confetti / coin rain / bust flash
        ResultOverlay.tsx          # win/loss/push/bj/surrender overlay
        DiscardPile.tsx            # top-left visual stack (no count text)
        Shoe.tsx                   # top-right shoe visual
        HandScore.tsx              # animated hand total
        AnimatedButton.tsx
        AnimatedChip.tsx
        PulseText.tsx
        index.ts                   # barrel
      screens/                     # empty — modularization target
```

## Architecture notes

- Server is authoritative for the shoe. Every `game_state` emission strips it via `sanitizedRoom = { ...room, shoe: [] }` (see `server/src/index.ts:50`, `:67`, `:78`, `:89`, `:100`, `:111`, `:122`, `:134`, `:145`).
- Multiplayer state is only in `gameManager.ts`'s `rooms` Map (`server/src/gameManager.ts:13`). Redis not wired up.
- No REST endpoints — only `GET /health`. Everything else is over Socket.IO.
- Socket events (client → server):
  - `join_room` — `{ roomCode, playerId, nickname, chips, settings? }`
  - `update_settings` — `GameSettings` (host only)
  - `start_round` — host only
  - `place_bet` — `{ amount }`
  - `player_action` — `{ action: 'hit'|'stand'|'double'|'split'|'surrender' }`
  - `place_insurance` — `{ amount }`
  - `decline_insurance`
  - `close_insurance_phase` — host only
- Server → client: `game_state` (full sanitized room), `player_joined`, `player_left`
- Room status machine: `waiting → betting → playing → resolving → betting → …`
  - Set in `gameEngine.ts`: `startBettingPhase` → `betting`, `dealInitialCards` → `playing`, `playDealerTurn` / `closeInsurancePhase` (on dealer BJ) → `resolving`
- Insurance flow: `dealInitialCards` sets `insuranceOffered = true` when dealer up-card is Ace AND `settings.askInsurance`. Player turns DO NOT start until host calls `close_insurance_phase`, which resolves insurance bets and either ends the round (dealer BJ) or calls `moveToNextActiveTurn`.

## Client state

- Two Zustand stores:
  - `gameStore` — `player`, `room`, `isConnected`. Player persisted under `blackjack-player`.
  - `settingsStore` — `AppSettings` extends `GameSettings` with `soundEffects`, `backgroundMusic`, `musicVolume`, `animationSpeed`. Persisted under `blackjack-settings`.
- Persistence is hand-rolled: each store calls `useStore.subscribe((state) => persist...)`. NOT `zustand/middleware` — see gotcha.
- LocalStorage keys: `blackjack-settings`, `blackjack-player`.
- Player is auto-generated on first visit (`gameStore.ts:19` `generateNickname` produces e.g. `LuckyAce42`-style names from `ADJECTIVES × NOUNS × 10–99`). UUID via `uuid.v4()` stable across reloads.
- Starting chips: `STARTING_CHIPS = 1000` (`gameStore.ts:6`).
- `gameStore` mirrors server-authoritative `chips` / `lastBet` back into the persisted player on every `game_state` (`App.tsx:95`).

## Animation timing reference

- Card deal stagger: `delay + index * 450ms * speedFactor` (`CardView.tsx:121`)
- Hole-card flip half-duration: `150ms * speedFactor`; content swap at midpoint (`CardView.tsx:47`, `:63`)
- Sweep total: `600ms * speedFactor` translate/scale/rotate, opacity fade from `300ms` → `0` over `300ms`; sweep window the App holds the lingering round: `700 * speedFactor` ms (`App.tsx:248`)
- Result overlay delay formula: `max(1800ms, totalCards * 300ms) * speedFactor` where `totalCards = dealerCards + sum(playerHand.cards)` (`App.tsx:217`)
- ResultOverlay on-screen duration: 300ms in, 1500ms hold, 300ms out (`ResultOverlay.tsx`)
- `speedFactor`: `normal` = 1, `fast` = 0.5, `instant` = 0

## Deal order math

Implemented in `App.tsx:299` (`dealOrderForPlayer`) and `App.tsx:304` (`dealOrderForDealer`). Real-casino round-robin:

- Let `N = numActivePlayers`, `p = activePlayers.findIndex(playerId)`.
- Initial deal (`cardIndex < 2`):
  - Player card `c`: `c * (N + 1) + p`
  - Dealer card `c`: `c * (N + 1) + N`
- Post-deal:
  - Player hit (`cardIndex >= 2`): order `0` — instant, no stagger (player-initiated).
  - Dealer hit (`cardIndex >= 2`): order `cardIndex - 2` — produces `0, 1, 2, …` so dealer's draws stagger one-by-one.

## Known gotchas / decisions made

### `import.meta` blocks `zustand/middleware` on Expo web
`zustand/middleware`'s ESM build uses `import.meta.env`, which Metro 54 does not transform. Persistence is hand-rolled via `useStore.subscribe`. Do NOT add `zustand/middleware` (e.g. `persist`) imports — it will fail to bundle for web.

### 3D card flip is unreliable on web
`backfaceVisibility` + `rotateY` is fragile across react-native-web versions. `CardView` uses a `scaleX` squish (1 → 0 → 1, content swap at midpoint) for hole-card reveals (`CardView.tsx:39`). Do not reintroduce `rotateY` for flips.

### `SafeAreaView` from `react-native` is deprecated in SDK 54
Functioning but warns. PRD upgrade target is `react-native-safe-area-context` (not yet installed).

### No max bet cap
PRD says $500 max; the product decision (per user) is no upper cap. Chip buttons disable only when `pendingBet + chip.value > playerChips` (`App.tsx:446`). `MIN_BET = $10` still enforced (`App.tsx:25`). Chip denominations: `10, 25, 50, 100, 200, 500`.

### No visible discard count
The `discardCount` is tracked in state (`App.tsx:44`, `:53–62`) but never displayed. `DiscardPile.tsx` renders a stack capped at 5 visual layers (`Math.min(5, ceil(count / 4))`) to give a "lived-in" pile without giving players a free card-counting aid.

### No auto pre-fill of `pendingBet`
`pendingBet` starts at `0` each betting phase (`App.tsx:140–144`). If `settings.autoLastBet` is on AND `player.lastBet >= MIN_BET` AND the player has chips for it, a `Rebet last ($X)` button shows (`App.tsx:458`). Player opts in explicitly. Do NOT silently pre-fill — clicking `+$X` on top of a hidden default surprised users.

### Auto-deal countdown is auto-CONTINUE, not auto-bet
The 5s post-resolve countdown (`AUTO_DEAL_SECONDS = 5`, `App.tsx:23`) only advances the room to `betting` via `socket.emit('start_round')` (host only, `App.tsx:255–274`). The user still picks chips and clicks Deal. Do not auto-place a bet without an opt-in.

### Server bug fixed: initial `hand.bet = 0`
`gameEngine.ts:16` — initial `hand.bet` is `0`, not `lastBet || 10`. Otherwise `allBetsPlaced = activePlayers.every(p => p.hands[0].bet > 0)` (`gameEngine.ts:42`) was true at start and the first bet immediately dealt the round even in multiplayer.

### Split-aces fix
After any action, progression always calls `moveToNextActiveTurn` (`gameEngine.ts:222`) instead of `turnIndex++`. `moveToNextActiveTurn` walks past players whose hands are all finished (`gameEngine.ts:236–248`). Previously, both auto-finished split-Ace hands froze the turn pointer.

### Monorepo, no root scripts
npm workspaces: `client`, `server`, `shared`. Root `package.json` is just the workspace declaration — work inside each workspace.

## What's done vs not done

Verified against current code:

| Area | Status | Evidence |
| --- | --- | --- |
| Core engine (deck, deal, value, BJ, bust) | Done | `shared/utils/engine.ts` |
| Hit / Stand / Double | Done | `server/src/gameEngine.ts:110–147` |
| Split (incl. forced finish on Aces) | Done | `server/src/gameEngine.ts:164–208` |
| Surrender (late, half bet back) | Done | `server/src/gameEngine.ts:149–162` |
| Insurance (offer, place/decline, resolve, dealer BJ) | Done | `server/src/gameEngine.ts:287–363` |
| Settings UI + persistence + host-gated rules | Done | `client/src/components/SettingsModal.tsx`, `client/src/store/settingsStore.ts` |
| Card deal stagger | Done | `client/src/components/CardView.tsx` |
| Hole-card flip (scaleX) | Done | `CardView.tsx:39` |
| Card sweep to discard | Done | `CardView.tsx:68`, `App.tsx:230–251` |
| Result overlay (win/loss/push/bj/surrender) | Done | `client/src/components/ResultOverlay.tsx` |
| Celebrations (confetti/coin/bust flash) | Done | `client/src/components/CelebrationEffect.tsx` |
| Auto-continue countdown (host) | Done | `App.tsx:255–274` |
| Server-authoritative shoe (sanitized broadcast) | Done | `server/src/index.ts` everywhere |
| Audio (SFX + music + volume) | NOT done | settings toggles exist; no `audioManager` |
| Solo mode (no server) | NOT done | always emits `join_room` |
| Ads (banner, interstitial, rewarded reload) | NOT done | no ad SDK or modal |
| Redis persistence | NOT done | `gameManager.ts:13` Map only |
| Out-of-chips reload modal | NOT done | balance just sits at 0 |
| REST endpoints (`POST /rooms`, etc.) | NOT done | only `GET /health` |
| Tests | NOT done | no test files; server `npm test` exits with error |
| Dockerfile / `.env.example` / README | NOT done | none in repo |
| Animation speed setting wired through | Done | `App.tsx` reads `settings.animationSpeed`, passes into `CardView` and overlay delay |

TASK_BREAKDOWN.md still marks Phase 1.1 (surrender + insurance), Settings, and animations as TODO. They are done.

## Coding conventions observed

- Terse — no JSDoc on every function, no defensive validation at internal boundaries (e.g. `if (room.status !== 'betting' || !room.currentRound) return;` rather than throwing).
- Single-file components, co-located `StyleSheet.create` at the bottom.
- Hooks live inline in `App.tsx`. No `useCallback` / `useMemo` unless required.
- Comments explain *why* (timing, ordering, gotchas), not *what*.
- Prefer editing existing files. New files only when a new concept appears.
- Server functions are plain exports, not classes.
- Currency formatting is inline (`$${n}`), no formatter util.
- Path alias: `@blackjack/shared` resolves to `shared/index.ts` via workspaces.

## For the next session

`client/App.tsx` (~600 LOC) is the modularization target. The plan is a relocation pass, NOT a redesign — same behavior, smaller files:

- `client/src/screens/LobbyScreen.tsx` — pre-game (nickname/room code input, Start Round)
- `client/src/screens/TableScreen.tsx` — in-game (dealer area, players, controls)
- `client/src/hooks/useResultOverlay.ts` — extracted from `App.tsx:190–224`
- `client/src/hooks/useAutoDealCountdown.ts` — extracted from `App.tsx:255–274`
- `client/src/hooks/useCardSweep.ts` — extracted from `App.tsx:226–251`
- `client/src/hooks/useBetting.ts` — `pendingBet` + add/clear/rebet/deal
- `client/src/hooks/useSocketLifecycle.ts` — `App.tsx:70–108` (`connect`, `game_state`, etc.)
- `client/src/hooks/useGameStateSync.ts` — chips/lastBet mirror into persisted player
- `client/src/constants.ts` — `MIN_BET`, `CHIP_DENOMS`, `AUTO_DEAL_SECONDS`
- `client/src/utils/result.ts` — `calcResultAmount`, `dealOrderForPlayer`, `dealOrderForDealer`
- Per-screen style files (`styles/lobby.ts`, `styles/table.ts`) or `<Screen>.styles.ts`

When touching client code, **read `https://docs.expo.dev/versions/v54.0.0/`** before importing Expo modules (per `client/AGENTS.md`).
