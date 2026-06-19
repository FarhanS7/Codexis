import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  // Use nestjs-pino logger globally
  app.useLogger(app.get(Logger));

  app.useGlobalFilters(new AllExceptionsFilter());

  // cookie-parser must be registered BEFORE JwtStrategy tries to read cookies
  // Without this, req.cookies is undefined
  app.use(cookieParser());

  // Apply raw body middleware ONLY to the webhook route
  // This MUST come BEFORE the global json() middleware
  app.use('/api/webhooks/github', express.raw({ type: 'application/json' }));

  // Global JSON and urlencoded middlewares for all other routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global prefix for all API routes
  // Reason: keeps API routes namespaced, easier to proxy from Next.js
  app.setGlobalPrefix('api');

  // CORS configuration
  // credentials: true is REQUIRED for httpOnly cookie auth
  // origin: must be exact URL, not '*' (CORS spec blocks '*' with credentials)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // exposedHeaders: allow frontend to read custom response headers if needed
    exposedHeaders: ['X-RateLimit-Remaining'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`\n🚀 Backend running on http://localhost:${port}/api`);
  logger.log(`   Health: http://localhost:${port}/api/health\n`);
}

bootstrap();
