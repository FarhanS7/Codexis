import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookSecurityService } from './webhook-security.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [PrismaModule, GithubModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookSecurityService],
})
export class WebhookModule {}
