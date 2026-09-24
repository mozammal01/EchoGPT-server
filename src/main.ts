import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global Prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global Pipe for Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('EchoGPT Server API')
    .setDescription(
      `### High Performance AI SaaS Backend API
      
Key Features:
- **Authentication**: JWT Auth, Refresh Tokens, Email Verification, Role-Based Access Control
- **Subscription Engine**: Free & Premium Quotas, Realtime Limit Enforcement
- **AI Provider Gateway**: Multi-model routing (OpenAI, Claude, Google Gemini) with Key Encryption
- **Chat Completions**: Conversation management & Server-Sent Event (SSE) Streaming
- **Web Search Engine**: AI-assisted web search with MD5 Hash Caching & Suggestions
- **Admin Panel APIs**: Real-time Analytics, System Health, User Management, Request Logs`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Endpoints for registration, login, token refresh, and logout')
    .addTag('User Management', 'User profile management, account settings, and deletion')
    .addTag('Subscription Management', 'Plan details, user status, quota remaining, upgrade/downgrade')
    .addTag('AI Provider Management', 'Multi-AI provider CRUD, encryption, and health checks')
    .addTag('Chat API', 'AI prompt completions, conversation history, and streaming')
    .addTag('Web Search API', 'AI-assisted web search queries, caching, and autocomplete suggestions')
    .addTag('Admin Panel APIs', 'Platform statistics, user control, usage analytics, system health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'EchoGPT API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 EchoGPT Server is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger API Documentation is available on: http://localhost:${port}/api/docs`);
}

bootstrap();
