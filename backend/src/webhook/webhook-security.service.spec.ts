import { Test, TestingModule } from '@nestjs/testing';
import { WebhookSecurityService } from './webhook-security.service';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

describe('WebhookSecurityService', () => {
  let service: WebhookSecurityService;

  beforeEach(async () => {
    const configMock = {
      getOrThrow: jest.fn().mockReturnValue('test-secret-key-12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookSecurityService,
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<WebhookSecurityService>(WebhookSecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify signatures correctly', () => {
    const rawBody = Buffer.from(JSON.stringify({ action: 'opened', number: 42 }));
    const hmac = createHmac('sha256', 'test-secret-key-12345')
      .update(rawBody)
      .digest('hex');
    const header = `sha256=${hmac}`;

    expect(service.verify(rawBody, header)).toBe(true);
  });

  it('should reject signatures with incorrect values', () => {
    const rawBody = Buffer.from(JSON.stringify({ action: 'opened', number: 42 }));
    const header = 'sha256=invalid-signature-value-here';

    expect(service.verify(rawBody, header)).toBe(false);
  });

  it('should reject headers without sha256 prefix', () => {
    const rawBody = Buffer.from(JSON.stringify({ action: 'opened', number: 42 }));
    const header = 'invalid-header-without-prefix';

    expect(service.verify(rawBody, header)).toBe(false);
  });
});
