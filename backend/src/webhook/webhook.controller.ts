import { Controller, Post, Req, Res, Headers, Logger, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WebhookService, GithubWebhookPayload } from './webhook.service';
import { WebhookSecurityService } from './webhook-security.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly security: WebhookSecurityService,
  ) {}

  @Post('github')
  async receiveGithubWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') eventType: string,
  ): Promise<void> {
    const rawBody = req.body;

    // Verify request body is parsed as raw body buffer
    if (!Buffer.isBuffer(rawBody)) {
      this.logger.error('Webhook request body is not a raw Buffer. Ensure raw body middleware is configured.');
      res.status(HttpStatus.BAD_REQUEST).json({ message: 'Request body must be raw' });
      return;
    }

    // Step 1: Verify HMAC signature
    if (!this.security.verify(rawBody, signature)) {
      this.logger.warn(`Rejected invalid webhook signature: ${signature}`);
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid webhook signature' });
      return;
    }

    // Step 2: Return 200 OK immediately (GitHub requires response < 10s)
    res.status(HttpStatus.OK).json({ received: true });

    // Step 3: Process asynchronously
    try {
      const payload: GithubWebhookPayload = JSON.parse(rawBody.toString('utf8'));
      this.webhookService.handleEvent(eventType, payload).catch((err) => {
        this.logger.error(`Async webhook processing failed for event: ${eventType}`, err.stack);
      });
    } catch (err: any) {
      this.logger.error(`Failed to parse raw body webhook payload: ${err.message}`);
    }
  }
}
