import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  participant1: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  participant2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  participant3?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  participant4?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

export class UpdateApiStateDto {
  @IsOptional()
  customersEndpointEnabled?: boolean;

  @IsOptional()
  ordersEndpointEnabled?: boolean;

  @IsOptional()
  productsEndpointEnabled?: boolean;
}
