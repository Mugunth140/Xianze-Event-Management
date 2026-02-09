import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole, UserTask } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  // Single event for coordinator (backward compatible)
  @ValidateIf((o) => o.role === UserRole.COORDINATOR)
  @IsString()
  @IsNotEmpty()
  assignedEvent?: string;

  // Multiple events for member
  @ValidateIf((o) => o.role === UserRole.MEMBER)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1)
  @IsString({ each: true })
  assignedEvents?: string[];

  // Optional tasks assigned to user
  @IsArray()
  @IsEnum(UserTask, { each: true })
  @IsOptional()
  tasks?: UserTask[];
}
