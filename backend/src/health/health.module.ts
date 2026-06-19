import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [PrismaModule, ConfigModule, GithubModule],
  controllers: [HealthController]
})
export class HealthModule {}
