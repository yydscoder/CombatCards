Overview
This session focused on eliminating an intermittent issue where the player hand occasionally failed to appear until a full page refresh. The root of the problem was not a single rendering bug, but a sequence/timing problem across state transitions, container visibility, and hand initialization. I learnt a lot about the different recognition zones of where the drag and drop actually works on. 

The work in this session targeted:
- high-priority reliability failure (hand never appearing after initial timeout which would cause fustration for the player)
- medium-priority combat flow ordering issues (initialization while hidden, creating a ghost hand)
- medium-priority state inconsistency (duplicate initial draw + forced re-render which would break the game mechanic)

## Problem Statement
Observes behavior:
- In some combat entries, hand cards did not render visibly.
- Refreshing the page generally restored expected behavior but is not a smooth experience for the user.

Symptoms seen in logs and flow:
- Hand UI initialization can start before combat panel visibility is enabled.
- Hand container begins as `display: none` and only becomes visible on combat state switch.
- A failed layout wait could leave `HandUI.initialized` false with queued renders never committing if no retry path exists.
- Combat start flow had redundant hand setup paths that could produce unstable first-frame state.

## Root Cause Analysis

### Root Cause 1 (High): One-shot init failure without robust retry
`HandUI.init()` depended on non-zero dimensions and could fail while the hand container remained hidden. Without a safe retry mechanism, this created a failure mode where rendering stayed deferred and the hand remained effectively non-interactive/invisible until refresh again breaking the flow of the game. 

Technical failure pattern:
1. Hand UI constructed.
2. Container measured while hidden (`display: none`).
3. Layout wait fails/times out.
4. `initialized` stays false.
5. Future render calls queue but may not recover reliably without re-init retry.

### Root Cause 2 (Medium): Combat flow ordering
Combat setup called `hand.initHand()` before entering combat state visibility. This increased the chance of measuring hidden container dimensions and racing UI setup against DOM visibility.

### Root Cause 3 (Medium): Duplicate initial hand draw and render path
Combat flow also performed an extra `drawCard(5)` + hand assignment immediately after `hand.initHand()` (which already draws/sets initial hand). A second forced re-render in `requestAnimationFrame` further complicated startup state and made behavior harder to reason and troubleshoot about. 

## Implemented Fixes

### 1) Resilient HandUI initialization and recovery
File: `src/hand/HandUI.js`

Changes:
- Added init lifecycle guards:
  - `initInProgress`
  - `initRetryTimer`
- Updated `init()` to:
  - return early if already initialized or currently initializing
  - set/reset `initInProgress` consistently
  - schedule retry on layout wait failure instead of hard failing
- Added `scheduleInitRetry()` with bounded interval polling (`250ms`) until container is visible and init succeeds.
- Updated `renderHand()` so deferred renders also trigger retry scheduling when not initialized.
- Added timer cleanup in `destroy()` to prevent orphaned retries.

Result:
- Hand UI now self-recovers when first init attempt occurs while container is hidden.
- Eliminates the “refresh required” failure mode caused by one-shot init timeout.


### 2) Combat setup ordering fix
File: `main.js`

Changes in `startCombat(...)`:
- Moved `setGameState(GameStateEnum.COMBAT)` to occur before `hand.initHand()`.
- This guarantees hand container visibility state is correct before hand setup/render begins.

Result:
- Reduced race window between visibility and hand initialization.
- More deterministic first-frame rendering behavior.


### 3) Removed duplicate initial draw and forced re-render
File: `main.js`

Removed from combat startup:
- extra startup draw block:
  - `gameState.cardPileManager.drawCard(5)`
  - `hand.cards = gameState.cardPileManager.getHand()`
- extra forced RAF hand re-render block:
  - `requestAnimationFrame(() => hand.handUI.renderHand(hand.cards))`

Result:
- `hand.initHand()` is now the single source of truth for initial hand creation/render.
- Prevents inconsistent startup hand size and reduces transient state churn.


## Technical Validation
Post-change diagnostics:
- `main.js`: no errors
- `src/hand/HandUI.js`: no errors
- `src/hand/Hand.js`: no errors

Behavioral expectations after patch:
- Hand appears consistently on first combat entry.
- No more hidden-container initialization deadlock.
- Startup hand state deterministic (single initial draw path).
- Fewer startup relayout artifacts due to removal of redundant re-render.



## Architectural Notes
This session improved startup reliability greatly by aligning three responsibilities cleanly:
- State manager (`setGameState`) controls visibility first.
- Hand orchestrator (`hand.initHand`) performs one canonical initial hand setup.
- Hand UI (`HandUI`) owns retry-safe DOM readiness checks and recovery.

This separation makes future tuning easier:
- visual tuning in `HandLayout`
- event/UI behavior in `HandUI`
- combat lifecycle orchestration in `main.js`



## Remaining Risks / Follow-ups
1. Add explicit startup telemetry counters for first-combat init success/failure/retry count.
2. Consider max retry cap + fallback warning UI if container never becomes visible (defensive UX).
3. Add regression checks around map -> combat -> map transitions to verify hand cleanup/reinit across repeated encounters.
4. Evaluate whether `arcAngle` option in `Hand` config is deprecated/no-op relative to current `HandLayout` spread logic, and remove dead config if confirmed.

---

## TLDR
This session resolved the major reliability issue behind intermittent missing hand rendering and hardened combat startup flow by removing duplicate initialization paths and enforcing visibility-first sequencing.
