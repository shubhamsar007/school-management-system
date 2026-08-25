import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class IdentityService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        person: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }

    const valid = await argon2.verify(user.passwordHash, password);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return null;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return user;
  }

  async login(user: Awaited<ReturnType<PrismaService['user']['findFirst']>> & { userRoles: any[] }) {
    const campuses = [...new Set(
      user!.userRoles.filter((ur) => ur.campusId).map((ur) => ur.campusId as string),
    )];
    const roles = [...new Set(user!.userRoles.map((ur) => ur.role.code as string))];

    const payload: JwtPayload = {
      sub: user!.id,
      org: user!.organizationId,
      campuses,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user!.id, jti: uuidv4() },
      {
        secret: this.configService.get<string>('app.jwt.refreshSecret') as string,
        expiresIn: this.configService.get<number>('app.jwt.refreshTtl') as number,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user!.id,
        email: user!.email,
        name: `${(user as any).person.firstName} ${(user as any).person.lastName}`,
        organizationId: user!.organizationId,
        roles,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshSecret') as string,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, deletedAt: null },
        include: {
          person: true,
          userRoles: { include: { role: true } },
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.login(user as any);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: true,
        userRoles: { include: { role: true, campus: true } },
      },
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      name: `${user.person.firstName} ${user.person.lastName}`,
      organizationId: user.organizationId,
      roles: user.userRoles.map((ur) => ({
        code: ur.role.code,
        name: ur.role.name,
        campusId: ur.campusId ?? null,
        campusName: ur.campus?.name ?? null,
      })),
    };
  }
}
