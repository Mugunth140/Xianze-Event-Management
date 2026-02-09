import { ArrayMinSize, IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCertificateComplaintDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one event' })
  @IsString({ each: true })
  events: string[];
}
