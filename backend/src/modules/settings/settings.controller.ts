import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { SettingsService } from './settings.service';

class UpdateRegistrationStatusDto {
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isOpen: boolean;
}

class UpdateRegistrationMessageDto {
  @IsString()
  message: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get registration status (public endpoint)
   * Used by registration page to check if registrations are open
   */
  @Get('registration-status')
  async getRegistrationStatus() {
    return this.settingsService.getRegistrationStatus();
  }

  /**
   * Get all settings (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllSettings() {
    return this.settingsService.getAll();
  }

  /**
   * Toggle registration status (admin only)
   */
  @Patch('registration-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleRegistration(@Body() dto: UpdateRegistrationStatusDto) {
    return this.settingsService.toggleRegistration(dto.isOpen);
  }

  /**
   * Update registration closed message (admin only)
   */
  @Patch('registration-message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRegistrationMessage(@Body() dto: UpdateRegistrationMessageDto) {
    return this.settingsService.setRegistrationClosedMessage(dto.message);
  }
}
