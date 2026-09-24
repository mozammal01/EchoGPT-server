import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HashUtil } from '../../common/utils/hash.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await HashUtil.hash(dto.password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerificationToken,
        subscription: {
          create: {
            plan: PlanType.FREE,
            status: SubscriptionStatus.ACTIVE,
            monthlyLimit: 50,
            usedRequests: 0,
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      message: 'Registration successful',
      user,
      verificationToken: emailVerificationToken,
      tokens,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await HashUtil.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'echogpt_super_secret_jwt_refresh_key_2026';
      const payload = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });

      const sessions = await this.prisma.session.findMany({
        where: {
          userId: payload.sub,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      let validSession = null;
      for (const session of sessions) {
        const isValid = await HashUtil.compare(dto.refreshToken, session.refreshTokenHash);
        if (isValid) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new UnauthorizedException('Refresh token is invalid or has been revoked');
      }

      // Revoke old session (Token rotation)
      await this.prisma.session.update({
        where: { id: validSession.id },
        data: { isRevoked: true },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.saveRefreshToken(user.id, tokens.refreshToken, validSession.userAgent, validSession.ipAddress);

      return {
        message: 'Tokens refreshed successfully',
        tokens,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const sessions = await this.prisma.session.findMany({
        where: { userId, isRevoked: false },
      });

      for (const session of sessions) {
        const matches = await HashUtil.compare(refreshToken, session.refreshTokenHash);
        if (matches) {
          await this.prisma.session.update({
            where: { id: session.id },
            data: { isRevoked: true },
          });
        }
      }
    } else {
      // Revoke all sessions for user
      await this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return { message: 'Successfully logged out' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid email verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'echogpt_super_secret_jwt_access_key_2026',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'echogpt_super_secret_jwt_refresh_key_2026',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const refreshTokenHash = await HashUtil.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }
}
