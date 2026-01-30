import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO for scanning a participant at an event hall
 */
export class ScanEventParticipationDto {
  @IsString()
  @IsNotEmpty()
  qrHash: string;

  @IsString()
  @IsNotEmpty()
  eventSlug: string;
}

/**
 * DTO for scanning a participant for a specific round
 */
export class ScanRoundParticipationDto {
  @IsString()
  @IsNotEmpty()
  qrHash: string;

  @IsString()
  @IsNotEmpty()
  eventSlug: string;

  @IsInt()
  @Min(1)
  @Max(10) // Reasonable max rounds
  roundNumber: number;
}

/**
 * DTO for querying participation history
 */
export class GetParticipationDto {
  @IsOptional()
  @IsString()
  eventSlug?: string;

  @IsOptional()
  @IsInt()
  registrationId?: number;
}
