import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a zeroed response when no reviews are found', async () => {
    // 1. Mock reviews per day query returning empty list
    prisma.$queryRaw
      .mockResolvedValueOnce([]) // getReviewsPerDay
      .mockResolvedValueOnce([{ total: 0, accepted: 0 }]) // getAcceptanceRate
      .mockResolvedValueOnce([{ avg: 0 }]) // getAvgSuggestionsPerReview
      .mockResolvedValueOnce([{ avgCost: 0, avgLatency: 0, totalReviews: 0 }]) // getAvgCostAndLatency
      .mockResolvedValueOnce([]); // getModelBreakdown

    const result = await service.getSummary('user-no-data-id');

    expect(result.totalReviews).toBe(0);
    expect(result.acceptanceRate).toBe(0);
    expect(result.avgCostPerReviewUsd).toBe(0);
    expect(result.avgLatencyMs).toBe(0);
    expect(result.avgSuggestionsPerReview).toBe(0);
    expect(result.reviewsPerDay).toHaveLength(7);
    expect(result.reviewsPerDay.every((r) => r.count === 0)).toBe(true);
  });

  it('should map query results and fill date gaps correctly', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const rawReviews = [
      { date: new Date(), count: 3 },
    ];

    prisma.$queryRaw
      .mockResolvedValueOnce(rawReviews) // getReviewsPerDay
      .mockResolvedValueOnce([{ total: 10, accepted: 6 }]) // getAcceptanceRate
      .mockResolvedValueOnce([{ avg: 4.5 }]) // getAvgSuggestionsPerReview
      .mockResolvedValueOnce([{ avgCost: 0.005, avgLatency: 3500, totalReviews: 5 }]) // getAvgCostAndLatency
      .mockResolvedValueOnce([
        { model: 'gpt-4o', count: 4, totalCostUsd: 0.02 },
        { model: 'claude-3-opus', count: 1, totalCostUsd: 0.005 },
      ]); // getModelBreakdown

    const result = await service.getSummary('user-active-id');

    expect(result.totalReviews).toBe(5);
    expect(result.acceptanceRate).toBe(0.6);
    expect(result.avgCostPerReviewUsd).toBe(0.005);
    expect(result.avgLatencyMs).toBe(3500);
    expect(result.avgSuggestionsPerReview).toBe(4.5);
    
    // Find today's date in reviews per day and verify the count
    const todayData = result.reviewsPerDay.find((r) => r.date === todayStr);
    expect(todayData).toBeDefined();
    expect(todayData?.count).toBe(3);

    // Verify model breakdowns
    expect(result.modelBreakdown).toHaveLength(2);
    expect(result.modelBreakdown[0]).toEqual({
      model: 'gpt-4o',
      count: 4,
      totalCostUsd: 0.02,
    });
  });
});
