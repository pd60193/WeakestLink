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
