import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookSecurityService {
  private readonly secret: Buffer;

  constructor(private config: ConfigService) {
    const secret = this.config.getOrThrow<string>('GITHUB_WEBHOOK_SECRET');
    this.secret = Buffer.from(secret, 'utf8');
  }

  /**
   * Verifies the X-Hub-Signature-256 header from GitHub.
   * Uses timingSafeEqual to prevent timing attacks.
   *
   * CRITICAL: rawBody must be Buffer (not parsed JSON string)
   * CRITICAL: timingSafeEqual requires equal-length buffers
   */
  verify(rawBody: Buffer, signatureHeader: string): boolean {
    if (!signatureHeader?.startsWith('sha256=')) return false;

    const receivedHex = signatureHeader.slice('sha256='.length);

    const expectedHex = createHmac('sha256', this.secret)
      .update(rawBody)
      .digest('hex');

    // Ensure equal buffer lengths before timingSafeEqual
    // If lengths differ, timingSafeEqual throws
    if (receivedHex.length !== expectedHex.length) return false;

    return timingSafeEqual(
      Buffer.from(expectedHex, 'hex'),
      Buffer.from(receivedHex, 'hex'),
    );
  }
}
