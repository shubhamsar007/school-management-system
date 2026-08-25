import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class IamService {
  constructor(private prisma: PrismaService) {}

  // ─── Users ───────────────────────────────────────────────────

  async createUser(organizationId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { organizationId_email: { organizationId, email: dto.email } },
    });
    if (existing) throw new ConflictException(`Email '${dto.email}' already registered`);

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          firstName: dto.firstName,
          middleName: dto.middleName ?? null,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender ?? null,
          phone: dto.phone ?? null,
          email: dto.email,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId,
          personId: person.id,
          email: dto.email,
          username: dto.username ?? null,
          passwordHash,
        },
        include: {
          person: true,
          userRoles: { include: { role: true, campus: true } },
        },
      });

      return this.formatUser(user);
    });
  }

  async findUsers(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        person: true,
        userRoles: { include: { role: true, campus: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(this.formatUser);
  }

  async findUser(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      include: {
        person: true,
        userRoles: { include: { role: true, campus: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.formatUser(user);
  }

  async updateUser(organizationId: string, userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      include: { person: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { organizationId_email: { organizationId, email: dto.email } },
      });
      if (existing) throw new ConflictException(`Email '${dto.email}' already registered`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id: user.personId },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.middleName !== undefined ? { middleName: dto.middleName ?? null } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.dateOfBirth !== undefined ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null } : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender ?? null } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone ?? null } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
        },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: {
          person: true,
          userRoles: { include: { role: true, campus: true } },
        },
      });

      return this.formatUser(updated);
    });
  }

  async deleteUser(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  async changePassword(organizationId: string, userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async resetPassword(organizationId: string, userId: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async unlockUser(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  // ─── User Roles ───────────────────────────────────────────────

  async assignRole(organizationId: string, userId: string, dto: AssignRoleDto) {
    await this.findUser(organizationId, userId);

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, organizationId },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId: dto.roleId,
        campusId: dto.campusId ?? null,
      },
    });
    if (existing) throw new ConflictException('Role already assigned');

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId: dto.roleId,
        ...(dto.campusId !== undefined ? { campusId: dto.campusId } : {}),
      },
      include: { role: true, campus: true },
    });
  }

  async removeRole(organizationId: string, userId: string, userRoleId: string) {
    await this.findUser(organizationId, userId);

    const userRole = await this.prisma.userRole.findFirst({
      where: { id: userRoleId, userId },
    });
    if (!userRole) throw new NotFoundException('User role assignment not found');

    await this.prisma.userRole.delete({ where: { id: userRoleId } });
  }

  // ─── Roles ────────────────────────────────────────────────────

  async createRole(organizationId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Role code '${dto.code}' already exists`);

    return this.prisma.role.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        isSystemRole: dto.isSystemRole ?? false,
      },
    });
  }

  async findRoles(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findRole(organizationId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async updateRole(organizationId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.findRole(organizationId, roleId);
    if (role.isSystemRole) throw new BadRequestException('System roles cannot be modified');

    if (dto.code && dto.code !== role.code) {
      const existing = await this.prisma.role.findUnique({
        where: { organizationId_code: { organizationId, code: dto.code } },
      });
      if (existing) throw new ConflictException(`Role code '${dto.code}' already exists`);
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async deleteRole(organizationId: string, roleId: string) {
    const role = await this.findRole(organizationId, roleId);
    if (role.isSystemRole) throw new BadRequestException('System roles cannot be deleted');

    const inUse = await this.prisma.userRole.count({ where: { roleId } });
    if (inUse > 0) throw new BadRequestException('Role is assigned to users and cannot be deleted');

    await this.prisma.role.delete({ where: { id: roleId } });
  }

  // ─── Permissions ──────────────────────────────────────────────

  async findPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });
  }

  async assignPermissions(organizationId: string, roleId: string, dto: AssignPermissionsDto) {
    await this.findRole(organizationId, roleId);

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });
    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Replace existing permissions (full sync)
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    return this.findRole(organizationId, roleId);
  }

  // ─── Private helpers ──────────────────────────────────────────

  private formatUser(user: any) {
    const { passwordHash, ...rest } = user;
    void passwordHash;
    return {
      ...rest,
      name: `${user.person.firstName} ${user.person.lastName}`,
    };
  }
}
