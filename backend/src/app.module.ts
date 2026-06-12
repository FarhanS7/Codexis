import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GithubModule } from './github/github.module';
import { ReviewModule } from './review/review.module';
import { WebhookModule } from './webhook/webhook.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AuthModule, GithubModule, ReviewModule, WebhookModule, MetricsModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
