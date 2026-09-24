import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password123!', description: 'Current user password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecretPass123!', description: 'New password (min 6 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
