import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// Declare request ID property on Express Request object
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Module-level storage — shared across all requests, each has isolated context
export const requestIdStorage = new AsyncLocalStorage<string>();

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const id = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id); // echo back to client for debugging

    // Run the rest of the request in an async context with this ID
    requestIdStorage.run(id, () => next());
  }
}

// Helper: get requestId from anywhere in the call stack without passing it
export function getRequestId(): string | undefined {
  return requestIdStorage.getStore();
}
