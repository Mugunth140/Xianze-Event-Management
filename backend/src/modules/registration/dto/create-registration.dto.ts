import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateRegistrationDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Course is required' })
  @IsString()
  course: string;

  @IsNotEmpty({ message: 'Branch is required' })
  @IsString()
  branch: string;

  @IsNotEmpty({ message: 'College is required' })
  @IsString()
  college: string;

  @IsNotEmpty({ message: 'Contact number is required' })
  @Matches(/^\d{10,}$/, {
    message: 'Contact must be at least 10 digits',
  })
  contact: string;

  @IsNotEmpty({ message: 'Event is required' })
  @IsString()
  event: string;
}
