import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Call the parent AuthGuard's canActivate which runs JwtStrategy
    return super.canActivate(context);
  }

  // Override Passport's default error handling
  // Without this override, Passport throws a non-NestJS error that bypasses
  // NestJS's exception filters and returns a plain 401 without our error format
  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser | false,
    info: Error | null,
  ): TUser {
    if (err || !user) {
      throw (
        err ??
        new UnauthorizedException(
          info?.message ?? 'Authentication required — please log in',
        )
      );
    }
    return user;
  }
}
