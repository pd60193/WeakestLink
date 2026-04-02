# Role Context

You are an expert Full-Stack React (Next.js) and Python (FastAPI) developer with a strong eye for UI/UX design.

# Project Overview

A custom web application to host a localized version of the game show "The Weakest Link" for up to 15 friends. Multi-device real-time game show platform with three portals synced via WebSocket.

---

### Tech Stack

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS v4 (`@theme inline` syntax), Framer Motion, Nunito font
- **Backend:** Python FastAPI, Pydantic models, WebSocket hub
- **Testing:** Vitest (frontend), pytest + pytest-asyncio (backend)

---

### Architecture

```
Presentation (/presentation)  Admin (/admin)   Player (/player)
       │ WS (read-only)         │ WS (control)    │ WS (vote)
       └────────────────────────┼─────────────────┘
                    FastAPI Backend (Single Source of Truth)
```

- **Presentation** (`/presentation`): Cast to TV. Read-only display — questions (no answers), money chain, timer, vote reveal sequence.
- **Admin** (`/admin`): Host tablet/laptop. Full game control — correct/incorrect/bank, timer, player management, vote reveal controls.
- **Player** (`/player`): Mobile phone. Join game, spectate during rounds, vote during voting phase.

### Game Phase State Machine

```
LOBBY → PLAYING → VOTING → ELIMINATION → ROUND_TRANSITION → PLAYING → ... → GAME_OVER
```

### WebSocket Protocol

- Role-based state filtering: presentation (no answers/votes), admin (full), player (personalized)
- Pass-through events for UI-only state: `reveal_next_vote`, `reveal_all_votes`

---

### Phase 1 (Complete): Presentation Portal

- Question display with typewriter animation, money chain (9 levels, 100→10,000), round timer with pause/resume
- Audio system (intro/middle/outro segments), session persistence (localStorage), round progression

### Phase 2 (Current): Admin Portal, Player Portal & Real-Time Engine

**Backend:**
- Game service with full game logic (chain, banking, scoring, question selection, metrics, round management)
- Server-side timer with async countdown and tick broadcasts
- Voting service with vote collection, tallying, and 30-second timer
- WebSocket manager with role-based connection management and broadcasting
- Deferred elimination: `end_voting` stores `pending_elimination_id`, `confirm_elimination` applies it

**Admin Portal:**
- Question card (shows answer), game controls (correct/incorrect/bank), timer controls
- Player management (reorder, kick), round info, voting panel with reveal controls
- Keyboard shortcuts: C=correct, X=incorrect, B=bank, N=next vote, R=reveal all, Enter=confirm elimination

**Player Portal:**
- Join screen, waiting room, spectate view during play, voting screen with countdown
- Auto-end voting when all players have voted

**Presentation Updates:**
- WebSocket-driven state (replaces keyboard-driven local state)
- Vote reveal overlay: voting progress → "Voting Complete!" → vote-by-vote reveal → elimination result
- Side-by-side layout: TimeUpOverlay (left) + VoteRevealOverlay (right)

---

### The Money Chain

- **Q1:** 100 (Easy), **Q2:** 250 (Easy), **Q3:** 500 (Medium), **Q4:** 1000 (Medium)
- **Q5:** 1750 (Medium-Hard), **Q6:** 3000 (Medium-Hard), **Q7:** 4500 (Hard), **Q8:** 6500 (Hard)
- **Q9:** 10000 (Spicy)

### Strongest Link Tiebreaking Rules

1. **Most correct answers**
2. **Highest total value of correctly answered questions**
3. **First in round order** (earliest in active players list)

---

### UI / UX & Design Guidelines

- **Playful, artsy, light theme** — NOT dark like the TV show
- **Color Palette:** Strictly pastel colors. Cream background (#FFF8F0), foreground #4A4A4A
- Difficulty colors: Easy=#A8E6CF, Medium=#FFD3B6, Medium-Hard=#FFB87A, Hard=#FF8B94, Spicy=#4A4A5A
- Use "pts" not "$" for point values
- Unicode escapes in JSX (`{"\u25B6"}`), not HTML entities

---

### Key Technical Notes

- DIFFICULTY_COLORS must be raw hex values (not CSS vars) for alpha concatenation
- Tailwind v4 uses `@theme inline {}` not `tailwind.config.ts`
- Typewriter state reset must be synchronous during render, not in useEffect
- Bank does NOT mark question as used, NOT increment counter, NOT advance player
- First question hidden until timer starts
- `mark_incorrect` is two-phase: show answer (1s), then advance
- CORS must include both `http://localhost:3000` and `http://localhost:3001`
