# Think & Link Buzzer System

Real-time buzzer feature for the Think & Link quiz event using WebSockets.

## Overview

The buzzer system allows coordinators to run interactive quiz rounds where teams of 2 participants compete to answer questions first. Server-side timestamps ensure fair determination of who pressed the buzzer first.

## Architecture

### Backend (NestJS WebSocket Gateway)
- **Location**: `backend/src/modules/events/think-link/buzzer/`
- **Gateway**: `buzzer.gateway.ts` - Handles all WebSocket events
- **Module**: `buzzer.module.ts` - NestJS module configuration

### Frontend

#### Participant Page
- **URL**: `/events/think-link/buzzer`
- **Location**: `frontend/app/events/think-link/buzzer/`
- **Purpose**: Teams scan QR code, enter their names, and press buzzer

#### Admin Control Panel
- **URL**: `/admin/think-link/buzzer`
- **Location**: `frontend/app/admin/think-link/buzzer/`
- **Purpose**: Coordinator controls the buzzer session

## How It Works

### Participant Flow
1. Participants scan QR code displayed by coordinator
2. Enter both team member names (Team of 2)
3. Wait for coordinator to start the session
4. When buzzer is enabled, press the red BUZZ button
5. First team to press (based on server timestamp) wins

### Coordinator Flow
1. Navigate to Think & Link → Buzzer Control
2. Show QR code for participants to scan
3. Wait for teams to join (see connected teams count)
4. Click "Start Session" to begin
5. Click "Start Buzzer" to enable buzzer for a question
6. When a team buzzes first, their names are displayed
7. Mark answer as Correct (move to next question) or Wrong (buzzer continues)

## WebSocket Events

### Client → Server
- `coordinator:join` - Register as coordinator
- `team:join` - Team registers with names
- `coordinator:start-session` - Start buzzer session
- `coordinator:end-session` - End buzzer session
- `coordinator:enable-buzzer` - Enable buzzer for new question
- `coordinator:disable-buzzer` - Disable buzzer
- `buzzer:press` - Team presses buzzer
- `coordinator:answer-correct` - Mark answer correct
- `coordinator:answer-wrong` - Mark answer wrong
- `coordinator:reset` - Reset current state
- `coordinator:get-teams` - Get list of connected teams

### Server → Client
- `state:update` - Full state update (for coordinators)
- `teams:update` - Team list update (for coordinators)
- `buzzer:state` - Buzzer state update (for participants)
- `buzzer:enabled` - Buzzer enabled notification
- `buzzer:disabled` - Buzzer disabled notification
- `buzzer:winner` - Winner announcement (for coordinators)
- `buzzer:locked` - Buzzer locked (for participants)
- `session:started` - Session started notification
- `session:ended` - Session ended notification
- `answer:correct` - Correct answer notification
- `answer:wrong` - Wrong answer notification
- `buzzer:reset` - Reset notification

## Server Time Accuracy

The buzzer uses server-side timestamps (`Date.now()`) to determine who pressed first. This eliminates any advantage from network latency or client-side time manipulation.

## QR Code

The admin panel includes a built-in QR code generator using `qrcode.react`. The QR code points to:
```
https://xianze.tech/events/think-link/buzzer
```
(or the appropriate domain based on the environment)

## Dependencies

### Backend
- `@nestjs/websockets` - NestJS WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter
- `socket.io` - WebSocket library

### Frontend
- `socket.io-client` - Socket.IO client
- `qrcode.react` - QR code generation (already in project)
