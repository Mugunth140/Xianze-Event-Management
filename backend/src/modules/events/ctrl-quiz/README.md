# Ctrl + Quiz Module

## ⚠️ Implementation Status

**Status**: Placeholder only - no business logic implemented

## Event Type

**Technical / Knowledge-based** - Keyboard shortcut quiz competition

## Description

Ctrl + Quiz is a knowledge-based competition focusing on keyboard shortcuts (e.g., "What does Ctrl + P do?"). Questions test participants' knowledge of common software shortcuts.

## Intended Architecture

```
┌─────────────────────────────────────────────┐
│            Ctrl + Quiz Flow                 │
├─────────────────────────────────────────────┤
│  Quiz Engine                                │
│  ├── Shortcut questions database            │
│  ├── Session state in Redis                 │
│  ├── Timed rounds                           │
│  └── Score tracking                         │
└─────────────────────────────────────────────┘
```

## Redis Usage

This module will use Redis for:

- **Session State**: Track participant progress
- **Question Cache**: Cache active round questions
- **Timer State**: Question/round countdown management
- **Leaderboard Cache**: Real-time score updates

See [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) for key naming conventions.

## Expected Features (DO NOT IMPLEMENT YET)

- [ ] Shortcut question bank
- [ ] Quiz session management
- [ ] Timed questions
- [ ] Score calculation
- [ ] Real-time leaderboard

## Files to Create

When implementing this module, create:

```
ctrl-quiz/
├── entities/
│   ├── shortcut-question.entity.ts
│   └── quiz-session.entity.ts
├── dto/
│   ├── create-question.dto.ts
│   └── submit-answer.dto.ts
├── ctrl-quiz.controller.ts
├── ctrl-quiz.service.ts
└── ctrl-quiz.module.ts
```

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Event taxonomy
- [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) - Redis caching guidelines
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Module implementation guide
