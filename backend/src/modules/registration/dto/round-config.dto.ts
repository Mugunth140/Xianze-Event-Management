import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateEventRoundConfigDto {
  @IsString()
  eventSlug: string;

  @IsString()
  eventName: string;

  @IsInt()
  @Min(0)
  @Max(10)
  totalRounds: number;
}

export class UpdateEventRoundConfigDto {
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  totalRounds?: number;
}

export class AdvanceRoundDto {
  @IsString()
  eventSlug: string;
}

export class SetCurrentRoundDto {
  @IsString()
  eventSlug: string;

  @IsInt()
  @Min(1)
  @Max(10)
  roundNumber: number;
}

export class StartEventDto {
  @IsString()
  eventSlug: string;
}

export class ResetRoundDto {
  @IsString()
  eventSlug: string;

  @IsInt()
  @Min(1)
  @Max(10)
  roundNumber: number;
}
