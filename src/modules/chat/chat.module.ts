import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AIProviderModule } from '../ai-provider/ai-provider.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [HttpModule, AIProviderModule, SubscriptionModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
