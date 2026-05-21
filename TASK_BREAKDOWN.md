# Blackjack Game — Detailed Task Breakdown

> Following Amazon Agent SOP: PRD → Detailed Tasks → Code Generation

---

## Phase 0: Code Audit Complete ✅

**Existing Implementation Status:**

| Component | Status | Notes |
|-----------|--------|-------|
| Core game engine (server) | ✅ 90% | Full logic: deal, hit, stand, double, split, blackjack, payouts |
| Card rendering | ✅ Basic | Simple CardView component exists |
| Socket.io server | ✅ Basic | Room join/leave, game events working |
| Game state management | ✅ Basic | Zustand store with player/room state |
| Main game UI | ⚠️ Functional | Works but needs polish/animations |
| Settings system | ❌ Missing | No UI or persistence |
| Audio/Music | ❌ Missing | Not implemented |
| Ads integration | ❌ Missing | Not implemented |
| Animations | ❌ Missing | No card flip, chip toss, etc. |
| Redis persistence | ❌ Missing | In-memory only |
| Insurance logic | ❌ Missing | Setting exists but not implemented |
| Surrender action | ❌ Missing | Not in game engine |
| Chip reload flow | ❌ Missing | No ads integration |
| Solo play mode | ❌ Missing | Only multiplayer rooms |

---

## Phase 1: Foundation & Polish (Priority: HIGH)

### Task 1.1: Add Missing Game Actions
**Acceptance Criteria:**
- [ ] Implement `surrender` action in gameEngine.ts (late surrender, first 2 cards only, lose half bet)
- [ ] Implement `insurance` action when dealer shows Ace (side bet up to half original bet, pays 2:1 if dealer has BJ)
- [ ] Update types.ts to include insurance bet in PlayerHand
- [ ] Test all actions work correctly via socket events

**Files to modify:**
- `server/src/gameEngine.ts`
- `shared/types.ts`

---

### Task 1.2: Implement Settings UI & Persistence
**Acceptance Criteria:**
- [ ] Create Settings screen/modal with all options from PRD
- [ ] Persist settings to localStorage
- [ ] Sync settings to server when creating/joining room
- [ ] Allow host to change settings before game starts
- [ ] Visual feedback for current settings

**Settings to implement:**
- Number of Decks: 2, 4, 6, 8, 10 (default: 6)
- Dealer Hits on Soft 17: On/Off (default: On)
- Ask Insurance: On/Off (default: On)
- Auto Last Bet: On/Off (default: On)
- Sound Effects: On/Off (default: On)
- Background Music: On/Off (default: On)
- Music Volume: 0-100% slider (default: 50%)
- Animation Speed: Normal/Fast/Instant (default: Normal)

**Files to create/modify:**
- `client/src/components/SettingsModal.tsx` (new)
- `client/src/store/settingsStore.ts` (new)
- `client/App.tsx` (add settings button)
- `server/src/gameManager.ts` (accept custom settings)

---

### Task 1.3: Add Audio System
**Acceptance Criteria:**
- [ ] Audio manager service with Howler.js (or expo-av)
- [ ] Background music loop (casino jazz, royalty-free)
- [ ] Sound effects for: card deal, chip place, win, bust, blackjack, button click
- [ ] Volume control respects settings
- [ ] Music fades during result announcements
- [ ] All audio assets loaded or placeholder URLs defined

**Files to create:**
- `client/src/services/audioManager.ts`
- `client/assets/audio/` (directory for sfx and music)

---

## Phase 2: Visual Polish & UX (Priority: HIGH)

### Task 2.1: Card Animations
**Acceptance Criteria:**
- [ ] Card deal animation (slide from deck to position)
- [ ] Card flip animation (3D transform for hole card reveal)
- [ ] Staggered deal sequence (dealer → p1 → p2...)
- [ ] Card hover/press feedback
- [ ] Animation speed respects settings

**Files to modify:**
- `client/src/components/CardView.tsx`
- `client/src/components/AnimatedCard.tsx` (new wrapper)
- `client/App.tsx` (integrate animations)

---

### Task 2.2: Chip & Betting UI
**Acceptance Criteria:**
- [ ] Visual chip components ($10, $25, $50, $100, $500)
- [ ] Chip stack animation when placing bets
- [ ] Chip tray UI showing available chips
- [ ] Bet placement animation (chip toss to betting circle)
- [ ] Visual feedback for current bet amount
- [ ] Auto Last Bet functionality

**Files to create:**
- `client/src/components/Chip.tsx`
- `client/src/components/ChipStack.tsx`
- `client/src/components/BettingArea.tsx`

---

### Task 2.3: Game Table Redesign
**Acceptance Criteria:**
- [ ] Dark luxury casino theme (green felt, gold accents)
- [ ] Proper table layout (dealer top, players bottom)
- [ ] Player positions arranged in arc for multiplayer
- [ ] Dealer area with hole card hidden
- [ ] Clear turn indicators (highlight active player)
- [ ] Win/loss/push overlays with animations
- [ ] Confetti burst on Blackjack

**Files to modify:**
- `client/App.tsx` (major restyle)
- `client/src/components/Table.tsx` (new)
- `client/src/components/PlayerSeat.tsx` (new)

---

### Task 2.4: Results & Game Flow UI
**Acceptance Criteria:**
- [ ] Results overlay showing all hands vs dealer
- [ ] Payout breakdown display
- [ ] Next round countdown/timer
- [ ] Session stats (hands played, win rate, current streak)
- [ ] Chip balance animation on win/loss

**Files to create:**
- `client/src/components/ResultsOverlay.tsx`
- `client/src/components/SessionStats.tsx`

---

## Phase 3: Solo Play Mode (Priority: MEDIUM)

### Task 3.1: Single Player vs Dealer
**Acceptance Criteria:**
- [ ] "Play Solo" option on home screen
- [ ] No room code needed, instant game start
- [ ] Same game logic but client-side only (no server)
- [ ] Local storage for chip balance and stats
- [ ] Option to switch to multiplayer from solo

**Files to create:**
- `client/src/screens/SoloGameScreen.tsx`
- `client/src/engine/soloGameEngine.ts` (client-side version)

---

## Phase 4: Ad Monetization (Priority: MEDIUM)

### Task 4.1: Ad Integration Framework
**Acceptance Criteria:**
- [ ] Google Ad Manager or similar SDK integrated
- [ ] Ad configuration system (placements, frequency caps)
- [ ] Analytics tracking for ad impressions

**Files to create:**
- `client/src/services/adManager.ts`
- `client/src/components/AdBanner.tsx`

---

### Task 4.2: Ad Placements
**Acceptance Criteria:**
- [ ] Sidebar banner (300×600) — persistent, low opacity
- [ ] Between rounds native banner (728×90) — every 3-5 rounds
- [ ] Chip reload modal with rewarded ad option
- [ ] Room waiting screen banner (320×50)
- [ ] Settings drawer footer banner (320×50)
- [ ] Frequency cap: max 1 interstitial per 10 minutes

**Files to modify:**
- `client/App.tsx` (add ad containers)
- `client/src/components/ChipReloadModal.tsx` (new)

---

### Task 4.3: Chip Reload Flow
**Acceptance Criteria:**
- [ ] Detect when chips hit $0
- [ ] Show modal: "You're out of chips!"
- [ ] Option 1: Watch ad for $500 instant reload
- [ ] Option 2: Wait 30 minutes for free reload
- [ ] Track ad completion and grant chips

**Files to create:**
- `client/src/components/OutOfChipsModal.tsx`

---

## Phase 5: Backend Hardening (Priority: MEDIUM)

### Task 5.1: Redis Integration
**Acceptance Criteria:**
- [ ] Redis client configured
- [ ] Room state persisted to Redis
- [ ] Player sessions stored in Redis
- [ ] Fallback to memory if Redis unavailable
- [ ] Room expiration (auto-cleanup after 1 hour inactive)

**Files to modify:**
- `server/src/gameManager.ts`
- `server/src/redisClient.ts` (new)

---

### Task 5.2: API Endpoints
**Acceptance Criteria:**
- [ ] `POST /rooms` — Create room
- [ ] `GET /rooms/:code` — Get room info
- [ ] `POST /rooms/:code/join` — Join room
- [ ] `POST /rooms/:code/leave` — Leave room
- [ ] Health check endpoint
- [ ] Rate limiting on room creation

**Files to modify:**
- `server/src/index.ts` (add REST routes)

---

## Phase 6: Testing & Deployment (Priority: LOW)

### Task 6.1: Game Logic Testing
**Acceptance Criteria:**
- [ ] Unit tests for gameEngine.ts
- [ ] Test all edge cases: splits, doubles, insurance, surrender
- [ ] Test payout calculations
- [ ] Test deck exhaustion and reshuffle

**Files to create:**
- `server/src/__tests__/gameEngine.test.ts`

---

### Task 6.2: Deployment Setup
**Acceptance Criteria:**
- [ ] Docker configuration for server
- [ ] Environment variable configuration
- [ ] Production build scripts
- [ ] README with setup instructions

**Files to create:**
- `Dockerfile`
- `docker-compose.yml`
- `.env.example`
- `README.md`

---

## Task Priority Summary

| Phase | Priority | Est. Hours | Dependencies |
|-------|----------|------------|--------------|
| 1.1 Missing Actions | HIGH | 4h | None |
| 1.2 Settings System | HIGH | 6h | None |
| 1.3 Audio System | HIGH | 4h | None |
| 2.1 Card Animations | HIGH | 6h | None |
| 2.2 Chip UI | HIGH | 5h | None |
| 2.3 Table Redesign | HIGH | 8h | 2.1, 2.2 |
| 2.4 Results UI | HIGH | 4h | 2.3 |
| 3.1 Solo Mode | MEDIUM | 6h | 1.1, 1.2 |
| 4.1-4.3 Ads | MEDIUM | 8h | 2.4 |
| 5.1-5.2 Backend | MEDIUM | 6h | None |
| 6.1-6.2 Testing/Deploy | LOW | 6h | All above |

**Total Estimated: ~63 hours**

---

## Next Steps

1. Pick a task from Phase 1 (recommend starting with 1.1 or 1.2)
2. I'll generate detailed implementation with code
3. You review and we iterate
4. Move to next task

Which task should we start with?
