import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule.registerAsync reads JWT_SECRET from ConfigService at runtime
    // Using registerAsync (not register) is required to inject ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): import('@nestjs/jwt').JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ?? '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule, // Required for ConfigService injection in strategies
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CryptoService,
    GithubStrategy,
    JwtStrategy,
    JwtAuthGuard,
  ],
  // Export AuthService so GithubModule can call getDecryptedAccessToken()
  // Export CryptoService so it can be reused elsewhere
  // Export JwtAuthGuard so other modules can import and use it without redeclaring
  exports: [AuthService, CryptoService, JwtAuthGuard],
})
export class AuthModule {}
