import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PlanType } from '@prisma/client';

export class UpgradeSubscriptionDto {
  @ApiProperty({ enum: PlanType, example: PlanType.PREMIUM, description: 'Target plan type (FREE or PREMIUM)' })
  @IsEnum(PlanType)
  @IsNotEmpty()
  plan: PlanType;
}
