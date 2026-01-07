# Events Module

This directory contains all event-specific modules for the XIANZE Event Management System.

## ⚠️ Implementation Status

**Status**: Placeholder folders only - no business logic implemented

## Event Overview

| Event                                       | Type          | Backend Required | Notes                           |
| ------------------------------------------- | ------------- | ---------------- | ------------------------------- |
| [Buildathon](./buildathon/)                 | Technical     | ✅ Yes           | Challenge APIs                  |
| [Bug Smash](./bug-smash/)                   | Debugging     | ✅ Yes           | MCQ + Redis caching             |
| [Paper Presentation](./paper-presentation/) | Non-technical | ❌ Minimal       | Documentation only              |
| [Gaming](./gaming/)                         | Non-technical | ❌ No            | Event listing only              |
| [Ctrl + Quiz](./ctrl-quiz/)                 | Technical     | ✅ Yes           | Quiz + Redis caching            |
| [Code Hunt](./code-hunt/)                   | Activity      | ✅ Yes           | Word guessing game              |
| [Think & Link](./think-link/)               | Visual        | ⚡ Minimal       | Metadata only                   |
| [Fun Games](./fun-games/)                   | Special       | ❌ No            | No registration, public display |

## Adding a New Event Module

1. Create the module folder under `src/modules/events/`
2. Follow the NestJS module pattern from [CONTRIBUTING.md](/backend/CONTRIBUTING.md)
3. Register the module in `app.module.ts`
4. Update this README with the new event

## Special Cases

### Fun Games

- **No registration required**
- **No backend participation logic**
- Frontend display only
- See [EVENTS.md](/EVENTS.md) for details

### Paper Presentation & Gaming

- Minimal or no backend required
- Primarily documentation and event listing

## Related Documentation

- [EVENTS.md](/EVENTS.md) - Complete event taxonomy
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - How to add modules
- [ARCHITECTURE.md](/backend/ARCHITECTURE.md) - Backend patterns
