import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AIProviderModule } from './modules/ai-provider/ai-provider.module';
import { ChatModule } from './modules/chat/chat.module';
import { WebSearchModule } from './modules/web-search/web-search.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    SubscriptionModule,
    AIProviderModule,
    ChatModule,
    WebSearchModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
