import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
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

export class CreateRegistrationDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s.'-]+$/, {
    message: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsNotEmpty({ message: 'Course is required' })
  @IsString()
  @MaxLength(100, { message: 'Course must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  course: string;

  @IsNotEmpty({ message: 'Branch is required' })
  @IsString()
  @MaxLength(100, { message: 'Branch must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  branch: string;

  @IsNotEmpty({ message: 'College is required' })
  @IsString()
  @MinLength(3, { message: 'College name must be at least 3 characters' })
  @MaxLength(255, { message: 'College name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  college: string;

  @IsNotEmpty({ message: 'Contact number is required' })
  @Matches(/^\d{10,15}$/, {
    message: 'Contact must be 10-15 digits',
  })
  @Transform(({ value }) => value?.replace(/[^\d]/g, ''))
  contact: string;

  @IsNotEmpty({ message: 'Event is required' })
  @IsString()
  @IsIn(ALLOWED_EVENTS, { message: 'Please select a valid event' })
  event: string;

  @IsNotEmpty({ message: 'Payment mode is required' })
  @IsIn(['online', 'cash'], { message: 'Payment mode must be online or cash' })
  paymentMode: 'online' | 'cash';

  @ValidateIf((o) => o.paymentMode === 'online')
  @IsString()
  @IsNotEmpty({ message: 'Transaction ID is required' })
  @Length(5, 50, { message: 'Transaction ID must be 5-50 characters' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Transaction ID can only contain letters and numbers',
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  transactionId?: string;
}
