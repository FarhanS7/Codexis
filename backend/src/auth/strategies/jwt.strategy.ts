import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// The shape of the decoded JWT payload
export interface JwtPayload {
  sub: string;         // userId (UUID)
  login: string;       // GitHub login (for display, not auth)
  iat: number;         // issued at (Unix timestamp)
  exp: number;         // expires at (Unix timestamp)
}

// What gets attached to req.user after JWT validation
export interface RequestUser {
  userId: string;
  login: string;
}

// Custom extractor: reads the JWT from the 'jwt' httpOnly cookie
// This runs before every protected request
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['jwt'] ?? null;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extract JWT from cookie, not Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      // Reject expired tokens (default: true — explicit for clarity)
      ignoreExpiration: false,
      // The secret used to verify the signature
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Called after signature verification succeeds
  // payload = decoded JWT body
  // Must return the object that will be req.user
  validate(payload: JwtPayload): RequestUser {
    if (!payload.sub) {
      // Should never happen if JWT was signed correctly, but guard against malformed tokens
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      login: payload.login,
    };
  }
}
