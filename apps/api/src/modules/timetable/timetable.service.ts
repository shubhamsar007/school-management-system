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
import { SetTeacherAvailabilityDto } from './dto/set-teacher-availability.dto';
import { CreateSchedulingRuleDto } from './dto/create-scheduling-rule.dto';

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
            teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
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
          teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
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
        teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
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

  async moveEntry(
    organizationId: string,
    timetableId: string,
    entryId: string,
    dto: { dayOfWeek: number; periodId: string },
  ) {
    const timetable = await this.getTimetableOrFail(organizationId, timetableId);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Entries can only be moved in DRAFT timetables');
    }

    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id: entryId, timetableId },
    });
    if (!entry) throw new NotFoundException('Timetable entry not found');

    // Validate target period belongs to same campus
    const period = await this.getPeriodOrFail(organizationId, dto.periodId);
    if (period.campusId !== timetable.campusId) {
      throw new BadRequestException('Target period does not belong to this timetable campus');
    }

    // Re-run conflict checks for the new slot (exclude this entry)
    if (entry.teacherId) {
      await this.checkTeacherConflict(timetableId, dto.dayOfWeek, dto.periodId, entry.teacherId, entryId);
    }
    if (entry.roomId) {
      await this.checkRoomConflict(timetableId, dto.dayOfWeek, dto.periodId, entry.roomId, entryId);
    }

    try {
      return await this.prisma.timetableEntry.update({
        where: { id: entryId },
        data: { dayOfWeek: dto.dayOfWeek, periodId: dto.periodId },
        include: {
          period: true,
          section: true,
          subject: true,
          room: true,
          teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
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

  // ─── Conflict Detection ───────────────────────────────────────

  async getConflicts(organizationId: string, timetableId: string) {
    await this.getTimetableOrFail(organizationId, timetableId);

    const entries = await this.prisma.timetableEntry.findMany({
      where: { timetableId },
      include: {
        period: true,
        section: true,
        subject: true,
        room: true,
        teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
      },
    });

    type ConflictEntry = {
      id: string;
      section: { id: string; name: string; code: string };
      subject: { id: string; name: string } | null;
      teacher: { id: string; person: { firstName: string; lastName: string } } | null;
      room: { id: string; name: string; code: string } | null;
    };

    type Conflict = {
      type: 'TEACHER' | 'ROOM';
      dayOfWeek: number;
      day: string;
      period: { id: string; name: string; startTime: string; endTime: string };
      teacher?: { id: string; person: { firstName: string; lastName: string } } | null;
      room?: { id: string; name: string } | null;
      entries: ConflictEntry[];
    };

    const teacherConflicts: Conflict[] = [];
    const roomConflicts: Conflict[] = [];

    // Group by teacherId + day + period
    const teacherMap = new Map<string, typeof entries>();
    for (const e of entries) {
      if (!e.teacherId) continue;
      const key = `${e.teacherId}|${e.dayOfWeek}|${e.periodId}`;
      if (!teacherMap.has(key)) teacherMap.set(key, []);
      teacherMap.get(key)!.push(e);
    }
    for (const [, group] of teacherMap) {
      if (group.length < 2) continue;
      const first = group[0]!;
      teacherConflicts.push({
        type: 'TEACHER',
        dayOfWeek: first.dayOfWeek,
        day: DAY_NAMES[first.dayOfWeek] ?? `Day ${first.dayOfWeek}`,
        period: {
          id: first.period.id,
          name: first.period.name,
          startTime: String(first.period.startTime),
          endTime: String(first.period.endTime),
        },
        teacher: first.teacher,
        entries: group.map((e) => ({
          id: e.id,
          section: e.section,
          subject: e.subject,
          teacher: e.teacher,
          room: e.room,
        })),
      });
    }

    // Group by roomId + day + period
    const roomMap = new Map<string, typeof entries>();
    for (const e of entries) {
      if (!e.roomId) continue;
      const key = `${e.roomId}|${e.dayOfWeek}|${e.periodId}`;
      if (!roomMap.has(key)) roomMap.set(key, []);
      roomMap.get(key)!.push(e);
    }
    for (const [, group] of roomMap) {
      if (group.length < 2) continue;
      const first = group[0]!;
      roomConflicts.push({
        type: 'ROOM',
        dayOfWeek: first.dayOfWeek,
        day: DAY_NAMES[first.dayOfWeek] ?? `Day ${first.dayOfWeek}`,
        period: {
          id: first.period.id,
          name: first.period.name,
          startTime: String(first.period.startTime),
          endTime: String(first.period.endTime),
        },
        room: first.room,
        entries: group.map((e) => ({
          id: e.id,
          section: e.section,
          subject: e.subject,
          teacher: e.teacher,
          room: e.room,
        })),
      });
    }

    return {
      total: teacherConflicts.length + roomConflicts.length,
      teacherConflicts,
      roomConflicts,
    };
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
        teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
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

  /** Weekly schedule for a room */
  async getRoomSchedule(organizationId: string, roomId: string, timetableId?: string) {
    const room = await this.getRoomOrFail(organizationId, roomId);

    let resolvedTimetableId = timetableId;
    if (!resolvedTimetableId) {
      const activeTimetable = await this.prisma.timetable.findFirst({
        where: { organizationId, campusId: room.campusId, status: 'ACTIVE' },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (!activeTimetable) throw new NotFoundException('No active timetable found for this campus');
      resolvedTimetableId = activeTimetable.id;
    }

    const entries = await this.prisma.timetableEntry.findMany({
      where: { timetableId: resolvedTimetableId, roomId },
      include: {
        period: true,
        section: true,
        subject: true,
        teacher: { select: { id: true, person: { select: { firstName: true, lastName: true } } } },
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

  // ─── Teacher Availability ─────────────────────────────────────

  async getTeacherAvailability(organizationId: string, teacherId: string) {
    // Verify teacher belongs to org
    const teacher = await this.prisma.employee.findFirst({
      where: { id: teacherId, organizationId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const records = await this.prisma.teacherAvailability.findMany({
      where: { employeeId: teacherId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Return full 7-day structure (fill in defaults for missing days)
    const map = new Map(records.map((r) => [r.dayOfWeek, r]));
    return Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      const rec = map.get(day);
      return {
        dayOfWeek: day,
        isAvailable: rec?.isAvailable ?? true,
        note: rec?.note ?? null,
        id: rec?.id ?? null,
      };
    });
  }

  async setTeacherAvailability(
    organizationId: string,
    teacherId: string,
    dto: SetTeacherAvailabilityDto,
  ) {
    const teacher = await this.prisma.employee.findFirst({
      where: { id: teacherId, organizationId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    await this.prisma.$transaction(
      dto.availability.map((item) =>
        this.prisma.teacherAvailability.upsert({
          where: { employeeId_dayOfWeek: { employeeId: teacherId, dayOfWeek: item.dayOfWeek } },
          create: {
            employeeId: teacherId,
            dayOfWeek: item.dayOfWeek,
            isAvailable: item.isAvailable,
            ...(item.note ? { note: item.note } : {}),
          },
          update: {
            isAvailable: item.isAvailable,
            note: item.note ?? null,
          },
        }),
      ),
    );

    return this.getTeacherAvailability(organizationId, teacherId);
  }

  // ─── Scheduling Rules ─────────────────────────────────────────

  async getSchedulingRules(organizationId: string, campusId: string) {
    await this.verifyCampus(organizationId, campusId);
    return this.prisma.schedulingRule.findMany({
      where: { campusId },
      include: { period: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSchedulingRule(organizationId: string, dto: CreateSchedulingRuleDto) {
    await this.verifyCampus(organizationId, dto.campusId);
    if (dto.periodId) {
      await this.getPeriodOrFail(organizationId, dto.periodId);
    }
    return this.prisma.schedulingRule.create({
      data: {
        campusId: dto.campusId,
        ruleType: dto.ruleType,
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.periodId ? { periodId: dto.periodId } : {}),
        ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        isActive: dto.isActive ?? true,
      },
      include: { period: true },
    });
  }

  async updateSchedulingRule(
    organizationId: string,
    id: string,
    dto: Partial<CreateSchedulingRuleDto>,
  ) {
    const rule = await this.getSchedulingRuleOrFail(organizationId, id);
    return this.prisma.schedulingRule.update({
      where: { id: rule.id },
      data: {
        ...(dto.ruleType ? { ruleType: dto.ruleType } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.periodId !== undefined ? { periodId: dto.periodId } : {}),
        ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { period: true },
    });
  }

  async deleteSchedulingRule(organizationId: string, id: string) {
    await this.getSchedulingRuleOrFail(organizationId, id);
    await this.prisma.schedulingRule.delete({ where: { id } });
  }

  private async getSchedulingRuleOrFail(organizationId: string, id: string) {
    const rule = await this.prisma.schedulingRule.findFirst({
      where: { id },
      include: { campus: true },
    });
    if (!rule || rule.campus.organizationId !== organizationId) {
      throw new NotFoundException('Scheduling rule not found');
    }
    return rule;
  }

  // ─── Substitute Suggestions ───────────────────────────────────

  /**
   * Score-based substitute suggestions for a teacher's absence on a given day.
   * Returns each affected period with a ranked list of candidate teachers + scores.
   * Does NOT create any DB records — purely read-only computation.
   */
  async suggestSubstitutes(
    organizationId: string,
    timetableId: string,
    absentTeacherId: string,
    dayOfWeek: number,
    date?: string, // ISO date (YYYY-MM-DD) — if supplied, checks active leaves for that day
  ) {
    const timetable = await this.getTimetableOrFail(organizationId, timetableId);

    // 1. Identify affected entries (this teacher's periods on the given day)
    const affectedEntries = await this.prisma.timetableEntry.findMany({
      where: { timetableId, teacherId: absentTeacherId, dayOfWeek },
      include: {
        period: true,
        section: true,
        subject: true,
      },
      orderBy: { period: { periodNumber: 'asc' } },
    });

    if (affectedEntries.length === 0) {
      return { affectedEntries: [], candidates: [] };
    }

    // 2. Fetch the absent teacher's details (for department affinity comparison)
    const absentTeacher = await this.prisma.employee.findFirst({
      where: { id: absentTeacherId },
      select: { id: true, departmentId: true },
    });

    // 3. Fetch all active employees on the same campus
    const allCandidates = await this.prisma.employee.findMany({
      where: {
        campusId: timetable.campusId,
        employmentStatus: 'ACTIVE',
        NOT: { id: absentTeacherId },
      },
      select: {
        id: true,
        departmentId: true,
        person: { select: { firstName: true, lastName: true } },
      },
    });

    const candidateIds = allCandidates.map((c) => c.id);
    const periodIds = affectedEntries.map((e) => e.periodId);

    // 4. Fetch busy teachers (already scheduled on this day + these periods) in this timetable
    const busyEntries = await this.prisma.timetableEntry.findMany({
      where: {
        timetableId,
        dayOfWeek,
        periodId: { in: periodIds },
        teacherId: { in: candidateIds },
      },
      select: { teacherId: true, periodId: true },
    });
    const busyMap = new Map<string, Set<string>>(); // teacherId → Set<periodId>
    for (const e of busyEntries) {
      if (!e.teacherId) continue;
      if (!busyMap.has(e.teacherId)) busyMap.set(e.teacherId, new Set());
      busyMap.get(e.teacherId)!.add(e.periodId);
    }

    // 5. Fetch teachers on approved leave for the given date
    const onLeaveIds = new Set<string>();
    if (date) {
      const targetDate = new Date(date);
      const onLeave = await this.prisma.leaveRequest.findMany({
        where: {
          organizationId,
          employeeId: { in: candidateIds },
          status: 'APPROVED',
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
        },
        select: { employeeId: true },
      });
      onLeave.forEach((l) => onLeaveIds.add(l.employeeId));
    }

    // 6. Subject proficiency: teachers who have taught the affected subjects before
    const subjectIds = [...new Set(affectedEntries.map((e) => e.subjectId).filter(Boolean))];
    const proficientTeachers = await this.prisma.teacherAssignment.findMany({
      where: { subjectId: { in: subjectIds as string[] }, teacherId: { in: candidateIds } },
      select: { teacherId: true, subjectId: true },
    });
    const proficientMap = new Map<string, Set<string>>(); // teacherId → Set<subjectId>
    for (const pa of proficientTeachers) {
      if (!proficientMap.has(pa.teacherId)) proficientMap.set(pa.teacherId, new Set());
      proficientMap.get(pa.teacherId)!.add(pa.subjectId);
    }

    // 7. Workload: count existing timetable periods for each candidate this day
    const workloadCounts = await this.prisma.timetableEntry.groupBy({
      by: ['teacherId'],
      where: { timetableId, dayOfWeek, teacherId: { in: candidateIds } },
      _count: { id: true },
    });
    const workloadMap = new Map<string, number>();
    for (const w of workloadCounts) {
      if (w.teacherId) workloadMap.set(w.teacherId, w._count.id);
    }

    // 8. Fairness: how many times each candidate has been a substitute this academic year
    // We use SubstitutionAssignment — counts confirmed/suggested records
    const substituteCounts = await this.prisma.substitutionAssignment.groupBy({
      by: ['substituteTeacherId'],
      where: { substituteTeacherId: { in: candidateIds } },
      _count: { id: true },
    });
    const substituteMap = new Map<string, number>();
    for (const s of substituteCounts) {
      if (s.substituteTeacherId) substituteMap.set(s.substituteTeacherId, s._count.id);
    }

    const maxSubstitutions = Math.max(1, ...substituteMap.values());
    const maxWorkload = Math.max(1, ...workloadMap.values());

    // 9. Score each candidate per affected period
    type ScoredCandidate = {
      candidateId: string;
      name: string;
      subjectProficiency: number;
      workloadScore: number;
      fairnessScore: number;
      departmentAffinity: number;
      total: number;
      disqualifiedReason: string | null;
    };

    const perPeriodResults = affectedEntries.map((entry) => {
      const candidates: ScoredCandidate[] = allCandidates.map((c) => {
        // Disqualification checks
        if (onLeaveIds.has(c.id)) {
          return { candidateId: c.id, name: `${c.person.firstName} ${c.person.lastName}`, subjectProficiency: 0, workloadScore: 0, fairnessScore: 0, departmentAffinity: 0, total: 0, disqualifiedReason: 'On approved leave' };
        }
        if (busyMap.get(c.id)?.has(entry.periodId)) {
          return { candidateId: c.id, name: `${c.person.firstName} ${c.person.lastName}`, subjectProficiency: 0, workloadScore: 0, fairnessScore: 0, departmentAffinity: 0, total: 0, disqualifiedReason: 'Already scheduled this period' };
        }

        // Scores
        const hasProficiency = entry.subjectId ? (proficientMap.get(c.id)?.has(entry.subjectId) ?? false) : false;
        const subjectProficiency = hasProficiency ? 40 : 0;

        const currentLoad = workloadMap.get(c.id) ?? 0;
        const workloadScore = Math.round(30 * (1 - currentLoad / (maxWorkload + 1)));

        const subCount = substituteMap.get(c.id) ?? 0;
        const fairnessScore = Math.round(20 * (1 - subCount / (maxSubstitutions + 1)));

        const departmentAffinity = (c.departmentId && absentTeacher?.departmentId && c.departmentId === absentTeacher.departmentId) ? 10 : 0;

        const total = subjectProficiency + workloadScore + fairnessScore + departmentAffinity;
        return {
          candidateId: c.id,
          name: `${c.person.firstName} ${c.person.lastName}`,
          subjectProficiency,
          workloadScore,
          fairnessScore,
          departmentAffinity,
          total,
          disqualifiedReason: null,
        };
      });

      // Sort: qualified (null disqualified) first by score desc; disqualified at end
      candidates.sort((a, b) => {
        if (a.disqualifiedReason && !b.disqualifiedReason) return 1;
        if (!a.disqualifiedReason && b.disqualifiedReason) return -1;
        return b.total - a.total;
      });

      return {
        entry: {
          id: entry.id,
          periodId: entry.periodId,
          periodName: entry.period.name,
          periodNumber: entry.period.periodNumber,
          startTime: String(entry.period.startTime),
          subjectId: entry.subjectId,
          subjectName: entry.subject?.name ?? null,
          sectionId: entry.sectionId,
          sectionName: entry.section.name,
        },
        candidates: candidates.slice(0, 5), // top 5 only
      };
    });

    return {
      dayOfWeek,
      timetableId,
      absentTeacherId,
      periods: perPeriodResults,
    };
  }

  // ─── Copy Timetable ───────────────────────────────────────────

  async copyTimetable(organizationId: string, sourceId: string, newName: string) {
    const source = await this.getTimetableOrFail(organizationId, sourceId);

    const newTimetable = await this.prisma.timetable.create({
      data: {
        organizationId,
        campusId: source.campusId,
        academicYearId: source.academicYearId,
        name: newName,
        effectiveFrom: source.effectiveFrom,
        ...(source.effectiveTo ? { effectiveTo: source.effectiveTo } : {}),
        status: 'DRAFT',
      },
      include: { academicYear: true },
    });

    const entries = await this.prisma.timetableEntry.findMany({
      where: { timetableId: sourceId },
      select: {
        dayOfWeek: true,
        periodId: true,
        classId: true,
        sectionId: true,
        subjectId: true,
        teacherId: true,
        roomId: true,
      },
    });

    if (entries.length > 0) {
      await this.prisma.timetableEntry.createMany({
        data: entries.map((e) => ({
          timetableId: newTimetable.id,
          dayOfWeek: e.dayOfWeek,
          periodId: e.periodId,
          classId: e.classId,
          sectionId: e.sectionId,
          ...(e.subjectId ? { subjectId: e.subjectId } : {}),
          ...(e.teacherId ? { teacherId: e.teacherId } : {}),
          ...(e.roomId ? { roomId: e.roomId } : {}),
        })),
      });
    }

    return { ...newTimetable, copiedEntries: entries.length };
  }

  // ─── Auto-Generate ────────────────────────────────────────────

  /**
   * Greedy auto-fill: for each TeacherAssignment in this academic year,
   * schedule `periodsPerWeek` CLASS-period slots respecting TeacherAvailability
   * and SchedulingRule constraints (MAX_PERIODS_PER_DAY, BLACKOUT_PERIOD).
   * Skips slots that are already occupied.
   */
  async autoGenerate(
    organizationId: string,
    timetableId: string,
    periodsPerWeek: number,
  ) {
    const timetable = await this.getTimetableOrFail(organizationId, timetableId);
    if (timetable.status !== 'DRAFT') {
      throw new BadRequestException('Auto-generate only works on DRAFT timetables');
    }

    // 1. Teacher assignments for this academic year on this campus
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: {
        academicYearId: timetable.academicYearId,
        status: 'ACTIVE',
        teacher: { campusId: timetable.campusId },
      },
      select: { teacherId: true, classId: true, sectionId: true, subjectId: true },
    });

    if (assignments.length === 0) {
      return { created: 0, skipped: 0, assignments: 0 };
    }

    // 2. CLASS periods on this campus (ordered by period number)
    const periods = await this.prisma.period.findMany({
      where: { campusId: timetable.campusId, periodType: 'CLASS' },
      orderBy: { periodNumber: 'asc' },
    });
    if (periods.length === 0) return { created: 0, skipped: 0, assignments: assignments.length };

    // 3. Teacher unavailability map: teacherId → Set<dayOfWeek>
    const availabilityRecords = await this.prisma.teacherAvailability.findMany({
      where: { isAvailable: false, employee: { campusId: timetable.campusId } },
      select: { employeeId: true, dayOfWeek: true },
    });
    const unavailMap = new Map<string, Set<number>>();
    for (const r of availabilityRecords) {
      if (!unavailMap.has(r.employeeId)) unavailMap.set(r.employeeId, new Set());
      unavailMap.get(r.employeeId)!.add(r.dayOfWeek);
    }

    // 4. Scheduling rules
    const rules = await this.prisma.schedulingRule.findMany({
      where: { campusId: timetable.campusId, isActive: true },
    });
    const maxPerDay =
      rules.find((r) => r.ruleType === 'MAX_PERIODS_PER_DAY')?.value ?? 8;
    // Blackout: `${periodId}|${dayOfWeek}` keys for prohibited slots
    const blackout = new Set<string>();
    for (const r of rules.filter((r) => r.ruleType === 'BLACKOUT_PERIOD' && r.periodId)) {
      if (r.dayOfWeek) {
        blackout.add(`${r.periodId}|${r.dayOfWeek}`);
      } else {
        for (let d = 1; d <= 7; d++) blackout.add(`${r.periodId}|${d}`);
      }
    }

    // 5. Existing entries → occupied slot sets + teacher-day load
    const existing = await this.prisma.timetableEntry.findMany({
      where: { timetableId },
      select: { sectionId: true, dayOfWeek: true, periodId: true, teacherId: true },
    });
    const teacherSlots = new Set<string>(); // `${teacherId}|${day}|${periodId}`
    const sectionSlots = new Set<string>(); // `${sectionId}|${day}|${periodId}`
    const teacherDayLoad = new Map<string, number>(); // `${teacherId}|${day}` → count

    for (const e of existing) {
      if (e.teacherId) {
        teacherSlots.add(`${e.teacherId}|${e.dayOfWeek}|${e.periodId}`);
        const k = `${e.teacherId}|${e.dayOfWeek}`;
        teacherDayLoad.set(k, (teacherDayLoad.get(k) ?? 0) + 1);
      }
      sectionSlots.add(`${e.sectionId}|${e.dayOfWeek}|${e.periodId}`);
    }

    const weekDays = [1, 2, 3, 4, 5]; // Mon–Fri
    let created = 0;
    let skipped = 0;

    // 6. Greedy scheduling
    for (const { teacherId, classId, sectionId, subjectId } of assignments) {
      const unavailable = unavailMap.get(teacherId) ?? new Set<number>();
      let scheduled = 0;

      outer: for (const day of weekDays) {
        if (unavailable.has(day)) continue;

        for (const period of periods) {
          if (scheduled >= periodsPerWeek) break outer;
          if (blackout.has(`${period.id}|${day}`)) continue;

          const tSlot = `${teacherId}|${day}|${period.id}`;
          const sSlot = `${sectionId}|${day}|${period.id}`;
          const loadKey = `${teacherId}|${day}`;
          if (teacherSlots.has(tSlot)) continue;
          if (sectionSlots.has(sSlot)) continue;
          if ((teacherDayLoad.get(loadKey) ?? 0) >= maxPerDay) continue;

          try {
            await this.prisma.timetableEntry.create({
              data: {
                timetableId,
                dayOfWeek: day,
                periodId: period.id,
                classId,
                sectionId,
                teacherId,
                ...(subjectId ? { subjectId } : {}),
              },
            });
            teacherSlots.add(tSlot);
            sectionSlots.add(sSlot);
            teacherDayLoad.set(loadKey, (teacherDayLoad.get(loadKey) ?? 0) + 1);
            scheduled++;
            created++;
          } catch {
            // Unique constraint (section already has entry here) — skip
            skipped++;
          }
        }
      }

      // Count unplaced slots as skipped
      if (scheduled < periodsPerWeek) {
        skipped += periodsPerWeek - scheduled;
      }
    }

    return { created, skipped, assignments: assignments.length };
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
