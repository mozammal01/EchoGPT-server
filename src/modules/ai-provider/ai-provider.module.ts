import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIProviderController } from './ai-provider.controller';
import { AIProviderService } from './ai-provider.service';

@Module({
  imports: [HttpModule],
  controllers: [AIProviderController],
  providers: [AIProviderService],
  exports: [AIProviderService],
})
export class AIProviderModule {}
