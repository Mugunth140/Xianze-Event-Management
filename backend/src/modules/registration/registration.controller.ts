import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationService } from './registration.service';

@Controller('register')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  /**
   * POST /api/register
   *
   * Create a new event registration.
   * Returns 201 on success, 409 if email already registered.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRegistrationDto) {
    // Check for duplicate registration by email
    const exists = await this.registrationService.existsByEmail(dto.email);

    if (exists) {
      throw new ConflictException({
        success: false,
        message: 'This email is already registered',
      });
    }

    const registration = await this.registrationService.create(dto);

    return {
      success: true,
      message: 'Registration successful',
      data: registration,
    };
  }

  /**
   * GET /api/register
   *
   * Get all registrations (for admin dashboard).
   */
  @Get()
  async findAll() {
    const registrations = await this.registrationService.findAll();
    return {
      success: true,
      data: registrations,
    };
  }
}
