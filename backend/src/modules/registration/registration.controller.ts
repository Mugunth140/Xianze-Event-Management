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
  async create(@Body() dto: CreateRegistrationDto): Promise<{ success: boolean; message: string }> {
    // Check for duplicate registration by email
    const exists = await this.registrationService.existsByEmail(dto.email);

    if (exists) {
      throw new ConflictException({
        success: false,
        message: 'This email is already registered',
      });
    }
    await this.registrationService.create(dto);

    return {
      success: true,
      message: 'Registration successful',
    };
  }

  /**
   * GET /api/register
   *
   * Get all registrations (for admin dashboard).
   */
  @Get()
  async findAll(): Promise<{ success: boolean; data: any }> {
    const registrations = await this.registrationService.findAll();
    return {
      success: true,
      data: registrations,
    };
  }
}
