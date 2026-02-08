import { IsEmail, IsNotEmpty } from 'class-validator';

export class LookupCertificatesDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;
}
