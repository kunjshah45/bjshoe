# Solo mode, multiplayer rejoin, and chip reload — Design

**Date:** 2026-05-25
**Status:** Approved — ready for implementation plan

## Problem

Three related gaps in the current Blackjack app:

1. **No way to recover from $0 chips.** A player who busts their entire balance has no path forward — the lobby just sits at 0.
2. **No solo mode.** Every session emits `join_room` and requires a server. The PRD mentions solo play but no code path exists for it.
3. **Refresh behavior is undefined.** Solo (after this work) and multiplayer both need explicit behavior on page reload.

## Goals

- Let players keep playing after busting (without breaking the social stakes of multiplayer with friends).
- Add a Solo mode that runs entirely client-side, with no server dependency.
- Define explicit, opt-in behavior for what happens on refresh in each mode.
- Avoid duplicating game logic across client and server.

## Non-goals

- Real-money in-app purchases (IAP) for chips. On the roadmap; out of scope here.
- Watch-an-ad-for-chips flow. Out of scope (no ad SDK is wired up).
- Host-grants-chips / poker-style table buy-in. Discussed and deferred.
- Account system / cross-device identity. Out of scope (localStorage-only identity stays).
- Resume of mid-hand state across refresh. Explicitly chosen against — see decision below.
- Reconnection grace window / `pending_rejoin` seat reservation in multiplayer. Explicitly chosen against — refresh = leave.

## Decisions (locked in during brainstorming)

| # | Decision | Chosen | Rationale |
|---|---|---|---|
| 1 | Where does solo run? | Pure client; engine code moves to `shared/` | One source of truth for game rules; works offline; no server cost for solo. |
| 2 | Out-of-chips behavior (solo) | Modal with single "Claim 1000 free chips" button, instant reset | Simplest opt-in path; ads/IAP/cooldowns are premature. |
| 3 | Out-of-chips behavior (multi) | Spectate-or-leave overlay; no claim | Friends-playing-friends — chips must matter. |
| 4 | Solo refresh | Only chips persist; never mid-hand state | Simplest; no resume modal; small papercut for accidental refreshes. |
| 5 | Multi refresh | Treat as leave; player rejoins as a new participant | Simplest server logic; no seat-reservation machinery; in-progress bet is forfeited. |
| 6 | Mode select UX | First-screen with two big buttons | Cleanest mental model; one decision up front, then a familiar flow. |

## Architecture

### Engine relocation

Move `server/src/gameEngine.ts` → `shared/gameEngine.ts`.

Affected functions (all in current `gameEngine.ts`): `startBettingPhase`, `dealInitialCards`, `placeBet`, `hit`, `stand`, `double`, `split`, `surrender`, `placeInsurance`, `declineInsurance`, `closeInsurancePhase`, `playDealerTurn`, `resolveHands`, `moveToNextActiveTurn`, and any helpers.

All are plain functions, no Node-only deps, already typed against `shared/types.ts`. Move is a file relocation + import path updates on the server (`gameManager.ts`, `index.ts`).

After the move:

- **Server** (`gameManager.ts`, `index.ts`) imports engine from `@blackjack/shared`. Behavior identical to today.
- **Client** (new solo path) imports the same engine from `@blackjack/shared` and drives it locally.

### Client screens (new + extracted)

This work also accomplishes the modularization pass that `client/App.tsx` (~600 LOC) has been overdue for.

```
client/src/screens/
  ModeSelectScreen.tsx    # NEW — first screen, two buttons
  LobbyScreen.tsx          # extracted from App.tsx
  TableScreen.tsx          # extracted from App.tsx; reused by solo and multi
```

`App.tsx` shrinks to a thin router that selects screen by `gameMode` + `room` state.

### Client state

Two stores, both partially persisted:

- **`gameStore`** (existing, extended): `player`, `room` (multi only), `isConnected`, **`gameMode: 'solo' | 'multi' | null`** (new, persisted), **`lastRoomCode: string | null`** (new, persisted).
- **`soloStore`** (new): `room: Room | null` (the in-progress solo game state, shape identical to a server room minus `shoe` sanitization since the client owns the shoe in solo). **Not persisted** — only `gameStore.player.chips` carries across refresh.

A small hook `useActiveRoom()` returns `gameMode === 'solo' ? soloStore.room : gameStore.room` so `TableScreen` is mode-agnostic.

### Mode-aware Table screen

`TableScreen` reads from `useActiveRoom()` and dispatches actions to either:

- **Solo:** `soloStore` calls the shared engine functions synchronously and updates local state.
- **Multi:** existing socket emits (`place_bet`, `player_action`, `place_insurance`, etc.) — unchanged.

Solo never opens a socket connection.

### Boot flow

```
App boot
  ├─ Read `gameMode` from localStorage
  ├─ gameMode === null   → ModeSelectScreen
  ├─ gameMode === 'solo' → TableScreen (fresh betting phase; if chips === 0, show OutOfChipsModal)
  └─ gameMode === 'multi' → LobbyScreen (pre-fill `lastRoomCode`; no auto-join)
```

A small "← Change mode" link is visible on `LobbyScreen` and `TableScreen` to return to `ModeSelectScreen`. If clicked mid-multi-game, a confirm modal warns "Leave this table?".

## Components

### `ModeSelectScreen`

- Two large buttons: **Play Solo** / **Play with Friends**
- On choice: set `gameMode`, persist, navigate to TableScreen (solo) or LobbyScreen (multi)
- First-visit default. Once a mode is chosen, subsequent boots skip this screen (link to return).

### `OutOfChipsModal` (solo only)

- Non-dismissible overlay
- Triggered when `chips === 0` AND game phase is `betting` (or pre-game). Suppressed during `playing` / `resolving`.
- Single button: **"Claim 1000 free chips"**
- Click → `soloStore.claimFreeChips()` resets to `STARTING_CHIPS` (1000), writes to localStorage, modal closes.
- No cooldown. No ads. No limit.

### `SpectatorOverlay` (multi only)

- Non-blocking banner / corner overlay
- Triggered when player's `chips === 0` in a multi room
- Two actions:
  - **Spectate** — dismiss overlay; player remains in room, sees game continue, is skipped during dealing (already filtered by `hand.bet > 0` in `gameEngine.ts`'s `allBetsPlaced`).
  - **Leave room** — disconnect socket, clear `room`, navigate to ModeSelectScreen.

## Data flow

### Solo

```
User action (Hit, Bet, etc.)
  ↓
TableScreen dispatches to soloStore method
  ↓
soloStore calls @blackjack/shared engine function with current local Room
  ↓
soloStore replaces local Room with engine result
  ↓
On chip change, persist `chips` to localStorage (via existing gameStore.player sync)
```

### Multi (unchanged)

```
User action → socket.emit(...) → server handler → engine fn → broadcast game_state → gameStore.setRoom → re-render
```

## Persistence

LocalStorage keys (existing + additions):

| Key | Owner | Contents | New? |
|---|---|---|---|
| `blackjack-player` | `gameStore` | `{ id, nickname, chips, lastBet }` | existing |
| `blackjack-settings` | `settingsStore` | `AppSettings` | existing |
| `blackjack-mode` | `gameStore` | `'solo' \| 'multi' \| null` | **new** |
| `blackjack-last-room` | `gameStore` | room code string, or `null` | **new** |

Solo in-progress hand: **not persisted**. By design.

## Error handling

| Scenario | Behavior |
|---|---|
| Solo, app boot, `chips === 0` | Show OutOfChipsModal immediately on TableScreen |
| Solo, `claimFreeChips` called when `chips > 0` | No-op (button shouldn't be visible) |
| Multi, server unreachable | Existing connection error UI; ModeSelectScreen still usable; user can switch to solo |
| Multi, refresh mid-hand | Server's `disconnect` handler removes player + frees seat; bet is forfeited |
| Multi, refresh between hands | Same — leave and rejoin as new participant |
| Multi, busted player rejoins | localStorage `chips: 0` mirrored from prior session; SpectatorOverlay appears on join |
| LocalStorage cleared | Effectively a new player; out of scope to prevent |

### Server cleanup to verify

`server/src/index.ts`'s socket `disconnect` handler must:

- Remove the player from their room
- Free their seat (so the room can have new joiners take that slot)
- Forfeit any pending bet (bet stays on the seat that left → effectively goes to the house)
- If the disconnecting player was the host, transfer host to the next remaining player; if no players remain, remove the room from the in-memory `Map`

If today's handler doesn't do all of this cleanly, the implementation plan includes the fix. Verify before writing the plan.

## Testing

No test framework is wired up today (`server npm test` exits with error per CLAUDE.md). For this work:

- **Manual test plan** (in implementation plan) covers each decision row in the Decisions table.
- Add **server-side unit tests for the engine** as part of the relocation: once `gameEngine.ts` lives in `shared/`, add `shared/__tests__/gameEngine.test.ts` covering the deal-order math, insurance resolution, split-aces forced finish, and out-of-chips edge cases. (Test runner setup is one extra step in the plan.)
- Skip client tests for now — the modularization itself is the verification (extracted screens should behave identically to current `App.tsx`).

## What this does NOT change

- Animation timings (CardView, App.tsx delays) — same.
- Socket event names and payloads — same.
- Server room status machine — same.
- Settings UI / persistence — same.
- Card sweep / discard / hole-card flip — same.

## Open items resolved during brainstorming (not action items)

- "Real-money buy-in?" → out of scope.
- "Host grants chips?" → deferred; could be added later as a host-only socket event without disturbing this design.
- "Track multi vs solo wallets separately?" → unnecessary given multi has no reload path.
- "Dedupe identity on re-join?" → out of scope without accounts.

## Roll-up of files touched

| File | Action |
|---|---|
| `server/src/gameEngine.ts` | **Move** to `shared/gameEngine.ts` |
| `shared/index.ts` | Re-export from new `gameEngine` |
| `server/src/gameManager.ts` | Update imports to `@blackjack/shared` |
| `server/src/index.ts` | Update imports; verify + fix `disconnect` handler |
| `client/App.tsx` | Strip down to router; extract screens |
| `client/src/screens/ModeSelectScreen.tsx` | **New** |
| `client/src/screens/LobbyScreen.tsx` | **New** (from `App.tsx`) |
| `client/src/screens/TableScreen.tsx` | **New** (from `App.tsx`) |
| `client/src/store/gameStore.ts` | Add `gameMode`, `lastRoomCode`, persistence |
| `client/src/store/soloStore.ts` | **New** |
| `client/src/hooks/useActiveRoom.ts` | **New** |
| `client/src/components/OutOfChipsModal.tsx` | **New** |
| `client/src/components/SpectatorOverlay.tsx` | **New** |
| `shared/__tests__/gameEngine.test.ts` | **New** (with test runner config) |
| `CLAUDE.md` | Update "What's done vs not done" matrix; update repo layout |
