import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { IdentityService } from './identity.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class IdentityController {
  constructor(
    private identityService: IdentityService,
    private configService: ConfigService,
  ) {}

  private get cookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.get('app.nodeEnv') === 'production',
      sameSite: 'lax' as const,
      maxAge: (this.configService.get<number>('app.jwt.refreshTtl') ?? 2592000) * 1000,
      path: '/api/v1/auth',
    };
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request & { user: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.identityService.login(req.user);
    res.cookie('refresh_token', result.refreshToken, this.cookieOptions);
    return { accessToken: result.accessToken, user: result.user };
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)?.refresh_token;
    if (!token) throw new UnauthorizedException('No refresh token provided');

    const result = await this.identityService.refresh(token);
    res.cookie('refresh_token', result.refreshToken, this.cookieOptions);
    return { accessToken: result.accessToken, user: result.user };
  }

  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request & { user: any }) {
    return this.identityService.getProfile(req.user.userId);
  }
}
