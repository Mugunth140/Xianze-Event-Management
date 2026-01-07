# API Guidelines

This document provides guidelines for designing and implementing APIs in the XIANZE backend.

---

## 📐 REST API Conventions

### URL Structure

```
GET    /api/events              # List all events
GET    /api/events/:id          # Get single event
POST   /api/events              # Create event
PATCH  /api/events/:id          # Update event (partial)
PUT    /api/events/:id          # Replace event (full)
DELETE /api/events/:id          # Delete event
```

### Nested Resources

```
GET    /api/events/:eventId/attendees      # List attendees for event
POST   /api/events/:eventId/attendees      # Add attendee to event
DELETE /api/events/:eventId/attendees/:id  # Remove attendee from event
```

---

## 📦 Request/Response Format

### Standard Success Response

```json
{
  "data": {
    /* resource data */
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### List Response with Pagination

```json
{
  "data": [
    /* array of resources */
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## ✅ Validation

Always use DTOs with class-validator decorators:

```typescript
import { IsString, IsEmail, IsOptional, Length, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsEmail()
  contactEmail: string;
}
```

---

## 📄 Documentation

Document all endpoints using OpenAPI/Swagger decorators:

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('events')
@Controller('events')
export class EventsController {
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Post()
  create(@Body() dto: CreateEventDto) {
    // ...
  }
}
```

---

## 🔒 Authorization

Protect routes with guards:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard) // Protect all routes
export class EventsController {
  // ...
}
```
