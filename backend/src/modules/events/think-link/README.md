# Think & Link Module

## ⚠️ Implementation Status

**Status**: Placeholder only - no business logic implemented

## Event Type

**Visual / Connection-based** - Slide-based connection guessing game

## Description

Think & Link is a visual game where participants find connections between items shown in slides. The game is primarily frontend-driven with the backend providing metadata and slide configuration.

## Intended Architecture

```
┌─────────────────────────────────────────────┐
│           Think & Link Flow                 │
├─────────────────────────────────────────────┤
│  Backend (Minimal)                          │
│  ├── Slide configuration metadata           │
│  ├── Answer verification                    │
│  └── Score tracking                         │
├─────────────────────────────────────────────┤
│  Frontend (Primary)                         │
│  ├── Slideshow display                      │
│  ├── Timer management                       │
│  └── Answer input UI                        │
└─────────────────────────────────────────────┘
```

## Redis Usage (Optional)

This module may use Redis for:

- **Session State**: Track participant progress
- **Score Cache**: Real-time leaderboard updates

See [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) for key naming conventions.

## Expected Features (DO NOT IMPLEMENT YET)

- [ ] Slide configuration management
- [ ] Answer verification
- [ ] Timer tracking
- [ ] Score calculation

## Files to Create

When implementing this module, create:

```
think-link/
├── entities/
│   └── slide-config.entity.ts
├── dto/
│   └── submit-answer.dto.ts
├── think-link.controller.ts
├── think-link.service.ts
└── think-link.module.ts
```

## Notes

- Most logic is frontend-side (slideshow rendering)
- Backend primarily for configuration and verification
- Consider using static JSON for slide data

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Event taxonomy
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Module implementation guide
