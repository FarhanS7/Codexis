import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GithubService } from '../github/github.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: any;
  let config: any;
  let github: any;

  beforeEach(async () => {
    const prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
    };

    const configMock = {
      get: jest.fn().mockReturnValue('mock-api-key'),
    };

    const githubMock = {
      getRateLimitStatus: jest.fn().mockReturnValue({ remaining: 4900, resetAt: '2026-06-20T00:00:00.000Z' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
        { provide: GithubService, useValue: githubMock },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get(PrismaService);
    config = module.get(ConfigService);
    github = module.get(GithubService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    // Mock global fetch to return resolved promise
    const globalFetchMock = jest.fn().mockResolvedValue({
      status: 200,
    });
    global.fetch = globalFetchMock as any;

    const result = await controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('connected');
    expect(result.services.github.status).toBe('reachable');
    expect(result.services.llm.status).toBe('reachable');
  });

  it('should return degraded status when db fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('DB Connection Refused'));
    
    const globalFetchMock = jest.fn().mockResolvedValue({
      status: 200,
    });
    global.fetch = globalFetchMock as any;

    const result = await controller.getHealth();
    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('error');
    expect(result.services.database.message).toBe('DB Connection Refused');
    expect(result.services.github.status).toBe('reachable');
    expect(result.services.llm.status).toBe('reachable');
  });
});
