import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../strategies/jwt.strategy';

// Custom parameter decorator that extracts req.user from the request
// Usage: @CurrentUser() user: RequestUser
//
// Why a custom decorator instead of @Req() req: Request?
// - @Req() exposes the entire Express Request object — more than you need
// - @CurrentUser() is self-documenting — it's clear what you're getting
// - Decouples the controller from Express's Request type — easier to test
// - Works with NestJS's Swagger (OpenAPI) documentation generation
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as RequestUser;
  },
);
