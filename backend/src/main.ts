import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Global prefix for all API routes
  // Reason: keeps API routes namespaced, easier to proxy from Next.js
  app.setGlobalPrefix('api');

  // CORS — will be configured fully in Task 2.1.10
  // For now, allow the frontend dev server
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Required for httpOnly cookie auth (Task 2.1)
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}/api`);
}

bootstrap();
