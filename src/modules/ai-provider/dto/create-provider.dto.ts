import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateAIProviderDto {
  @ApiProperty({ example: 'openai', description: 'Unique identifier name (e.g. openai, claude, gemini)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'OpenAI GPT Models', description: 'User friendly display name' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ example: 'sk-proj-12345...', description: 'API Key for the provider (will be encrypted)' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ example: 'https://api.openai.com/v1', description: 'Base URL for API requests', required: false })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({ example: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'], description: 'Supported models list' })
  @IsArray()
  @IsString({ each: true })
  models: string[];

  @ApiProperty({ example: true, description: 'Whether provider is enabled', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ example: false, description: 'Whether provider is set as system default', required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
