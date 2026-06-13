import {
  Controller,
  Get,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@prisma/client';

const COOKIE_NAME = 'jwt';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Step 1: Redirect user to GitHub OAuth consent page
  // AuthGuard('github') calls GithubStrategy.validate() internally
  // Passport handles the redirect — this handler never actually executes the body
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async redirectToGithub() {
    // Intentionally empty — Passport intercepts and redirects
  }

  // Step 2: GitHub redirects back here with ?code=xxx
  // AuthGuard('github') exchanges the code for a token and calls GithubStrategy.validate()
  // The validated user profile is attached to req.user by Passport
  @Get('callback')
  @UseGuards(AuthGuard('github'))
  async handleCallback(
    @Res({ passthrough: true }) res: Response,
    // req.user is set by GithubStrategy.validate() — it's the raw GitHub profile
    // We use @CurrentUser() here but it reads req.user set by Passport (not JwtStrategy)
  ) {
    // authService.login() takes the Passport-validated GitHub profile,
    // upserts the user, and returns a signed JWT
    const jwt = await this.authService.handleOAuthCallback(res.req['user'] as any);

    // Set JWT as httpOnly cookie
    res.cookie(COOKIE_NAME, jwt, {
      httpOnly: true,                                        // JavaScript cannot read this
      secure: process.env.NODE_ENV === 'production',        // HTTPS only in production
      sameSite: 'lax',                                       // CSRF protection
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });

    // Redirect to frontend dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  }

  // Returns the current authenticated user
  // JwtAuthGuard validates the JWT cookie and attaches the user to req.user
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: User) {
    // Return user without the encrypted accessToken field
    const { accessToken: _, ...safeUser } = user;
    return safeUser;
  }

  // Clears the JWT cookie — the only way to delete an httpOnly cookie is server-side
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
