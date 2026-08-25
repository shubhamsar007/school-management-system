import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  // ─── Organizations ───────────────────────────────────────────

  async create(dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException(`Organization code '${dto.code}' already exists`);

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        timezone: dto.timezone ?? 'Asia/Kolkata',
      },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: { campuses: { where: { deletedAt: null }, orderBy: { name: 'asc' } } },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.email !== undefined ? { email: dto.email ?? null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone ?? null } : {}),
        ...(dto.website !== undefined ? { website: dto.website ?? null } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  // ─── Campuses ────────────────────────────────────────────────

  async createCampus(organizationId: string, dto: CreateCampusDto) {
    await this.findOne(organizationId);

    const existing = await this.prisma.campus.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Campus code '${dto.code}' already exists`);

    let addressId: string | undefined;
    if (dto.address) {
      const address = await this.prisma.address.create({
        data: {
          addressLine1: dto.address.addressLine1,
          addressLine2: dto.address.addressLine2 ?? null,
          landmark: dto.address.landmark ?? null,
          city: dto.address.city,
          district: dto.address.district ?? null,
          state: dto.address.state,
          postalCode: dto.address.postalCode,
          country: dto.address.country ?? 'IN',
          latitude: dto.address.latitude ?? null,
          longitude: dto.address.longitude ?? null,
        },
      });
      addressId = address.id;
    }

    return this.prisma.campus.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        addressId: addressId ?? null,
      },
      include: { address: true },
    });
  }

  async findCampuses(organizationId: string) {
    await this.findOne(organizationId);
    return this.prisma.campus.findMany({
      where: { organizationId, deletedAt: null },
      include: { address: true },
      orderBy: { name: 'asc' },
    });
  }

  async findCampus(organizationId: string, campusId: string) {
    const campus = await this.prisma.campus.findFirst({
      where: { id: campusId, organizationId, deletedAt: null },
      include: { address: true },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    return campus;
  }

  async updateCampus(organizationId: string, campusId: string, dto: UpdateCampusDto) {
    const campus = await this.findCampus(organizationId, campusId);

    if (dto.address) {
      if (campus.addressId) {
        await this.prisma.address.update({
          where: { id: campus.addressId },
          data: {
            ...(dto.address.addressLine1 !== undefined ? { addressLine1: dto.address.addressLine1 } : {}),
            ...(dto.address.addressLine2 !== undefined ? { addressLine2: dto.address.addressLine2 ?? null } : {}),
            ...(dto.address.landmark !== undefined ? { landmark: dto.address.landmark ?? null } : {}),
            ...(dto.address.city !== undefined ? { city: dto.address.city } : {}),
            ...(dto.address.district !== undefined ? { district: dto.address.district ?? null } : {}),
            ...(dto.address.state !== undefined ? { state: dto.address.state } : {}),
            ...(dto.address.postalCode !== undefined ? { postalCode: dto.address.postalCode } : {}),
            ...(dto.address.country !== undefined ? { country: dto.address.country } : {}),
            ...(dto.address.latitude !== undefined ? { latitude: dto.address.latitude ?? null } : {}),
            ...(dto.address.longitude !== undefined ? { longitude: dto.address.longitude ?? null } : {}),
          },
        });
      } else {
        const address = await this.prisma.address.create({
          data: {
            addressLine1: dto.address.addressLine1,
            addressLine2: dto.address.addressLine2 ?? null,
            landmark: dto.address.landmark ?? null,
            city: dto.address.city,
            district: dto.address.district ?? null,
            state: dto.address.state,
            postalCode: dto.address.postalCode,
            country: dto.address.country ?? 'IN',
            latitude: dto.address.latitude ?? null,
            longitude: dto.address.longitude ?? null,
          },
        });
        await this.prisma.campus.update({
          where: { id: campusId },
          data: { addressId: address.id },
        });
      }
    }

    return this.prisma.campus.update({
      where: { id: campusId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone ?? null } : {}),
        ...(dto.email !== undefined ? { email: dto.email ?? null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: { address: true },
    });
  }

  async deleteCampus(organizationId: string, campusId: string) {
    await this.findCampus(organizationId, campusId);
    await this.prisma.campus.update({
      where: { id: campusId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Academic Years ──────────────────────────────────────────

  async createAcademicYear(organizationId: string, dto: CreateAcademicYearDto) {
    await this.findOne(organizationId);

    const existing = await this.prisma.academicYear.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Academic year code '${dto.code}' already exists`);

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { organizationId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
        status: dto.isCurrent ? 'ACTIVE' : 'UPCOMING',
      },
    });
  }

  async findAcademicYears(organizationId: string) {
    await this.findOne(organizationId);
    return this.prisma.academicYear.findMany({
      where: { organizationId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findAcademicYear(organizationId: string, yearId: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id: yearId, organizationId },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async updateAcademicYear(organizationId: string, yearId: string, dto: UpdateAcademicYearDto) {
    await this.findAcademicYear(organizationId, yearId);

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { organizationId, isCurrent: true, id: { not: yearId } },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id: yearId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.isCurrent !== undefined ? { isCurrent: dto.isCurrent } : {}),
      },
    });
  }

  // ─── Settings ────────────────────────────────────────────────

  async getSettings(organizationId: string, category?: string) {
    return this.prisma.setting.findMany({
      where: {
        organizationId,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async upsertSetting(
    organizationId: string,
    key: string,
    value: Prisma.InputJsonValue,
    valueType: string,
    category: string,
    updatedBy: string,
  ) {
    return this.prisma.setting.upsert({
      where: { organizationId_key: { organizationId, key } },
      create: { organizationId, key, value, valueType, category, updatedBy },
      update: { value, valueType, category, updatedBy },
    });
  }
}
