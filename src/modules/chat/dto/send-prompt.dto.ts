import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendPromptDto {
  @ApiProperty({ example: 'Explain Quantum Computing in simple terms.', description: 'User message / prompt content' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ example: 'conv-uuid-1234', description: 'Existing conversation ID or leave empty to start new conversation', required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ example: 'provider-uuid-openai', description: 'Selected AI Provider ID (Optional)', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ example: 'gpt-4o', description: 'Selected Model Name (e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-pro)', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 'You are an expert physics tutor.', description: 'Optional system prompt / instructions', required: false })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}
