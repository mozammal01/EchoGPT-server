import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.ADMIN, description: 'New role for user (ADMIN or USER)' })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
