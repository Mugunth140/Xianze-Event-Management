import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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
  @IsString()
  @IsOptional()
  assignedEvent?: string;

  // Multiple events for member
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedEvents?: string[];

  // Optional tasks assigned to user
  @IsArray()
  @IsEnum(UserTask, { each: true })
  @IsOptional()
  tasks?: UserTask[];
}
