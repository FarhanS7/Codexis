import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GithubModule } from './github/github.module';
import { ReviewModule } from './review/review.module';
import { WebhookModule } from './webhook/webhook.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
        genReqId: (req: any) => req.id,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        level: process.env.LOG_LEVEL ?? 'info',
        serializers: {
          err: (err) => ({
            type: err.constructor.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
          }),
        },
      },
    }),
    AuthModule,
    GithubModule,
    ReviewModule,
    WebhookModule,
    MetricsModule,
    HealthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*');
  }
}
