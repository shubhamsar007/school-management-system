import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { CreateTimetableEntryDto, UpdateTimetableEntryDto } from './dto/create-timetable-entry.dto';

/** Parse "HH:MM" and return a Date object with only the time portion set */
function parseTime(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const d = new Date(1970, 0, 1, hours, minutes, 0, 0);
  return d;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Buildings ────────────────────────────────────────────────

  async createBuilding(organizationId: string, dto: CreateBuildingDto) {
    await this.verifyCampus(organizationId, dto.campusId);
    return this.prisma.building.create({
      data: {
        campusId: dto.campusId,
        name: dto.name,
        code: dto.code,
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: { rooms: true },
    });
  }

  async findBuildings(organizationId: string, campusId: string) {
    await this.verifyCampus(organizationId, campusId);
    return this.prisma.building.findMany({
      where: { campusId },
      include: { rooms: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateBuilding(organizationId: string, id: string, dto: Partial<CreateBuildingDto>) {
    await this.getBuildingOrFail(organizationId, id);
    return this.prisma.building.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.code ? { code: dto.code } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: { rooms: true },
    });
  }

  async deleteBuilding(organizationId: string, id: string) {
    await this.getBuildingOrFail(organizationId, id);
    const hasRooms = await this.prisma.room.findFirst({ where: { buildingId: id } });
    if (hasRooms) {
      throw new BadRequestException('Building has rooms and cannot be deleted');
    }
    await this.prisma.building.delete({ where: { id } });
  }

  private async getBuildingOrFail(organizationId: string, id: string) {
    const building = await this.prisma.building.findFirst({
      where: { id },
      include: { campus: true },
    });
    if (!building || building.campus.organizationId !== organizationId) {
      throw new NotFoundException('Building not found');
    }
    return building;
  }

  // ─── Rooms ────────────────────────────────────────────────────

  async createRoom(organizationId: string, dto: CreateRoomDto) {
    await this.verifyCampus(organizationId, dto.campusId);
    if (dto.buildingId) {
      await this.getBuildingOrFail(organizationId, dto.buildingId);
    }
    return this.prisma.room.create({
      data: {
        campusId: dto.campusId,
        ...(dto.buildingId ? { buildingId: dto.buildingId } : {}),
        name: dto.name,
        code: dto.code,
        roomType: dto.roomType,
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: { building: true },
    });
  }

  async findRooms(
    organizationId: string,
    campusId: string,
    filters: { buildingId?: string; roomType?: string; status?: string },
  ) {
    await this.verifyCampus(organizationId, campusId);
    return this.prisma.room.findMany({
      where: {
        campusId,
        ...(filters.buildingId ? { buildingId: filters.buildingId } : {}),
        ...(filters.roomType ? { roomType: filters.roomType } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { building: true },
      orderBy: [{ building: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async updateRoom(organizationId: string, id: string, dto: Partial<CreateRoomDto>) {
    await this.getRoomOrFail(organizationId, id);
    return this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.code ? { code: dto.code } : {}),
        ...(dto.roomType ? { roomType: dto.roomType } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.buildingId !== undefined ? { buildingId: dto.buildingId } : {}),
      },
      include: { building: true },
    });
  }

  async deleteRoom(organizationId: string, id: string) {
    await this.getRoomOrFail(organizationId, id);
    const inUse = await this.prisma.timetableEntry.findFirst({ where: { roomId: id } });
    if (inUse) {
      throw new BadRequestException('Room is assigned to timetable entries and cannot be deleted');
    }
    await this.prisma.room.delete({ where: { id } });
  }

  private async getRoomOrFail(organizationId: string, id: string) {
    const room = await this.prisma.room.findFirst({
      where: { id },
      include: { building: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    const campus = await this.prisma.campus.findFirst({
      where: { id: room.campusId, organizationId },
    });
    if (!campus) throw new NotFoundException('Room not found');
    return room;
  }

  // ─── Periods ──────────────────────────────────────────────────

  async createPeriod(organizationId: string, dto: CreatePeriodDto) {
    await this.verifyCampus(organizationId, dto.campusId);
    return this.prisma.period.create({
      data: {
        campusId: dto.campusId,
        name: dto.name,
        periodNumber: dto.periodNumber,
        startTime: parseTime(dto.startTime),
        endTime: parseTime(dto.endTime),
        periodType: dto.periodType,
      },
    });
  }

  async findPeriods(organizationId: string, campusId: string) {
    await this.verifyCampus(organizationId, campusId);
    return this.prisma.period.findMany({
      where: { campusId },
      orderBy: { periodNumber: 'asc' },
    });
  }

  async updatePeriod(organizationId: string, id: string, dto: Partial<CreatePeriodDto>) {
    await this.getPeriodOrFail(organizationId, id);
    return this.prisma.period.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.periodNumber !== undefined ? { periodNumber: dto.periodNumber } : {}),
        ...(dto.startTime ? { startTime: parseTime(dto.startTime) } : {}),
        ...(dto.endTime ? { endTime: parseTime(dto.endTime) } : {}),
        ...(dto.periodType ? { periodType: dto.periodType } : {}),
      },
    });
  }

  async deletePeriod(organizationId: string, id: string) {
    await this.getPeriodOrFail(organizationId, id);
    const inUse = await this.prisma.timetableEntry.findFirst({ where: { periodId: id } });
    if (inUse) {
      throw new BadRequestException('Period is used in timetable entries and cannot be deleted');
    }
    await this.prisma.period.delete({ where: { id } });
  }

  private async getPeriodOrFail(organizationId: string, id: string) {
    const period = await this.prisma.period.findFirst({
      where: { id },
      include: { campus: true },
    });
    if (!period || period.campus.organizationId !== organizationId) {
      throw new NotFoundException('Period not found');
    }
    return period;
  }

  // ─── Timetables ───────────────────────────────────────────────

  async createTimetable(organizationId: string, dto: CreateTimetableDto) {
    await this.verifyCampus(organizationId, dto.campusId);
    return this.prisma.timetable.create({
      data: {
        organizationId,
        campusId: dto.campusId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        effectiveFrom: new Date(dto.effectiveFrom),
        ...(dto.effectiveTo ? { effectiveTo: new Date(dto.effectiveTo) } : {}),
        status: 'DRAFT',
      },
      include: { academicYear: true },
    });
  }

  async findTimetables(
    organizationId: string,
    filters: { campusId?: string; academicYearId?: string; status?: string },
  ) {
    return this.prisma.timetable.findMany({
      where: {
        organizationId,
        ...(filters.campusId ? { campusId: filters.campusId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { academicYear: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findTimetable(organizationId: string, id: string) {
    const timetable = await this.prisma.timetable.findFirst({
      where: { id, organizationId },
      include: {
        academicYear: true,
        entries: {
          include: {
            period: true,
            section: true,
            subject: true,
            room: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { period: { periodNumber: 'asc' } }],
        },
      },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');
    return timetable;
  }

  async activateTimetable(organizationId: string, id: string) {
    const timetable = await this.getTimetableOrFail(organizationId, id);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT timetables can be activated');
    }
    // Archive any currently active timetable for same campus + academic year
    await this.prisma.timetable.updateMany({
      where: {
        organizationId,
        campusId: timetable.campusId,
        academicYearId: timetable.academicYearId,
        status: 'ACTIVE',
        NOT: { id },
      },
      data: { status: 'ARCHIVED' },
    });
    return this.prisma.timetable.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { academicYear: true },
    });
  }

  async archiveTimetable(organizationId: string, id: string) {
    const timetable = await this.getTimetableOrFail(organizationId, id);
    if (timetable.status === 'ARCHIVED') {
      throw new BadRequestException('Timetable is already archived');
    }
    return this.prisma.timetable.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { academicYear: true },
    });
  }

  async deleteTimetable(organizationId: string, id: string) {
    const timetable = await this.getTimetableOrFail(organizationId, id);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT timetables can be deleted');
    }
    await this.prisma.timetable.delete({ where: { id } });
  }

  private async getTimetableOrFail(organizationId: string, id: string) {
    const timetable = await this.prisma.timetable.findFirst({
      where: { id, organizationId },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');
    return timetable;
  }

  // ─── Timetable Entries ────────────────────────────────────────

  async addEntry(organizationId: string, timetableId: string, dto: CreateTimetableEntryDto) {
    const timetable = await this.getTimetableOrFail(organizationId, timetableId);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Entries can only be added to DRAFT timetables');
    }

    // Validate period belongs to same campus
    const period = await this.getPeriodOrFail(organizationId, dto.periodId);
    if (period.campusId !== timetable.campusId) {
      throw new BadRequestException('Period does not belong to this timetable campus');
    }

    // Check teacher conflict: teacher can't have two slots at same time
    if (dto.teacherId) {
      await this.checkTeacherConflict(timetableId, dto.dayOfWeek, dto.periodId, dto.teacherId);
    }

    // Check room conflict: room can't be booked for two slots at same time
    if (dto.roomId) {
      await this.checkRoomConflict(timetableId, dto.dayOfWeek, dto.periodId, dto.roomId);
    }

    try {
      return await this.prisma.timetableEntry.create({
        data: {
          timetableId,
          dayOfWeek: dto.dayOfWeek,
          periodId: dto.periodId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
          ...(dto.teacherId ? { teacherId: dto.teacherId } : {}),
          ...(dto.roomId ? { roomId: dto.roomId } : {}),
        },
        include: {
          period: true,
          section: true,
          subject: true,
          room: true,
        },
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        const day = DAY_NAMES[dto.dayOfWeek] ?? `day ${dto.dayOfWeek}`;
        throw new ConflictException(
          `Section already has an entry on ${day} for this period`,
        );
      }
      throw e;
    }
  }

  async updateEntry(
    organizationId: string,
    timetableId: string,
    entryId: string,
    dto: UpdateTimetableEntryDto,
  ) {
    const timetable = await this.getTimetableOrFail(organizationId, timetableId);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Entries can only be modified on DRAFT timetables');
    }

    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id: entryId, timetableId },
    });
    if (!entry) throw new NotFoundException('Timetable entry not found');

    const newTeacherId = dto.teacherId !== undefined ? dto.teacherId : entry.teacherId;
    const newRoomId = dto.roomId !== undefined ? dto.roomId : entry.roomId;

    if (newTeacherId && newTeacherId !== entry.teacherId) {
      await this.checkTeacherConflict(timetableId, entry.dayOfWeek, entry.periodId, newTeacherId, entryId);
    }
    if (newRoomId && newRoomId !== entry.roomId) {
      await this.checkRoomConflict(timetableId, entry.dayOfWeek, entry.periodId, newRoomId, entryId);
    }

    return this.prisma.timetableEntry.update({
      where: { id: entryId },
      data: {
        ...(dto.subjectId !== undefined ? { subjectId: dto.subjectId } : {}),
        ...(dto.teacherId !== undefined ? { teacherId: dto.teacherId } : {}),
        ...(dto.roomId !== undefined ? { roomId: dto.roomId } : {}),
      },
      include: {
        period: true,
        section: true,
        subject: true,
        room: true,
      },
    });
  }

  async deleteEntry(organizationId: string, timetableId: string, entryId: string) {
    const timetable = await this.getTimetableOrFail(organizationId, timetableId);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Entries can only be removed from DRAFT timetables');
    }
    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id: entryId, timetableId },
    });
    if (!entry) throw new NotFoundException('Timetable entry not found');
    await this.prisma.timetableEntry.delete({ where: { id: entryId } });
  }

  // ─── Views ────────────────────────────────────────────────────

  /** Weekly schedule for a section */
  async getSectionSchedule(organizationId: string, sectionId: string, timetableId?: string) {
    let resolvedTimetableId = timetableId;

    if (!resolvedTimetableId) {
      // Find the active timetable for the campus the section belongs to
      const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
      if (!section) throw new NotFoundException('Section not found');

      const activeTimetable = await this.prisma.timetable.findFirst({
        where: { organizationId, campusId: section.campusId, status: 'ACTIVE' },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (!activeTimetable) throw new NotFoundException('No active timetable found for this campus');
      resolvedTimetableId = activeTimetable.id;
    }

    const entries = await this.prisma.timetableEntry.findMany({
      where: { timetableId: resolvedTimetableId, sectionId },
      include: {
        period: true,
        section: true,
        subject: true,
        room: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: { periodNumber: 'asc' } }],
    });

    return this.groupByDay(entries);
  }

  /** Weekly schedule for a teacher */
  async getTeacherSchedule(organizationId: string, teacherId: string, timetableId?: string) {
    let resolvedTimetableId = timetableId;

    if (!resolvedTimetableId) {
      const activeTimetable = await this.prisma.timetable.findFirst({
        where: { organizationId, status: 'ACTIVE' },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (!activeTimetable) throw new NotFoundException('No active timetable found');
      resolvedTimetableId = activeTimetable.id;
    }

    const entries = await this.prisma.timetableEntry.findMany({
      where: { timetableId: resolvedTimetableId, teacherId },
      include: {
        period: true,
        section: true,
        subject: true,
        room: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: { periodNumber: 'asc' } }],
    });

    return this.groupByDay(entries);
  }

  // ─── Conflict Checks ──────────────────────────────────────────

  private async checkTeacherConflict(
    timetableId: string,
    dayOfWeek: number,
    periodId: string,
    teacherId: string,
    excludeEntryId?: string,
  ) {
    const conflict = await this.prisma.timetableEntry.findFirst({
      where: {
        timetableId,
        dayOfWeek,
        periodId,
        teacherId,
        ...(excludeEntryId ? { NOT: { id: excludeEntryId } } : {}),
      },
      include: { section: true, period: true },
    });
    if (conflict) {
      const day = DAY_NAMES[dayOfWeek] ?? `day ${dayOfWeek}`;
      throw new ConflictException(
        `Teacher is already scheduled on ${day} during period "${conflict.period.name}" for another section`,
      );
    }
  }

  private async checkRoomConflict(
    timetableId: string,
    dayOfWeek: number,
    periodId: string,
    roomId: string,
    excludeEntryId?: string,
  ) {
    const conflict = await this.prisma.timetableEntry.findFirst({
      where: {
        timetableId,
        dayOfWeek,
        periodId,
        roomId,
        ...(excludeEntryId ? { NOT: { id: excludeEntryId } } : {}),
      },
      include: { section: true, period: true },
    });
    if (conflict) {
      const day = DAY_NAMES[dayOfWeek] ?? `day ${dayOfWeek}`;
      throw new ConflictException(
        `Room is already booked on ${day} during period "${conflict.period.name}"`,
      );
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private groupByDay<T extends { dayOfWeek: number }>(entries: T[]) {
    const result: Record<number, { day: string; entries: T[] }> = {};
    for (let d = 1; d <= 7; d++) {
      result[d] = { day: DAY_NAMES[d] ?? `Day ${d}`, entries: [] };
    }
    for (const entry of entries) {
      const bucket = result[entry.dayOfWeek];
      if (bucket) bucket.entries.push(entry);
    }
    return Object.values(result).filter((d) => d.entries.length > 0);
  }

  private async verifyCampus(organizationId: string, campusId: string) {
    const campus = await this.prisma.campus.findFirst({
      where: { id: campusId, organizationId },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    return campus;
  }
}
