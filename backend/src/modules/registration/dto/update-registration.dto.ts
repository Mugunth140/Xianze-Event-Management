import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Allowed events for validation
const ALLOWED_EVENTS = [
  'Buildathon',
  'Bug Smash',
  'Paper Presentation',
  'Ctrl + Quiz',
  'Think & Link',
  'Gaming',
  'Code Hunt : Word Edition',
] as const;

export class UpdateRegistrationDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s.'-]+$/, {
    message: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Course must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Branch must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  branch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'College must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  college?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Contact must be a valid 10-digit Indian mobile number',
  })
  contact?: string;

  @IsOptional()
  @IsIn(ALLOWED_EVENTS, {
    message: `Event must be one of: ${ALLOWED_EVENTS.join(', ')}`,
  })
  @Transform(({ value }) => value?.trim())
  event?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Transaction ID must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  transactionId?: string;
}
