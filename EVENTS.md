# XIANZE Event Taxonomy

This document provides a complete overview of all events in the XIANZE Event Management System, their requirements, and implementation status.

---

## Quick Reference

| #   | Event                                       | Type          | Backend     | Frontend    | Registration | Status         |
| --- | ------------------------------------------- | ------------- | ----------- | ----------- | ------------ | -------------- |
| 1   | [Buildathon](#1-buildathon)                 | Technical     | ✅ Required | ✅ Required | ✅ Yes       | 📦 Placeholder |
| 2   | [Bug Smash](#2-bug-smash)                   | Technical     | ✅ Required | ✅ Required | ✅ Yes       | 📦 Placeholder |
| 3   | [Paper Presentation](#3-paper-presentation) | Non-technical | ⚡ Minimal  | ✅ Required | ✅ Yes       | 📦 Placeholder |
| 4   | [Gaming](#4-gaming-free-fire-mobile)        | Non-technical | ❌ None     | ⚡ Minimal  | ✅ Yes       | 📦 Placeholder |
| 5   | [Ctrl + Quiz](#5-ctrl--quiz)                | Technical     | ✅ Required | ✅ Required | ✅ Yes       | 📦 Placeholder |
| 6   | [Code Hunt](#6-code-hunt)                   | Activity      | ✅ Required | ✅ Required | ✅ Yes       | 📦 Placeholder |
| 7   | [Think & Link](#7-think--link)              | Visual        | ⚡ Minimal  | ✅ Required | ✅ Yes       | 📦 Placeholder |
| 8   | [Fun Games](#8-fun-games-special)           | Special       | ❌ None     | ✅ Required | ❌ **No**    | 📦 Placeholder |

### Legend

- ✅ Required - Full implementation needed
- ⚡ Minimal - Light implementation (metadata, config only)
- ❌ None - No implementation needed
- 📦 Placeholder - Scaffolding only, no business logic

---

## Event Details

### 1. Buildathon

**Type:** Technical (Hackathon-style)

**Description:**
A hackathon-style competition where participants build projects using the XIANZE platform APIs. The same backend powers both the platform and the challenge APIs that participants consume.

**Architecture:**

```
Platform Backend → Exposes Challenge APIs → Participant Projects
```

**Backend Requirements:**

- Team registration and management
- Project submission system
- Judging workflow
- Leaderboard API

**Frontend Requirements:**

- Event information page
- Team registration form
- Project submission portal
- Leaderboard display

**Redis Usage:** Optional (session caching)

---

### 2. Bug Smash

**Type:** Technical (Debugging competition)

**Description:**
A multi-round debugging competition. Round 1 is an MCQ-based quiz testing debugging knowledge, powered by the backend with Redis for session state management.

**Architecture:**

```
┌─────────────────────────────────────┐
│  Round 1: MCQ Quiz                  │
│  ├── Questions in Database          │
│  ├── Session State in Redis         │
│  └── Real-time Scoring              │
├─────────────────────────────────────┤
│  Round 2+: Live Debugging           │
│  └── (Design TBD)                   │
└─────────────────────────────────────┘
```

**Backend Requirements:**

- Question bank management
- Quiz session engine
- Answer validation
- Score calculation
- Leaderboard

**Frontend Requirements:**

- Quiz interface with timer
- Question display
- Answer submission
- Real-time score updates
- Leaderboard

**Redis Usage:** ✅ Required

- Session state tracking
- Question caching
- Timer state
- Real-time leaderboard cache

---

### 3. Paper Presentation

**Type:** Non-technical

**Description:**
Academic/research paper presentation event. Participants present research papers or project proposals to judges.

**Backend Requirements:** Minimal

- Event metadata (uses shared system)
- Registration (uses shared system)

**Frontend Requirements:**

- Event information page
- Submission guidelines
- Schedule display

**Redis Usage:** Not needed

---

### 4. Gaming (Free Fire Mobile)

**Type:** Non-technical (Esports)

**Description:**
Mobile gaming esports tournament. Tournament management is handled externally.

**Backend Requirements:** None

- No platform integration needed
- Results may be manually updated

**Frontend Requirements:** Minimal

- Event information page
- Tournament bracket display (static/embed)
- Results page

**Redis Usage:** Not needed

---

### 5. Ctrl + Quiz

**Type:** Technical / Knowledge-based

**Description:**
A quiz competition focused on keyboard shortcuts. Tests participants' knowledge of shortcuts across different software and operating systems.

**Sample Questions:**

- "What does Ctrl + Shift + Esc do in Windows?"
- "Which shortcut opens a new incognito window in Chrome?"

**Backend Requirements:**

- Shortcut question bank
- Quiz session management
- Timed question delivery
- Score calculation

**Frontend Requirements:**

- Quiz interface with timer
- Question display
- Real-time feedback
- Leaderboard

**Redis Usage:** ✅ Required

- Session state tracking
- Question caching
- Timer synchronization
- Real-time leaderboard

---

### 6. Code Hunt

**Type:** Team / Activity-based

**Description:**
Team-based word guessing game (like charades) with a tech twist. One team member acts out programming terms while others guess.

**Example Terms:**

- "Debugging"
- "Cloud Computing"
- "Merge Conflict"
- "Stack Overflow"

**Backend Requirements:**

- Tech word/phrase bank
- Team management
- Round tracking
- Score calculation

**Frontend Requirements:**

- Team registration
- Timer display
- Word reveal for actor
- Scoring interface

**Redis Usage:** Optional (timer sync)

---

### 7. Think & Link

**Type:** Visual / Connection-based

**Description:**
Visual puzzle game where participants find connections between images or concepts shown in slides. Primarily frontend-driven.

**Example:**

- _Images:_ Apple logo, Newton, New York City
- _Connection:_ "Apple"

**Backend Requirements:** Minimal

- Slide configuration metadata
- Answer verification
- Score tracking

**Frontend Requirements:**

- Slideshow display system
- Timer
- Answer input
- Scoring

**Redis Usage:** Optional

- Session state (if needed)
- Real-time leaderboard cache

---

### 8. Fun Games (SPECIAL)

**Type:** Special

> [!CAUTION]
> **Fun Games has special restrictions that differ from all other events!**

| Aspect                      | Status     |
| --------------------------- | ---------- |
| Registration Required       | ❌ **NO**  |
| Backend Participation Logic | ❌ **NO**  |
| Competitive Scoring         | ❌ **NO**  |
| Drop-in Participation       | ✅ **YES** |

**Description:**
Casual, entertainment-focused activities during the event. Designed to be inclusive and accessible with no barriers to participation.

**Why No Registration?**

- Drop-in participation encouraged
- No competitive scoring needed
- Community engagement focused
- Maximum inclusivity

**Backend Requirements:** None

**Frontend Requirements:**

- Event information page (public)
- Activity schedule
- Photo gallery (optional)

**Redis Usage:** Not needed

---

## Implementation Guidelines

### For Contributors

When implementing an event:

1. **Check this document** for backend/frontend requirements
2. **Read the event README** in the respective module folder
3. **Follow the patterns** in [CONTRIBUTING.md](/backend/CONTRIBUTING.md)
4. **Use Redis** only where indicated (see [CACHE_STRATEGY.md](/CACHE_STRATEGY.md))
5. **Work on a feature branch** and raise a PR/MR

### Backend Module Locations

```
backend/src/modules/events/
├── buildathon/
├── bug-smash/
├── paper-presentation/
├── gaming/
├── ctrl-quiz/
├── code-hunt/
├── think-link/
└── fun-games/
```

### Frontend Route Locations

```
frontend/app/events/
├── buildathon/
├── bug-smash/
├── paper-presentation/
├── gaming/
├── ctrl-quiz/
├── code-hunt/
├── think-link/
└── fun-games/
```

---

## Related Documentation

- [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) - Redis caching guidelines
- [RUNTIME.md](/RUNTIME.md) - Bun.js runtime information
- [Backend CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Backend contribution guide
- [Frontend CONTRIBUTING.md](/frontend/CONTRIBUTING.md) - Frontend contribution guide
