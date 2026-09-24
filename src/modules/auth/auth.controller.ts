import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Public } from '../../common/decorators/public.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User created successfully with FREE subscription' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful, returns JWT access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.login(dto, userAgent, ipAddress);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using valid refresh token' })
  @ApiResponse({ status: 200, description: 'Returns new access token and rotated refresh token' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out user and revoke session token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@GetUser('id') userId: string, @Body() dto?: RefreshTokenDto) {
    return this.authService.logout(userId, dto?.refreshToken);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email address using token' })
  @ApiResponse({ status: 200, description: 'Email successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile payload' })
  @ApiResponse({ status: 200, description: 'Returns current authenticated user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@GetUser() user: any) {
    return { user };
  }
}
