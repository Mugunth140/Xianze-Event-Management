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

export class StartEventDto {
  @IsString()
  eventSlug: string;
}
