import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackPageViewDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  visitorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  path: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  browser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  os?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  screenResolution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class UpdateDurationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  visitorId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  path: string;

  @IsNotEmpty()
  duration: number;
}
