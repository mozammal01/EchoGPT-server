import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ example: 'NestJS best practices 2026', description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ example: 5, description: 'Number of results (1-20)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
