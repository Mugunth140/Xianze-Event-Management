# Code Hunt Module

## ⚠️ Implementation Status

**Status**: Placeholder only - no business logic implemented

## Event Type

**Team / Activity-based** - Word guessing game (similar to charades)

## Description

Code Hunt is a team-based activity where participants guess words through actions without speaking the actual word. This is a tech-themed take on classic word guessing games.

## Intended Architecture

```
┌─────────────────────────────────────────────┐
│             Code Hunt Flow                  │
├─────────────────────────────────────────────┤
│  Game Management                            │
│  ├── Word bank (tech terms)                 │
│  ├── Team management                        │
│  ├── Round tracking                         │
│  └── Score calculation                      │
└─────────────────────────────────────────────┘
```

## Expected Features (DO NOT IMPLEMENT YET)

- [ ] Tech word bank
- [ ] Team registration
- [ ] Round management
- [ ] Timer functionality
- [ ] Score tracking

## Files to Create

When implementing this module, create:

```
code-hunt/
├── entities/
│   ├── word.entity.ts
│   └── team.entity.ts
├── dto/
│   └── create-team.dto.ts
├── code-hunt.controller.ts
├── code-hunt.service.ts
└── code-hunt.module.ts
```

## Notes

- No real-time video/audio required
- Backend tracks scoring, frontend handles timer display
- Physical event coordination required

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Event taxonomy
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Module implementation guide
