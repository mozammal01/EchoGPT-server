import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendPromptDto } from './dto/send-prompt.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { Request } from 'express';
import { Observable } from 'rxjs';

@ApiTags('Chat API')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('completions')
  @UseGuards(SubscriptionGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send prompt to AI Provider and get response' })
  @ApiResponse({ status: 200, description: 'AI completion response returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Subscription limit reached' })
  async sendPrompt(@GetUser('id') userId: string, @Body() dto: SendPromptDto, @Req() req: any) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.chatService.sendPrompt(userId, dto, ipAddress);
  }

  @Post('stream')
  @UseGuards(SubscriptionGuard)
  @Sse()
  @ApiOperation({ summary: 'Stream AI response chunks via Server-Sent Events (SSE)' })
  @ApiResponse({ status: 200, description: 'SSE Event Stream' })
  streamPrompt(@GetUser('id') userId: string, @Body() dto: SendPromptDto): Observable<any> {
    return this.chatService.streamPrompt(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversation history list' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@GetUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get complete message history for a specific conversation' })
  @ApiResponse({ status: 200, description: 'Conversation details with messages' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.getConversation(userId, id);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a conversation and its messages' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.chatService.deleteConversation(userId, id);
  }
}
