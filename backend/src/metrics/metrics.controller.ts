import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { MetricsSummary } from 'shared/metrics';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: User): Promise<MetricsSummary> {
    return this.metricsService.getSummary(user.id);
  }
}
