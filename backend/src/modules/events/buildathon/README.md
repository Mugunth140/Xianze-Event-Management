# Buildathon Module

## ⚠️ Implementation Status

**Status**: Placeholder only - no business logic implemented

## Event Type

**Technical** - Hackathon-style development competition

## Description

Buildathon is a technical challenge where participants build projects using the XIANZE platform APIs. The backend exposes APIs that participants consume, meaning the same backend powers both the platform and the challenge.

## Intended Architecture

```
┌─────────────────────────────────────────────┐
│              XIANZE Platform                │
├─────────────────────────────────────────────┤
│  Buildathon Module                          │
│  ├── Entities (teams, submissions, etc.)    │
│  ├── Controllers (API endpoints)            │
│  └── Services (business logic)              │
└─────────────────────────────────────────────┘
          ↓ APIs
┌─────────────────────────────────────────────┐
│         Participant Projects                │
│         (consume platform APIs)             │
└─────────────────────────────────────────────┘
```

## Expected Features (DO NOT IMPLEMENT YET)

- [ ] Team registration
- [ ] Project submission
- [ ] Judging workflow
- [ ] Leaderboard

## Files to Create

When implementing this module, create:

```
buildathon/
├── entities/
│   └── buildathon.entity.ts
├── dto/
│   ├── create-team.dto.ts
│   └── submit-project.dto.ts
├── buildathon.controller.ts
├── buildathon.service.ts
└── buildathon.module.ts
```

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Event taxonomy
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Module implementation guide
