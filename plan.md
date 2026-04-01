# Phase 1: Weakest Link Presentation Portal

## Context

Building a web app to host "The Weakest Link" game show for up to 15 friends. The project is greenfield — only `game_rules.md`, `CLAUDE.md`, `.gitignore`, and `LICENSE` exist. Phase 1 delivers the **Presentation Portal** (TV-castable display) and a **FastAPI backend skeleton**.

---

## Directory Structure

```
WeakestLink/
├── frontend/                          # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout, global fonts/styles
│   │   │   ├── page.tsx               # Landing → redirect to /presentation
│   │   │   ├── globals.css            # Tailwind directives + pastel CSS vars
│   │   │   ├── presentation/
│   │   │   │   ├── page.tsx           # Main TV display (composes all components)
│   │   │   │   └── layout.tsx         # Full-screen, no-scroll layout for TV
│   │   │   ├── admin/page.tsx         # Placeholder
│   │   │   └── player/page.tsx        # Placeholder
│   │   ├── components/presentation/
│   │   │   ├── QuestionDisplay.tsx
│   │   │   ├── MoneyChain.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── TotalScore.tsx
│   │   │   ├── RoundHeader.tsx
│   │   │   └── TimeUpOverlay.tsx
│   │   ├── hooks/
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useTimer.ts
│   │   │   └── useGameState.ts
│   │   ├── lib/
│   │   │   ├── api.ts                 # Fetch helpers for FastAPI
│   │   │   └── constants.ts           # Chain values, difficulty colors, shortcuts
│   │   └── types/game.ts              # Shared TS interfaces
│   └── public/sounds/buzzer.mp3
├── backend/                           # FastAPI app
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                    # Entry point, CORS, router mounting
│   │   ├── models/                    # Pydantic models (player, question, round, game)
│   │   ├── routers/                   # game.py, rounds.py, players.py
│   │   ├── data/                      # mock_questions.json, mock_players.json, game_config.json
│   │   └── services/game_service.py   # Business logic placeholder
│   └── tests/test_api.py
```

---

## Implementation Steps

### Step 1: Scaffold Projects

- `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir`
- Install framer-motion
- Create `backend/` with `requirements.txt` (fastapi, uvicorn, pydantic) and `app/main.py`

### Step 2: Pastel Theme & Tailwind Config

Extend `tailwind.config.ts` with custom colors:

- **Pastel palette**: pink `#FFD3E0`, peach `#FFE5CC`, yellow `#FFF5CC`, mint `#D4F5E9`, sky `#CCE5FF`, lilac `#E8D5F5`, cream `#FFF8F0`
- **Difficulty colors**: easy `#A8E6CF`, medium `#FFD3B6`, mediumHard `#FFAAA5`, hard `#D5AAFF`, spicy `#FF8B94`
- Font: Nunito or Inter for playful readability

### Step 3: TypeScript Types & Constants

- `types/game.ts`: `ChainLevel`, `Question`, `Player`, `RoundConfig`, `GameState`, `GameConfig`
- `lib/constants.ts`: money chain array, difficulty-color map, keyboard shortcut config

### Step 4: Backend Skeleton

**Mock data files:**

- `game_config.json` — chain values, round durations (150s round 1, decreasing by 10s)
- `mock_questions.json` — 20+ questions per round, tagged by difficulty
- `mock_players.json` — sample player list

**API endpoints:**
| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/api/health` | `{"status": "ok"}` |
| GET | `/api/game/config` | Game config JSON |
| GET | `/api/game/state` | Mock initial game state |
| GET | `/api/rounds/{round}/questions` | Questions for a round |
| GET | `/api/players` | Player list |
| POST | `/api/game/action` | Stub (200 + echo) |

**Future stubs (501):** `/api/admin/*`, `/api/players/{id}/vote`

### Step 5: Build Hooks

- **`useTimer`**: interval-based countdown → `{ timeRemaining, isRunning, isPaused, start, pause, resume, reset }`
- **`useGameState`**: chain position, banked totals, question index, revealed flag → `{ markCorrect, markIncorrect, bank, nextQuestion, revealQuestion }`
- **`useKeyboardShortcuts`**: single `keydown` listener dispatching to game state + timer actions

### Step 6: Build Components

1. **MoneyChain** — 9 levels top (10000) to bottom (100). Active level glows/enlarges via Framer Motion. Difficulty color band on each level. Levels above active are dimmed.
2. **Timer** — Circular or bar countdown, MM:SS display. Color shifts: green → yellow → red (pastel). Triggers TimeUpOverlay at zero.
3. **QuestionDisplay** — Hidden: pulsing "Press Space". Revealed: question text with fade+scale animation.
4. **TotalScore** — Fixed bottom bar. "BANKED: {total}" with animated number counter.
5. **RoundHeader** — "Round {n}" and current player name.
6. **TimeUpOverlay** — Full-screen overlay, "TIME'S UP!" scale animation, plays buzzer audio. Dismissed with Escape.

### Step 7: Compose Presentation Page

- Three-column layout: MoneyChain (left) | QuestionDisplay (center) | Timer (right)
- RoundHeader at top, TotalScore anchored at bottom
- Fetch config from backend on mount, fallback to constants
- Full-screen layout (no scroll, overflow hidden)

### Step 8: Placeholder Pages

- `/admin` → "Admin Portal — Coming Soon"
- `/player` → "Player Portal — Coming Soon"

---

## Keyboard Shortcuts

| Key            | Action                       |
| -------------- | ---------------------------- |
| Space          | Reveal question              |
| C / ArrowRight | Mark correct (chain up)      |
| X / ArrowLeft  | Mark incorrect (chain reset) |
| B              | Bank points                  |
| N              | Next question                |
| P              | Pause/resume timer           |
| T              | Start timer                  |
| Escape         | Dismiss overlay              |

---

## Verification

1. `cd backend && uvicorn app.main:app --reload --port 8000`
2. `cd frontend && npm run dev`
3. Open `localhost:3000/presentation` full-screen
4. Test all keyboard shortcuts: reveal, correct, incorrect, bank, next, timer, pause, time-up overlay
5. Verify API: `curl localhost:8000/api/health`, `/api/game/config`, `/api/rounds/1/questions`
6. Visual: pastel theme, readable at TV distance, no scrollbars, smooth animations

---
---

# Phase 2: Admin Portal, Player Portal & Real-Time Game Engine

## Context

Phase 1 delivered a standalone Presentation Portal (`/presentation`) where all game logic lives in frontend hooks controlled by keyboard shortcuts. This works for a single-screen setup but doesn't support the core game show experience: a host controlling the game from a separate device while players vote from their phones.

Phase 2 transforms the app from a single-player keyboard-driven tool into a **multi-device real-time game show platform**. The backend becomes the single source of truth, WebSockets sync all clients, the host gets a dedicated control panel, and players get a mobile voting experience.

---

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Presentation    │    │  Admin Portal    │    │  Player Portal   │
│  /presentation   │    │  /admin          │    │  /player         │
│  (TV - readonly) │    │  (Host tablet)   │    │  (Phone - mobile)│
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │ WS                   │ WS                    │ WS
         └──────────────────────┼────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   FastAPI Backend      │
                    │   WebSocket Hub        │
                    │   Game State Machine   │
                    │   /api/ws/{role}       │
                    └───────────────────────┘
```

**Roles:**
- **Presentation**: Read-only display. Receives state updates, renders them beautifully. No controls.
- **Admin**: Read-write controller. Sends game actions (correct/incorrect/bank/reveal/timer). Sees question + answer. Manages players.
- **Player**: Limited write. Joins game, submits votes. Sees minimal game state during play, full voting UI during voting phase.

---

## Game Phase State Machine (Backend)

```
LOBBY → PLAYING → VOTING → ELIMINATION → ROUND_TRANSITION → PLAYING → ... → FINAL → GAME_OVER
```

| Phase | Description | Admin Can | Players Can | Presentation Shows |
|-------|-------------|-----------|-------------|-------------------|
| `LOBBY` | Waiting for players to join | Start game, manage players | Join/leave | Waiting room, player list |
| `PLAYING` | Active round in progress | Correct/Incorrect/Bank/Reveal/Timer | Spectate | Questions, chain, timer |
| `VOTING` | Round ended, voting open | See votes in real-time, end voting | Vote for weakest link | "Voting in progress" |
| `ELIMINATION` | Votes tallied, reveal | Trigger reveal animation | See result | Dramatic vote reveal + elimination |
| `ROUND_TRANSITION` | Between rounds | Start next round | Wait | Round stats, next round preview |
| `FINAL` | Head-to-head final | Control final questions | Spectate | Final round display |
| `GAME_OVER` | Winner declared | Reset game | See results | Winner celebration |

---

## Backend Implementation

### New Models (`backend/app/models/`)

**`backend/app/models/game_state.py`** — Server-side game state:
```python
class GamePhase(str, Enum):
    LOBBY = "lobby"
    PLAYING = "playing"  
    VOTING = "voting"
    ELIMINATION = "elimination"
    ROUND_TRANSITION = "round_transition"
    FINAL = "final"
    GAME_OVER = "game_over"

class ServerGameState:
    phase: GamePhase
    current_round: int
    chain_position: int
    banked_this_round: int
    total_banked: int
    current_player_index: int
    question_revealed: bool
    time_remaining: int
    timer_running: bool
    timer_paused: bool
    current_question: Question | None
    used_question_ids: set[str]
    players: list[Player]  # ordered, with elimination status
    questions: list[Question]
    round_metrics: dict  # per-player correct counts, values, etc.
    votes: dict[str, str]  # voter_id -> voted_for_id
    eliminated_players: list[Player]  # for tiebreaker voting
```

**`backend/app/models/websocket_messages.py`** — Message protocol:
```python
# Client → Server
class ClientMessage:
    type: str  # "action", "join", "vote", "ping"
    payload: dict

# Server → Client  
class ServerMessage:
    type: str  # "state_update", "phase_change", "player_joined", "vote_result", "error"
    payload: dict
```

### WebSocket Hub (`backend/app/services/websocket_manager.py`)

Manages connections by role:
- `connections: dict[str, list[WebSocket]]` — keyed by "presentation", "admin", "player:{id}"
- Broadcasts state updates to all connected clients
- Filters sensitive data per role (players don't see answers, presentation doesn't see votes in progress)

### Game Service (`backend/app/services/game_service.py`)

Moves all game logic from frontend hooks to backend:
- **Timer**: Server-side countdown using asyncio tasks
- **Question selection**: Random by difficulty, track used IDs
- **Chain/banking logic**: Same as current useGameState but in Python
- **Voting**: Collect votes, tally, apply tiebreakers (eliminated players break ties)
- **Round progression**: Advance rounds, determine strongest link, manage player order
- **Metrics tracking**: Per-player stats for strongest/weakest link determination

### New/Modified Endpoints

**`backend/app/routers/ws.py`** — WebSocket endpoint:
```
WS /api/ws/presentation     — Presentation client
WS /api/ws/admin             — Admin client (authenticated via simple token)
WS /api/ws/player/{player_id} — Player client
```

**`backend/app/routers/game.py`** — Enhanced REST endpoints:
```
POST /api/game/create        — Create new game session
POST /api/game/join          — Player joins (returns player_id)
GET  /api/game/state         — Current state (filtered by role query param)
POST /api/game/action        — Admin actions (correct, incorrect, bank, reveal, etc.)
POST /api/game/vote          — Player submits vote
POST /api/game/start-round   — Admin starts a round
```

### WebSocket Message Protocol

**Admin → Server:**
```json
{"type": "action", "payload": {"action": "correct"}}
{"type": "action", "payload": {"action": "incorrect"}}
{"type": "action", "payload": {"action": "bank"}}
{"type": "action", "payload": {"action": "reveal_question"}}
{"type": "action", "payload": {"action": "start_timer"}}
{"type": "action", "payload": {"action": "toggle_pause"}}
{"type": "action", "payload": {"action": "next_round"}}
{"type": "action", "payload": {"action": "start_voting"}}
{"type": "action", "payload": {"action": "end_voting"}}
{"type": "action", "payload": {"action": "kick_player", "player_id": "..."}}
{"type": "action", "payload": {"action": "reorder_players", "order": [...]}}
```

**Player → Server:**
```json
{"type": "join", "payload": {"name": "Alice"}}
{"type": "vote", "payload": {"voted_for": "player_id"}}
```

**Server → All Clients:**
```json
{"type": "state_update", "payload": { /* filtered game state */ }}
{"type": "phase_change", "payload": {"phase": "voting", "previous": "playing"}}
{"type": "player_joined", "payload": {"player": {"id": "...", "name": "Alice"}}}
{"type": "player_left", "payload": {"player_id": "..."}}
{"type": "vote_cast", "payload": {"voter_id": "...", "total_votes": 5}}
{"type": "vote_result", "payload": {"eliminated": "...", "votes": {...}}}
{"type": "timer_tick", "payload": {"time_remaining": 120}}
{"type": "error", "payload": {"message": "..."}}
```

---

## Frontend Implementation

### Shared Infrastructure

**`frontend/src/hooks/useWebSocket.ts`** — WebSocket connection hook:
- Connect to `ws://localhost:8000/api/ws/{role}`
- Auto-reconnect with exponential backoff
- Parse incoming messages, expose `sendMessage(type, payload)`
- Connection status indicator

**`frontend/src/hooks/useGameSync.ts`** — Game state from server:
- Subscribes to WebSocket state updates
- Maintains local game state mirror
- Exposes same interface as current useGameState (for presentation compatibility)

**`frontend/src/types/game.ts`** — Extended types:
- Add `GamePhase` enum
- Add `VoteResult`, `WebSocketMessage` types
- Add `PlayerSession` (for player portal state)

**`frontend/src/lib/websocket.ts`** — WebSocket client utility (connection, reconnect, message parsing)

### Admin Portal (`/admin`)

**Design Direction**: "Mission Control" — clean, information-dense dashboard with the same pastel palette. Cards with soft shadows, clear action buttons with satisfying press states. Optimized for tablet landscape but works on laptop too.

**Layout** (tablet landscape):
```
┌──────────────────────────────────────────────────────────┐
│  Round 3  │  The Weakest Link - Host Control  │  2:10 ⏸  │
├────────────────────┬─────────────────────────────────────┤
│                    │                                     │
│   QUESTION CARD    │         GAME CONTROLS               │
│   Q: "What is..."  │   ┌─────┐ ┌─────┐ ┌──────┐        │
│   A: "Paris"       │   │  ✓  │ │  ✗  │ │ BANK │        │
│                    │   │ Correct│Incorrect│      │        │
│   [Reveal Next]    │   └─────┘ └─────┘ └──────┘        │
│                    │                                     │
│   Chain: Q5 (1750) │   ┌──────────┐ ┌──────────┐       │
│   Banked: 3,250    │   │▶ Start   │ │⏸ Pause   │       │
│                    │   └──────────┘ └──────────┘       │
├────────────────────┼─────────────────────────────────────┤
│   PLAYERS          │         ROUND STATS                 │
│   → Alice (current)│   Answered: 12                      │
│     Bob            │   Banked: 3,250 pts                 │
│     Charlie        │   Chain: Q5                         │
│     ~~Dave~~ (out) │   Strongest: Alice                  │
│     Eve            │                                     │
│   [Manage Players] │   [Start Voting] [Next Round]       │
└────────────────────┴─────────────────────────────────────┘
```

**Components to create:**
- `frontend/src/components/admin/AdminDashboard.tsx` — Main layout orchestrator
- `frontend/src/components/admin/QuestionCard.tsx` — Shows question + answer + chain info
- `frontend/src/components/admin/GameControls.tsx` — Correct/Incorrect/Bank/Reveal buttons
- `frontend/src/components/admin/TimerControls.tsx` — Start/Pause/Resume + countdown display
- `frontend/src/components/admin/PlayerList.tsx` — Active players, current highlighted, kick/reorder
- `frontend/src/components/admin/RoundInfo.tsx` — Stats, strongest link, phase controls
- `frontend/src/components/admin/VotingPanel.tsx` — See incoming votes, end voting, reveal results
- `frontend/src/components/admin/LobbySetup.tsx` — Pre-game: see joined players, configure rounds, start game

**Key UX Details:**
- Big, touch-friendly buttons (min 48px tap targets) for tablet use
- Correct = green pulse, Incorrect = red shake, Bank = gold shimmer (Framer Motion)
- Current player name prominently displayed above controls
- Question answer always visible (host needs to judge verbal answers)
- Voting panel shows real-time vote count without revealing individual votes until reveal

### Player Portal (`/player`)

**Design Direction**: "Party Card" — minimal, phone-sized, with bold pastel cards and playful micro-interactions. Think mobile game lobby meets party app. One action per screen, large typography, thumb-friendly.

**Screens/States:**

**1. Join Screen** (`/player`):
```
┌─────────────┐
│             │
│  The Weakest│
│  Link       │
│             │
│  ┌─────────┐│
│  │ Your    ││
│  │ Name    ││
│  └─────────┘│
│             │
│  [ JOIN  ]  │
│             │
│  6 players  │
│  waiting... │
└─────────────┘
```

**2. Waiting/Spectate** (during PLAYING phase):
```
┌─────────────┐
│ Round 3     │
│             │
│  ⏱ 1:42    │
│             │
│  Chain: Q5  │
│  1,750 pts  │
│             │
│  Banked:    │
│  3,250 pts  │
│             │
│  You're up  │
│  next!      │
└─────────────┘
```

**3. Voting Screen** (during VOTING phase):
```
┌─────────────┐
│ Vote for the│
│ Weakest Link│
│             │
│ ┌──────────┐│
│ │  Alice   ││
│ └──────────┘│
│ ┌──────────┐│
│ │  Bob     ││
│ └──────────┘│
│ ┌──────────┐│
│ │  Charlie ││
│ └──────────┘│
│             │
│ ⏱ 0:25     │
│ [Confirm]   │
└─────────────┘
```

**4. Elimination Result**:
```
┌─────────────┐
│             │
│  Bob        │
│             │
│  You ARE    │
│  the weakest│
│  link...    │
│             │
│  Goodbye!   │
│             │
└─────────────┘
```

**5. Eliminated Player View** (can still spectate + cast tiebreaker votes):
```
┌─────────────┐
│ You've been │
│ eliminated  │
│             │
│ Spectating  │
│ Round 4     │
│             │
│ ⏱ 1:15     │
│ Chain: Q3   │
└─────────────┘
```

**Components to create:**
- `frontend/src/components/player/JoinScreen.tsx` — Name input, join button, player count
- `frontend/src/components/player/WaitingRoom.tsx` — Pre-game lobby, see who's joined
- `frontend/src/components/player/SpectateView.tsx` — Minimal game state during play
- `frontend/src/components/player/VotingScreen.tsx` — Vote for weakest link with countdown
- `frontend/src/components/player/EliminationReveal.tsx` — Dramatic reveal of who's eliminated
- `frontend/src/components/player/EliminatedView.tsx` — Spectate + tiebreaker voting
- `frontend/src/components/player/GameOverView.tsx` — Final results, winner

**Key UX Details:**
- Mobile-first: 100vh, no horizontal scroll, large text
- Voting: tap player card to select (pastel highlight), confirm button
- 30-second voting timer with visual countdown
- Haptic-style button press animations (scale down on press)
- Connection status dot (green = connected, yellow = reconnecting)
- Player sees "You're up next!" when they're the next player in rotation

### Presentation Portal Updates (`/presentation`)

Minimal changes — replace keyboard-driven local state with WebSocket-driven server state:

**Modified files:**
- `frontend/src/app/presentation/page.tsx` — Replace useGameState/useTimer/useKeyboardShortcuts with useGameSync hook
- Remove keyboard shortcut handling (admin controls the game now)
- Keep all existing components (MoneyChain, QuestionDisplay, Timer, etc.) — they receive props, don't care about source

**New overlays:**
- `frontend/src/components/presentation/VotingOverlay.tsx` — "Players are voting..." with live vote count
- `frontend/src/components/presentation/EliminationOverlay.tsx` — Dramatic reveal: show votes, then "You are the weakest link... Goodbye!"
- `frontend/src/components/presentation/LobbyView.tsx` — Show joined players while in lobby phase
- `frontend/src/components/presentation/GameOverOverlay.tsx` — Winner celebration

---

## Migration Strategy

**Progressive approach** — keep Phase 1 working while building Phase 2:

1. Build backend game engine + WebSocket hub independently
2. Build admin and player portals as new pages (they don't exist yet)
3. Add `useGameSync` hook that wraps WebSocket state into same interface as `useGameState`
4. Update presentation page to use `useGameSync` instead of local hooks
5. Keep `useGameState` hook for potential offline/demo mode

---

## Implementation Steps (Ordered)

### Step 1: Backend Game Engine
**Files to create/modify:**
- `backend/app/models/game_state.py` — GamePhase enum, ServerGameState class
- `backend/app/models/websocket_messages.py` — Message types
- `backend/app/services/game_service.py` — Full game logic (chain, banking, scoring, question selection, metrics, round management)
- `backend/app/services/timer_service.py` — Server-side async timer with tick broadcasts
- `backend/app/services/voting_service.py` — Vote collection, tallying, tiebreakers

### Step 2: WebSocket Infrastructure
**Files to create/modify:**
- `backend/app/services/websocket_manager.py` — Connection management, broadcasting, role-based filtering
- `backend/app/routers/ws.py` — WebSocket endpoint handler
- `backend/app/main.py` — Register WebSocket router

### Step 3: Enhanced REST Endpoints
**Files to modify:**
- `backend/app/routers/game.py` — Add create, join, action, vote, start-round endpoints
- `backend/app/routers/players.py` — Add join, kick, reorder endpoints

### Step 4: Frontend WebSocket Client
**Files to create:**
- `frontend/src/lib/websocket.ts` — WebSocket client utility
- `frontend/src/hooks/useWebSocket.ts` — Connection hook with auto-reconnect
- `frontend/src/hooks/useGameSync.ts` — Server state → local state bridge
- `frontend/src/types/game.ts` — Add GamePhase, WebSocket message types

### Step 5: Admin Portal
**Files to create:**
- `frontend/src/app/admin/page.tsx` — Replace placeholder with AdminDashboard
- `frontend/src/app/admin/layout.tsx` — Admin layout
- `frontend/src/components/admin/AdminDashboard.tsx`
- `frontend/src/components/admin/QuestionCard.tsx`
- `frontend/src/components/admin/GameControls.tsx`
- `frontend/src/components/admin/TimerControls.tsx`
- `frontend/src/components/admin/PlayerList.tsx`
- `frontend/src/components/admin/RoundInfo.tsx`
- `frontend/src/components/admin/VotingPanel.tsx`
- `frontend/src/components/admin/LobbySetup.tsx`

### Step 6: Player Portal
**Files to create:**
- `frontend/src/app/player/page.tsx` — Replace placeholder with player flow
- `frontend/src/app/player/layout.tsx` — Mobile-optimized layout
- `frontend/src/components/player/JoinScreen.tsx`
- `frontend/src/components/player/WaitingRoom.tsx`
- `frontend/src/components/player/SpectateView.tsx`
- `frontend/src/components/player/VotingScreen.tsx`
- `frontend/src/components/player/EliminationReveal.tsx`
- `frontend/src/components/player/EliminatedView.tsx`
- `frontend/src/components/player/GameOverView.tsx`

### Step 7: Presentation Portal Updates
**Files to modify:**
- `frontend/src/app/presentation/page.tsx` — Swap to useGameSync, remove keyboard shortcuts
**Files to create:**
- `frontend/src/components/presentation/VotingOverlay.tsx`
- `frontend/src/components/presentation/EliminationOverlay.tsx`
- `frontend/src/components/presentation/LobbyView.tsx`
- `frontend/src/components/presentation/GameOverOverlay.tsx`

### Step 8: Integration & Polish
- End-to-end testing: admin controls game, presentation displays, players vote
- Voting flow: complete cycle from round end → voting → elimination → next round
- Audio integration: trigger from server events instead of keyboard
- Session reconnection: players can reconnect if they lose connection
- Error handling: graceful degradation if WebSocket drops

---

## Verification Plan

1. **Backend unit tests**: Game service logic (chain, banking, scoring, voting tiebreakers)
2. **WebSocket integration test**: Connect 3 clients (admin, presentation, player), verify message flow
3. **Manual E2E flow**:
   - Open `/presentation` on one browser (TV)
   - Open `/admin` on another (tablet)
   - Open `/player` on 2-3 phone-sized viewports
   - Admin creates game → players join → admin starts round
   - Admin controls questions → presentation updates in real-time
   - Round ends → players vote → elimination reveal on all screens
   - Repeat for multiple rounds
4. **Edge cases**: Player disconnects mid-vote, admin refreshes, tie votes, all players vote same person

---

## Design Tokens (Shared Across Portals)

All portals share the existing pastel palette from `globals.css`. New additions:
- Voting accent: `--pastel-coral: #FFB4A2` (warm, attention-grabbing for vote cards)
- Success green for correct: existing `--difficulty-easy: #A8E6CF`
- Error red for incorrect: existing `--difficulty-hard: #FF8B94`  
- Bank gold: `--pastel-gold: #FFE066`
- Connection status: green dot = connected, amber = reconnecting, red = disconnected
