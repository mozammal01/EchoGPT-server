import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6-token', description: 'Email verification token sent to user' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
