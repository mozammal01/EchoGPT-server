import { Module } from '@nestjs/common';
import { WebSearchController } from './web-search.controller';
import { WebSearchService } from './web-search.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [WebSearchController],
  providers: [WebSearchService],
  exports: [WebSearchService],
})
export class WebSearchModule {}
