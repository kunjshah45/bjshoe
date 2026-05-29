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
    index.ts                       # re-exports types + utils + gameEngine
    types.ts                       # Player, Room, Card, Round, GameSettings, payloads
    gameEngine.ts                  # betting, dealing, actions, insurance, dealer turn, resolution (used by both server and client/solo)
    utils/engine.ts                # createShoe, shuffleShoe, calculateHandValue, isBlackjack, isBusted, drawCard
  server/
    src/
      index.ts                     # Express + Socket.IO entry; emits sanitizedRoom
      gameManager.ts               # in-memory rooms Map, room create/join/leave/settings; mid-round disconnect cleanup
  client/
    App.tsx                        # thin router: gameMode null → ModeSelect, solo → Table, multi → Lobby/Table
    metro.config.js                # monorepo Metro config (watchFolders, nodeModulesPaths)
    AGENTS.md                      # warning: always read Expo SDK 54 versioned docs
    CLAUDE.md                      # just @AGENTS.md
    src/
      services/socket.ts           # Socket.IO client, hardcoded URL
      store/gameStore.ts           # player + gameMode + lastRoomCode (persisted), room, isConnected
      store/settingsStore.ts       # AppSettings (persisted)
      store/soloStore.ts           # solo Room, drives @blackjack/shared engine locally (not persisted)
      screens/
        ModeSelectScreen.tsx       # first screen: Play Solo / Play with Friends
        LobbyScreen.tsx            # multi lobby (nickname + room code, socket lifecycle)
        TableScreen.tsx            # game table (mode-agnostic via useActiveRoom + useGameActions)
      hooks/
        useActiveRoom.ts           # returns soloStore.room or gameStore.room based on mode
        useGameActions.ts          # dispatches to soloStore (solo) or socket.emit (multi)
      components/
        CardView.tsx               # card render + deal/flip/sweep animations
        SettingsModal.tsx          # settings UI (host-gated rules)
        CelebrationEffect.tsx      # confetti / coin rain / bust flash
        ResultOverlay.tsx          # win/loss/push/bj/surrender overlay
        OutOfChipsModal.tsx        # solo-only: blocking modal with "Claim 1000 free chips"
        SpectatorOverlay.tsx       # multi-only: out-of-chips banner with Spectate / Leave
        DiscardPile.tsx            # top-left visual stack (no count text)
        Shoe.tsx                   # top-right shoe visual
        HandScore.tsx              # animated hand total
        AnimatedButton.tsx
        AnimatedChip.tsx
        PulseText.tsx
        index.ts                   # barrel
```

## Architecture notes

- Server is authoritative for the shoe in multiplayer. Every `game_state` emission strips it via `sanitizedRoom = { ...room, shoe: [] }`. Solo mode runs the same engine client-side and keeps its own shoe in `soloStore`.
- The game engine (`shared/gameEngine.ts`) is shared: server imports it for multiplayer rooms, client imports it for solo games. One source of truth for rules.
- Multiplayer state is only in `gameManager.ts`'s `rooms` Map (`server/src/gameManager.ts:13`). Redis not wired up.
- Mid-round disconnect: `leaveRoom` in `gameManager.ts` cleans up `activePlayers` (drops the seat in `betting`; forfeits hands and advances `turnIndex` in `playing`). Bets are forfeited (chips already deducted on `placeBet`).
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

- Three Zustand stores:
  - `gameStore` — `player`, `room` (multi only), `isConnected`, `gameMode: 'solo' | 'multi' | null`, `lastRoomCode`. Persisted: `player`, `gameMode`, `lastRoomCode`.
  - `settingsStore` — `AppSettings` extends `GameSettings` with `soundEffects`, `backgroundMusic`, `musicVolume`, `animationSpeed`. Persisted under `blackjack-settings`.
  - `soloStore` — `room: Room | null` for solo games. NOT persisted (refresh in solo = fresh betting phase with saved chip balance). Drives `@blackjack/shared` engine functions and mirrors chip changes back into `gameStore.player`.
- Persistence is hand-rolled: each store calls `useStore.subscribe((state) => persist...)`. NOT `zustand/middleware` — see gotcha.
- LocalStorage keys: `blackjack-settings`, `blackjack-player`, `blackjack-mode`, `blackjack-last-room`.
- Player is auto-generated on first visit (`gameStore.ts:23` `generateNickname` produces e.g. `LuckyAce42`-style names from `ADJECTIVES × NOUNS × 10–99`). UUID via `uuid.v4()` stable across reloads.
- Starting chips: `STARTING_CHIPS = 1000` exported from `gameStore.ts`.
- In multi: `gameStore` mirrors server-authoritative `chips` / `lastBet` back into the persisted player on every `game_state` (`LobbyScreen.tsx`).
- In solo: `soloStore` calls `gameStore.updatePlayer({ chips, lastBet })` after every engine action that touches chips, so the persisted balance stays current.
- `useActiveRoom()` hook reads the right room source based on `gameMode`; `TableScreen` is mode-agnostic.

## Animation timing reference

- Card deal stagger: `delay + index * 450ms * speedFactor` (`CardView.tsx:121`)
- Hole-card flip half-duration: `150ms * speedFactor`; content swap at midpoint (`CardView.tsx:47`, `:63`)
- Sweep total: `600ms * speedFactor` translate/scale/rotate, opacity fade from `300ms` → `0` over `300ms`; sweep window TableScreen holds the lingering round: `700 * speedFactor` ms (`TableScreen.tsx`)
- Result overlay delay formula: `max(1800ms, totalCards * 300ms) * speedFactor` where `totalCards = dealerCards + sum(playerHand.cards)` (`TableScreen.tsx`)
- ResultOverlay on-screen duration: 300ms in, 1500ms hold, 300ms out (`ResultOverlay.tsx`)
- `speedFactor`: `normal` = 1, `fast` = 0.5, `instant` = 0

## Deal order math

Implemented inline in `TableScreen.tsx` (`dealOrderForPlayer` and `dealOrderForDealer`). Real-casino round-robin:

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
PRD says $500 max; the product decision (per user) is no upper cap. Chip buttons disable only when `pendingBet + chip.value > playerChips` (`TableScreen.tsx`). `MIN_BET = $10` still enforced. Chip denominations: `10, 25, 50, 100, 200, 500`.

### No visible discard count
The `discardCount` is tracked in `TableScreen.tsx` state but never displayed. `DiscardPile.tsx` renders a stack capped at 5 visual layers (`Math.min(5, ceil(count / 4))`) to give a "lived-in" pile without giving players a free card-counting aid.

### No auto pre-fill of `pendingBet`
`pendingBet` starts at `0` each betting phase. If `settings.autoLastBet` is on AND `player.lastBet >= MIN_BET` AND the player has chips for it, a `Rebet last ($X)` button shows in `TableScreen.tsx`. Player opts in explicitly. Do NOT silently pre-fill — clicking `+$X` on top of a hidden default surprised users.

### Auto-deal countdown is auto-CONTINUE, not auto-bet
The 5s post-resolve countdown (`AUTO_DEAL_SECONDS = 5`, in `TableScreen.tsx`) only advances the room to `betting` via `actions.startRound()` (host only). The user still picks chips and clicks Deal. Do not auto-place a bet without an opt-in. In solo, the player is always the host.

### Out-of-chips: solo only gets a reload
Solo shows a non-dismissible `OutOfChipsModal` with one button: "Claim 1000 free chips" (instant reset, no cooldown). Multi shows a `SpectatorOverlay` instead — Spectate or Leave room, but never a free claim. Friends-playing-friends keeps chips meaningful. A multi player who busts and refreshes lands back in the room at $0 chips (localStorage was mirrored from server pre-disconnect) and immediately sees the overlay again — natural anti-loophole.

### Refresh behavior
- **Solo:** only chips/nickname/mode persist. Mid-hand state is intentionally NOT persisted — refresh always lands you in a fresh betting phase with your saved chip balance. If chips === 0 on boot, OutOfChipsModal appears.
- **Multi:** refresh = leave. Server's `disconnect` handler removes the player and cleans up `activePlayers`. Active bet is forfeited. To return, the player re-enters the room code on `LobbyScreen` (which pre-fills `lastRoomCode`).

### Server bug fixed: initial `hand.bet = 0`
`shared/gameEngine.ts` `startBettingPhase` — initial `hand.bet` is `0`, not `lastBet || 10`. Otherwise `allBetsPlaced = activePlayers.every(p => p.hands[0].bet > 0)` was true at start and the first bet immediately dealt the round even in multiplayer.

### Split-aces fix
After any action, progression always calls `moveToNextActiveTurn` instead of `turnIndex++`. `moveToNextActiveTurn` walks past players whose hands are all finished. Previously, both auto-finished split-Ace hands froze the turn pointer.

### Mode-aware action dispatch
`useGameActions()` returns the same action surface (`placeBet`, `playerAction`, etc.) for both modes. In solo it calls `soloStore` methods directly; in multi it does `socket.emit(...)`. `TableScreen` never branches on mode for gameplay.

### Monorepo, no root scripts
npm workspaces: `client`, `server`, `shared`. Root `package.json` is just the workspace declaration — work inside each workspace.

## What's done vs not done

Verified against current code:

| Area | Status | Evidence |
| --- | --- | --- |
| Core engine (deck, deal, value, BJ, bust) | Done | `shared/utils/engine.ts` |
| Hit / Stand / Double / Split (incl. Aces) / Surrender | Done | `shared/gameEngine.ts` |
| Insurance (offer, place/decline, resolve, dealer BJ) | Done | `shared/gameEngine.ts` |
| Settings UI + persistence + host-gated rules | Done | `client/src/components/SettingsModal.tsx`, `client/src/store/settingsStore.ts` |
| Card deal stagger / flip / sweep | Done | `CardView.tsx`, `TableScreen.tsx` |
| Result overlay (win/loss/push/bj/surrender) | Done | `client/src/components/ResultOverlay.tsx` |
| Celebrations (confetti/coin/bust flash) | Done | `client/src/components/CelebrationEffect.tsx` |
| Auto-continue countdown (host) | Done | `TableScreen.tsx` |
| Server-authoritative shoe (sanitized broadcast) | Done | `server/src/index.ts` everywhere |
| Solo mode (no server) | Done | `useSoloStore` drives `shared/gameEngine.ts` locally; `ModeSelectScreen` entry |
| Out-of-chips reload (solo) | Done | `OutOfChipsModal.tsx` + `soloStore.claimFreeChips()` |
| Out-of-chips spectator overlay (multi) | Done | `SpectatorOverlay.tsx` (Spectate / Leave room) |
| Mid-round disconnect cleanup | Done | `gameManager.ts` `leaveRoom` |
| App.tsx modularization (screens + hooks) | Done | `screens/`, `hooks/useActiveRoom.ts`, `hooks/useGameActions.ts` |
| Mode-aware action dispatch | Done | `useGameActions()` |
| Audio (SFX + music + volume) | Done | `client/src/services/audio.ts` + `useBgMusic` hook. WAV→MP3 SFX in `client/public/audio/`. BG music starts on user gesture, gated by settings. |
| AdSense (Auto Ads + manual placements) | Mostly done | Loader + ads.txt + meta + CookieYes CMP all live. Two slot-ID placeholders still need swap once AdSense flips "Ready". |
| Web deploy | Done | GH Pages on custom domain `bjshoe.app`. `.github/workflows/deploy.yml` builds via `npm run build:web:ghpages` on every push to main. |
| Analytics + Consent | Done | GA4 `G-K5ZBX1MDTT` + CookieYes CMP `ea18c8fc5ef2661e0030ff1b` injected site-wide via `inject-seo.js`. CookieYes loads BEFORE GA4/AdSense so Consent Mode v2 works. |
| SEO content pages | Done | 8 indexable URLs: `/`, `/blackjack-rules/`, `/blackjack-strategy/`, `/blackjack-odds/`, `/blackjack-glossary/`, `/card-counting/`, `/privacy/`, `/terms/`. All schema-tagged, sourced bylines, linked from ModeSelectScreen footer. |
| PWA installable | Done | `manifest.json` + 16/32/48/180/192/512 icons in `client/public/`. Apple meta tags + maskable icon. |
| Lazy-loaded multi + how-to | Done | `MultiRoot.tsx` extracted; `App.tsx` uses `React.lazy()` + Suspense for it and `HowToPlayScreen`. Initial bundle ~616 KB; MultiRoot and HowToPlay chunks 12 KB each. |
| Redis persistence | NOT done | `gameManager.ts:13` Map only |
| REST endpoints (`POST /rooms`, etc.) | NOT done | only `GET /health` |
| Tests | NOT done | no test files; server `npm test` exits with error |
| Dockerfile / `.env.example` / README | NOT done | none in repo |
| Host-controlled table buy-in / chip grants | NOT done | discussed and deferred |
| Real-money IAP | NOT done | on roadmap; no SDK |
| Server deployed for multiplayer | NOT done | `FEATURES.multiplayer = false` in current build, "Play with Friends" button hidden |
| Animation speed setting wired through | Done | `TableScreen.tsx` reads `settings.animationSpeed`, passes into `CardView` and overlay delay |

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

## Production state (as of 2026-05-28)

- **Live URL:** https://bjshoe.app/ (custom domain, GitHub Pages)
- **Repo:** https://github.com/kunjshah45/bjshoe
- **Deploy:** push to `main` → GH Actions → `client/dist/` → live in ~2 min
- **Build chain:** `expo export -p web` → copy `index.html` → `404.html` → write `CNAME` → `node scripts/inject-adsense.js` → `node scripts/inject-seo.js`
- **inject-adsense.js** walks every HTML in `dist/`, adds the AdSense loader, ownership meta, in-article ad block after first `<h2>` on content pages. Writes `ads.txt`.
- **inject-seo.js** walks every HTML, injects CookieYes (top of `<head>`), preconnect hints, PWA + favicon links, GA4 (bottom of `<head>`), SEO head block on `index.html`/`404.html`, beefed-up `<noscript>`, `HowTo` schema on strategy + counting pages. Writes `robots.txt` and `sitemap.xml`.

## Key IDs and config

- AdSense publisher: `ca-pub-1675923800122600` (`ads.txt` token `f08c47fec0942fa0`)
- GA4 measurement ID: `G-K5ZBX1MDTT`
- CookieYes CMP ID: `ea18c8fc5ef2661e0030ff1b`
- GSC verification file: `/google96f12519a468db78.html`
- Bing verified via GSC import
- `FEATURES.multiplayer = false` in `client/src/config.ts` for current deploy

## Outstanding manual user actions

1. AdSense status is "Getting ready" — normal for new sites, 24-72h after `ads.txt` is published. Don't worry unless still stuck after 2 weeks.
2. Replace `CHIPS_MODAL_AD_SLOT` placeholder in `client/src/components/OutOfChipsModal.tsx` with a real AdSense slot ID once a Display 300×250 ad unit is created.
3. Replace `CONTENT_INARTICLE_PLACEHOLDER` in `client/scripts/inject-adsense.js` with a real in-article slot ID once that ad unit is created.
4. Flaticon attribution: decide between (a) small footer link "Icons by Freepik from Flaticon", (b) skip (small enforcement risk), or (c) upgrade to Flaticon Premium ($10/mo).

## Roadmap

**TIER 1 — off-page (user effort, biggest ranking lever):**
- Reddit post on r/blackjack (draft already discussed in chat — comment helpfully first, then post)
- Show HN
- ProductHunt launch (Tues/Wed best)
- web.archive.org/save submission (DR 90+ free backlink, 30 seconds)
- Wikipedia external links on Card Counting / Blackjack pages

**TIER 2 — long-tail content pages (~5 min each):**
- `/when-to-double-down/`
- `/when-to-split-in-blackjack/`
- `/european-blackjack/`
- `/single-deck-blackjack/`
- `/blackjack-side-bets/`
- `/blackjack-bankroll/`
- `/dealer-rules-blackjack/`
- `/blackjack-variants/` (hub linking to variant pages)
- Pattern: copy any existing `client/public/<slug>/index.html`, swap content, add `Article` + `BreadcrumbList` schema, update `sitemap.xml` urls list in `inject-seo.js`. In-article ad auto-injects.

**TIER 3 — perf:**
- `services/socket.ts` is statically imported by `TableScreen` and `useGameActions`, so `socket.io-client` is still in the main 616 KB chunk. Refactoring to dynamic-import would shed ~80 KB. Non-trivial.
- TableScreen still ~580 LOC — could extract `useResultOverlay`, `useCardSweep`, `useAutoDealCountdown`, `useBetting` hooks. Cosmetic.

**TIER 4 — multiplayer revival:**
- Server unit tests against `shared/gameEngine.ts` (no test runner wired up — server `npm test` exits with error)
- Deploy server to Render / Fly.io / Railway (free tiers with WebSocket support)
- Wire `EXPO_PUBLIC_SOCKET_URL` env var into `client/src/services/socket.ts`
- Flip `FEATURES.multiplayer = true` in `client/src/config.ts`
- Spec: `docs/superpowers/specs/2026-05-25-solo-multi-and-chip-reload-design.md`
- Discussed-but-deferred multi features: host-controlled chip buy-in (player requests, host approves), real-money IAP, host-grant chips.

When touching client code, **read `https://docs.expo.dev/versions/v54.0.0/`** before importing Expo modules (per `client/AGENTS.md`).
