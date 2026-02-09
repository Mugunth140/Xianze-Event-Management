# API Guidelines

This document provides guidelines for designing and implementing APIs in the XIANZE backend.

---

## 📐 REST API Conventions

### URL Structure

```text
GET    /api/events              # List all events
GET    /api/events/:id          # Get single event
POST   /api/events              # Create event
PATCH  /api/events/:id          # Update event (partial)
PUT    /api/events/:id          # Replace event (full)
DELETE /api/events/:id          # Delete event
```

### Nested Resources

```text
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
    "timestamp": "2026-01-01T00:00:00.000Z"
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
  "timestamp": "2026-01-01T00:00:00.000Z"
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

---

## 🧾 Registration API (Payment Modes)

### POST `/api/register`

Supports both **online** and **cash** registrations in the same table. Use the `paymentMode` field to control required inputs.

#### Required fields (both modes)

- `name`, `email`, `course`, `branch`, `college`, `contact`, `event`
- `paymentMode`: `online` or `cash`

#### Online payment (`paymentMode=online`)

- `transactionId` is **required**
- `screenshot` (multipart file) is **required**

#### Cash payment (`paymentMode=cash`)

- `transactionId` **not required**
- `screenshot` **not required**

#### Example (online)

```http
POST /api/register
Content-Type: multipart/form-data

name=Jane Doe
email=jane@example.com
course=B.Tech
branch=Computer Science
college=XYZ College
contact=9876543210
event=Buildathon
paymentMode=online
transactionId=123456789012
screenshot=@payment.png
```

#### Example (cash)

```http
POST /api/register
Content-Type: multipart/form-data

name=John Doe
email=john@example.com
course=B.Tech
branch=Computer Science
college=XYZ College
contact=9876543210
event=Buildathon
paymentMode=cash
```

#### Response

```json
{
  "success": true,
  "message": "Registration successful! Please pay at the event venue to receive your pass.",
  "status": "cash_payment_pending"
}
```
