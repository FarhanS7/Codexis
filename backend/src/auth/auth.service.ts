import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { GitHubOAuthUser } from './strategies/github.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
  ) {}

  // Called from AuthController.handleCallback()
  // Takes the raw GitHub profile from Passport, persists the user, returns JWT string
  async handleOAuthCallback(githubUser: GitHubOAuthUser): Promise<string> {
    this.logger.log(`OAuth callback for GitHub user: ${githubUser.login}`);

    // Encrypt before storage — never store raw GitHub tokens
    const encryptedToken = this.cryptoService.encrypt(githubUser.accessToken);

    // Upsert: creates user on first login, updates on subsequent logins
    // Updating accessToken on every login ensures we always have the latest token
    const user = await this.prisma.user.upsert({
      where: { githubId: githubUser.githubId },
      create: {
        githubId: githubUser.githubId,
        login: githubUser.login,
        avatarUrl: githubUser.avatarUrl,
        accessToken: encryptedToken,
      },
      update: {
        // Update login and avatar in case user changed them on GitHub
        login: githubUser.login,
        avatarUrl: githubUser.avatarUrl,
        // Always update the token — GitHub may have issued a new one
        accessToken: encryptedToken,
      },
    });

    // Sign JWT with user ID and login
    // 'sub' (subject) is the standard JWT claim for the entity the token refers to
    const jwt = await this.jwtService.signAsync({
      sub: user.id,
      login: user.login,
    });

    this.logger.log(`JWT issued for user: ${user.login} (${user.id})`);
    return jwt;
  }

  // Returns the decrypted access token for a user
  // Used by GithubService (Task 3.1) to make authenticated GitHub API calls
  async getDecryptedAccessToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { accessToken: true }, // Only fetch what we need
    });

    return this.cryptoService.decrypt(user.accessToken);
  }
}
