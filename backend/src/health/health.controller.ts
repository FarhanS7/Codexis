import { Controller, Get, HttpCode } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GithubService } from '../github/github.service';

export interface ServiceStatus {
  status: 'connected' | 'reachable' | 'error';
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    database: ServiceStatus;
    github: ServiceStatus;
    llm: ServiceStatus;
  };
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly githubService: GithubService,
  ) {}

  @Get()
  @HttpCode(200)
  async getHealth(): Promise<HealthStatus> {
    const [dbStatus, githubStatus, llmStatus] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkGitHub(),
      this.checkLLM(),
    ]);

    const services = {
      database: this.toServiceStatus(dbStatus),
      github: this.toServiceStatus(githubStatus),
      llm: this.toServiceStatus(llmStatus),
    };

    const allOk = Object.values(services).every((s) => s.status !== 'error');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', latencyMs: Date.now() - start };
  }

  private async checkGitHub(): Promise<ServiceStatus> {
    const start = Date.now();
    await fetch('https://api.github.com', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    const rateLimit = this.githubService.getRateLimitStatus();
    return { 
      status: 'reachable', 
      latencyMs: Date.now() - start,
      message: `Rate Limit Remaining: ${rateLimit.remaining}, Resets: ${rateLimit.resetAt}`,
    };
  }

  private async checkLLM(): Promise<ServiceStatus> {
    const start = Date.now();
    await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}` },
      signal: AbortSignal.timeout(5000),
    });
    return { status: 'reachable', latencyMs: Date.now() - start };
  }

  private toServiceStatus(result: PromiseSettledResult<ServiceStatus>): ServiceStatus {
    if (result.status === 'fulfilled') return result.value;
    return { status: 'error', message: result.reason?.message ?? 'Unknown error' };
  }
}
