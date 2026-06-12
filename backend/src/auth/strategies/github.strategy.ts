import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

// The GitHub profile shape returned by passport-github2
export interface GitHubProfile {
  id: string;           // GitHub user ID (immutable, use as unique key)
  username: string;     // GitHub login (can change — don't use as unique key)
  displayName: string;
  photos: Array<{ value: string }>; // Avatar URLs
  emails: Array<{ value: string; primary?: boolean }>;
}

// What we pass to AuthService — only the fields we need
export interface GitHubOAuthUser {
  githubId: string;
  login: string;
  avatarUrl: string;
  accessToken: string;  // Raw GitHub token — will be encrypted in AuthService
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'repo'],
      // passReqToCallback: false (default) — we don't need req in validate()
    });
  }

  // Called after GitHub redirects back with a valid code
  // accessToken: the GitHub OAuth token (long-lived)
  // refreshToken: GitHub doesn't provide refresh tokens for OAuth Apps (undefined)
  // profile: the GitHub user profile fetched by passport-github2
  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: GitHubProfile,
  ): GitHubOAuthUser {
    // Return only what we need — AuthService handles DB operations
    return {
      githubId: profile.id,
      login: profile.username,
      avatarUrl: profile.photos?.[0]?.value ?? '',
      accessToken, // Raw token — will be encrypted in AuthService before storage
    };
  }
}
