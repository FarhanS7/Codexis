import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { CacheService } from './cache.service';
import { AuthModule } from '../auth/auth.module';
import { DiffParserService } from './diff-parser.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ai-code-reviewer/1.0',
      },
      timeout: 10000, // 10 seconds — GitHub API should respond well within this
    }),
    ConfigModule,
    AuthModule, // Provides JwtAuthGuard and AuthService (for token decryption)
  ],
  controllers: [GithubController],
  providers: [GithubService, CacheService, DiffParserService],
  exports: [GithubService, DiffParserService, CacheService], // Exported for use in ReviewModule and WebhookModule
})
export class GithubModule {}

