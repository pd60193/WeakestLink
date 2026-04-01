# Role Context

You are an expert Full-Stack React (Next.js) and Python (FastAPI) developer with a strong eye for UI/UX design.

# Project Overview

I am building a custom, interactive web application to host a localized version of the game show "The Weakest Link" for up to 15 friends. The rules of the game are defined in the attached `game_rules.md` file.

This project will be built in iterations. For this first iteration, I only want you to build the **Frontend Presentation Portal** and the **Backend Skeleton**.

---

### Tech Stack

- **Frontend:** Next.js (React), Tailwind css, Use pastel colors in [this](https://colorhunt.co/palettes/pastel) to design a playful, artsy theme, use light colors which make the portal look nice and playful. Framer Motion (for animations if needed).
- **Backend:** Python with FastAPI.

---

### Phase 1 Scope: The Presentation Portal

This portal will be cast to a large TV screen for all players to see. It must be production-quality, visually stunning, and contain the following features:

**1. Main Display Layout**

- **Question Display:** The current question should be prominently displayed in the center. The question should only be revealed when I trigger a specific keyboard press (e.g., Spacebar).

**2. The Money Chain & Difficulty Indicators**
Display a vertical or styled progression chain of the point values. The UI must clearly highlight the _current_ point value being contested.
The chain consists of 9 levels. I want subtle background colors or visual indicators on the UI to represent the difficulty of the current node:

- **Q1:** 100 (Easy)
- **Q2:** 250 (Easy)
- **Q3:** 500 (Medium)
- **Q4:** 1000 (Medium)
- **Q5:** 1750 (Medium-Hard)
- **Q6:** 3000 (Medium-Hard)
- **Q7:** 4500 (Hard)
- **Q8:** 6500 (Hard)
- **Q9:** 10000 (Spicy / Extremely Hard)

The total accumulated points across all rounds must be anchored securely at the absolute bottom of the screen.

This should look like [this](https://drive.google.com/file/d/1HKW2c6c0d1jZHaaCtccEcZYwH24Bs5TO/view?usp=sharing).

**3. Round Timer**

- A clearly visible countdown timer for the current round.
- Must include a pause/resume function (via keyboard shortcut or hidden UI toggle) in case of real-world interruptions.
- When the timer hits zero, it should trigger a visual animation and play an audio file (akin to a game show "time up" buzzer).

**4. Configurability**
The application architecture must be fully data-driven. Player details, round time limits, and the question banks for each round must be easily configurable (e.g., via JSON files or simple backend mocks for now).

---

### UI / UX & Design Guidelines

Instead of the dark, intimidating look of the real TV show, I want a **playful, artsy, and light theme**.

- **Color Palette:** Strictly use pastel colors to make the portal look inviting and fun.
- **Reference:** Base the color scheme around the palettes found here: https://colorhunt.co/palettes/pastel

---

### Future Scope (Acknowledge, but do not build yet)

Please structure the Next.js routing and FastAPI endpoints knowing that in future iterations we will add:

1.  **Admin Portal:** A separate view for me (the host) to control the game state, trigger correct/incorrect/bank actions, and manage the timer.
2.  **Player Portal:** Another endpoint/view optimized for mobile devices where the 15 friends can connect and submit their votes for who to eliminate.

---

### Strongest Link Tiebreaking Rules

When determining the Strongest Link at the end of a round, apply these tiebreakers in order:

1. **Most correct answers** — player with the highest number of correctly answered questions
2. **Highest amount banked** — if tied on correct answers, the player who banked the most points wins
3. **First in round order** — if still tied, the player who went first in the round (earliest in the active players list) is deemed strongest

---

### Your Task

1. Write the Next.js frontend code for the Presentation Portal, breaking it down into logical, modular React components (e.g., `Timer`, `MoneyChain`, `QuestionDisplay`).
2. Provide the CSS/Tailwind configuration necessary to achieve the artsy pastel aesthetic.
3. Write the basic FastAPI backend skeleton with mock data structures that the frontend will eventually consume.
