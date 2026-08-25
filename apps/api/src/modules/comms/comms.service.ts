import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreatePtmScheduleDto } from './dto/create-ptm-schedule.dto';
import { CreatePtmTeacherSlotDto } from './dto/create-ptm-teacher-slot.dto';
import { CreatePtmBookingDto } from './dto/create-ptm-booking.dto';

@Injectable()
export class CommsService {
  constructor(private prisma: PrismaService) {}

  // ─── Announcements ────────────────────────────────────────────

  async createAnnouncement(organizationId: string, createdBy: string, dto: CreateAnnouncementDto) {
    if (dto.campusId) {
      const campus = await this.prisma.campus.findFirst({
        where: { id: dto.campusId, organizationId, deletedAt: null },
      });
      if (!campus) throw new NotFoundException('Campus not found');
    }

    if (dto.targetClassId) {
      const cls = await this.prisma.academicClass.findFirst({
        where: { id: dto.targetClassId, organizationId },
      });
      if (!cls) throw new NotFoundException('Class not found');
    }

    return this.prisma.announcement.create({
      data: {
        organizationId,
        campusId: dto.campusId ?? null,
        title: dto.title,
        content: dto.content,
        audienceType: dto.audienceType,
        targetClassId: dto.targetClassId ?? null,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
        status: 'DRAFT',
      },
    });
  }

  async findAnnouncements(
    organizationId: string,
    filters: { status?: string; audienceType?: string; campusId?: string },
  ) {
    return this.prisma.announcement.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.audienceType ? { audienceType: filters.audienceType } : {}),
        ...(filters.campusId ? { campusId: filters.campusId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAnnouncement(organizationId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, organizationId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async updateAnnouncement(organizationId: string, announcementId: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.findAnnouncement(organizationId, announcementId);

    if (announcement.status === 'PUBLISHED' && dto.status !== 'ARCHIVED') {
      // Allow updating content of published announcements, but not reverting to DRAFT
      if (dto.status === 'DRAFT') {
        throw new BadRequestException('Cannot revert a published announcement to draft');
      }
    }

    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.audienceType !== undefined ? { audienceType: dto.audienceType } : {}),
        ...(dto.targetClassId !== undefined ? { targetClassId: dto.targetClassId ?? null } : {}),
        ...(dto.publishAt !== undefined
          ? { publishAt: dto.publishAt ? new Date(dto.publishAt) : null }
          : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async publishAnnouncement(organizationId: string, announcementId: string) {
    const announcement = await this.findAnnouncement(organizationId, announcementId);

    if (announcement.status === 'PUBLISHED') {
      throw new BadRequestException('Announcement is already published');
    }
    if (announcement.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot publish an archived announcement');
    }

    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: { status: 'PUBLISHED', publishAt: new Date() },
    });
  }

  async deleteAnnouncement(organizationId: string, announcementId: string) {
    const announcement = await this.findAnnouncement(organizationId, announcementId);

    if (announcement.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot delete a published announcement. Archive it first.');
    }

    await this.prisma.announcement.delete({ where: { id: announcementId } });
  }

  // ─── Notifications ────────────────────────────────────────────

  async sendNotification(organizationId: string, dto: SendNotificationDto) {
    return this.prisma.notification.create({
      data: {
        organizationId,
        recipientUserId: dto.recipientUserId,
        eventType: dto.eventType,
        title: dto.title,
        message: dto.message,
        channel: dto.channel,
        status: 'PENDING',
      },
    });
  }

  async findNotifications(
    organizationId: string,
    filters: { recipientUserId?: string; status?: string; channel?: string },
  ) {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
        ...(filters.recipientUserId ? { recipientUserId: filters.recipientUserId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.channel ? { channel: filters.channel } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationRead(organizationId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, organizationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  // ─── PTM Schedules ────────────────────────────────────────────

  async createPtmSchedule(organizationId: string, createdBy: string, dto: CreatePtmScheduleDto) {
    const campus = await this.prisma.campus.findFirst({
      where: { id: dto.campusId, organizationId, deletedAt: null },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    return this.prisma.ptmSchedule.create({
      data: {
        organizationId,
        campusId: dto.campusId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        date: new Date(dto.date),
        slotDurationMinutes: dto.slotDurationMinutes ?? 15,
        createdBy,
        status: 'DRAFT',
      },
      include: { teacherSlots: true, bookings: true },
    });
  }

  async findPtmSchedules(organizationId: string, filters: { campusId?: string; academicYearId?: string }) {
    return this.prisma.ptmSchedule.findMany({
      where: {
        organizationId,
        ...(filters.campusId ? { campusId: filters.campusId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: {
        _count: { select: { teacherSlots: true, bookings: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findPtmSchedule(organizationId: string, scheduleId: string) {
    const schedule = await this.prisma.ptmSchedule.findFirst({
      where: { id: scheduleId, organizationId },
      include: {
        teacherSlots: {
          include: { ptmSchedule: false },
          orderBy: { startTime: 'asc' },
        },
        bookings: {
          orderBy: { slotStart: 'asc' },
        },
      },
    });
    if (!schedule) throw new NotFoundException('PTM schedule not found');
    return schedule;
  }

  async publishPtmSchedule(organizationId: string, scheduleId: string) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException(`PTM schedule is already ${schedule.status.toLowerCase()}`);
    }

    const slotCount = await this.prisma.ptmTeacherSlot.count({
      where: { ptmScheduleId: scheduleId },
    });
    if (slotCount === 0) {
      throw new BadRequestException('Cannot publish a PTM schedule with no teacher slots');
    }

    return this.prisma.ptmSchedule.update({
      where: { id: scheduleId },
      data: { status: 'PUBLISHED' },
    });
  }

  // ─── PTM Teacher Slots ────────────────────────────────────────

  async addTeacherSlot(organizationId: string, scheduleId: string, dto: CreatePtmTeacherSlotDto) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException('Can only add slots to a DRAFT PTM schedule');
    }

    const teacher = await this.prisma.employee.findFirst({
      where: { id: dto.teacherId, organizationId, deletedAt: null },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const startTime = this.parseTime(dto.startTime);
    const endTime = this.parseTime(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.ptmTeacherSlot.create({
      data: {
        ptmScheduleId: scheduleId,
        teacherId: dto.teacherId,
        startTime,
        endTime,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async findTeacherSlots(organizationId: string, scheduleId: string) {
    await this.findPtmSchedule(organizationId, scheduleId);

    return this.prisma.ptmTeacherSlot.findMany({
      where: { ptmScheduleId: scheduleId },
      include: {
        ptmSchedule: false,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async deleteTeacherSlot(organizationId: string, scheduleId: string, slotId: string) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'DRAFT') {
      throw new BadRequestException('Can only remove slots from a DRAFT PTM schedule');
    }

    const slot = await this.prisma.ptmTeacherSlot.findFirst({
      where: { id: slotId, ptmScheduleId: scheduleId },
    });
    if (!slot) throw new NotFoundException('Teacher slot not found');

    await this.prisma.ptmTeacherSlot.delete({ where: { id: slotId } });
  }

  // ─── PTM Bookings ─────────────────────────────────────────────

  async createBooking(organizationId: string, scheduleId: string, dto: CreatePtmBookingDto) {
    const schedule = await this.findPtmSchedule(organizationId, scheduleId);

    if (schedule.status !== 'PUBLISHED') {
      throw new BadRequestException('Bookings can only be made for PUBLISHED PTM schedules');
    }

    const slotStart = new Date(dto.slotStart);
    const slotEnd = new Date(dto.slotEnd);

    // Check for duplicate booking (same teacher + same slot start)
    const duplicate = await this.prisma.ptmBooking.findUnique({
      where: {
        ptmScheduleId_teacherId_slotStart: {
          ptmScheduleId: scheduleId,
          teacherId: dto.teacherId,
          slotStart,
        },
      },
    });
    if (duplicate) {
      throw new ConflictException('This slot is already booked');
    }

    // Check guardian does not have overlapping booking
    const guardianConflict = await this.prisma.ptmBooking.findFirst({
      where: {
        ptmScheduleId: scheduleId,
        guardianId: dto.guardianId,
        status: 'BOOKED',
        slotStart: { lt: slotEnd },
        slotEnd: { gt: slotStart },
      },
    });
    if (guardianConflict) {
      throw new ConflictException('Guardian already has a booking that overlaps this slot');
    }

    return this.prisma.ptmBooking.create({
      data: {
        ptmScheduleId: scheduleId,
        teacherId: dto.teacherId,
        studentId: dto.studentId,
        guardianId: dto.guardianId,
        slotStart,
        slotEnd,
        status: 'BOOKED',
      },
    });
  }

  async findBookings(organizationId: string, scheduleId: string, filters: { teacherId?: string; guardianId?: string }) {
    await this.findPtmSchedule(organizationId, scheduleId);

    return this.prisma.ptmBooking.findMany({
      where: {
        ptmScheduleId: scheduleId,
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
        ...(filters.guardianId ? { guardianId: filters.guardianId } : {}),
      },
      orderBy: { slotStart: 'asc' },
    });
  }

  async cancelBooking(organizationId: string, scheduleId: string, bookingId: string) {
    await this.findPtmSchedule(organizationId, scheduleId);

    const booking = await this.prisma.ptmBooking.findFirst({
      where: { id: bookingId, ptmScheduleId: scheduleId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    return this.prisma.ptmBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────

  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes, 0);
  }
}
