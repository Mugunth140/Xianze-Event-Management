import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyContactDto {
  @IsString()
  @IsNotEmpty({ message: 'Reply message is required' })
  @MaxLength(2000, { message: 'Reply message cannot exceed 2000 characters' })
  message: string;
}
