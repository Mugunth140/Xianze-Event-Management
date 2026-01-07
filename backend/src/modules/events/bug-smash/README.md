# Bug Smash Module

## ⚠️ Implementation Status

**Status**: Placeholder only - no business logic implemented

## Event Type

**Debugging** - Find and fix bugs competition

## Description

Bug Smash is a debugging competition with multiple rounds. Round 1 is MCQ-based, powered by the backend and frontend with Redis caching for question state management.

## Intended Architecture

```
┌─────────────────────────────────────────────┐
│              Bug Smash Flow                 │
├─────────────────────────────────────────────┤
│  Round 1: MCQ Quiz                          │
│  ├── Questions stored in database           │
│  ├── Active session state in Redis          │
│  └── Frontend renders quiz UI               │
├─────────────────────────────────────────────┤
│  Round 2+: Debugging Challenges             │
│  └── (To be designed)                       │
└─────────────────────────────────────────────┘
```

## Redis Usage

This module will use Redis for:

- **Session State**: Track participant progress through questions
- **Question Cache**: Cache active round questions
- **Timer State**: Round countdown management

See [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) for key naming conventions.

## Expected Features (DO NOT IMPLEMENT YET)

- [ ] Question bank management
- [ ] Round configuration
- [ ] MCQ quiz engine
- [ ] Score calculation
- [ ] Leaderboard

## Files to Create

When implementing this module, create:

```
bug-smash/
├── entities/
│   ├── question.entity.ts
│   └── submission.entity.ts
├── dto/
│   ├── create-question.dto.ts
│   └── submit-answer.dto.ts
├── bug-smash.controller.ts
├── bug-smash.service.ts
└── bug-smash.module.ts
```

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Event taxonomy
- [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) - Redis caching guidelines
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Module implementation guide
