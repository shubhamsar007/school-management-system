import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommsService } from './comms.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreatePtmScheduleDto } from './dto/create-ptm-schedule.dto';
import { CreatePtmTeacherSlotDto } from './dto/create-ptm-teacher-slot.dto';
import { CreatePtmBookingDto } from './dto/create-ptm-booking.dto';

@ApiTags('comms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'comms', version: '1' })
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  // ─── Announcements ────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an announcement (starts as DRAFT)' })
  @Post('announcements')
  createAnnouncement(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.commsService.createAnnouncement(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'List announcements' })
  @ApiQuery({ name: 'status', required: false, description: 'DRAFT | PUBLISHED | ARCHIVED' })
  @ApiQuery({ name: 'audienceType', required: false })
  @ApiQuery({ name: 'campusId', required: false })
  @Get('announcements')
  findAnnouncements(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('audienceType') audienceType?: string,
    @Query('campusId') campusId?: string,
  ) {
    return this.commsService.findAnnouncements(user.organizationId, {
      ...(status ? { status } : {}),
      ...(audienceType ? { audienceType } : {}),
      ...(campusId ? { campusId } : {}),
    });
  }

  @ApiOperation({ summary: 'Get an announcement by ID' })
  @Get('announcements/:id')
  findAnnouncement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.findAnnouncement(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update an announcement' })
  @Patch('announcements/:id')
  updateAnnouncement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.commsService.updateAnnouncement(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Publish an announcement immediately' })
  @Post('announcements/:id/publish')
  @HttpCode(HttpStatus.OK)
  publishAnnouncement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.publishAnnouncement(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a draft announcement' })
  @Delete('announcements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAnnouncement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.deleteAnnouncement(user.organizationId, id);
  }

  // ─── Notifications ────────────────────────────────────────────

  @ApiOperation({ summary: 'Send a notification to a user' })
  @Post('notifications')
  sendNotification(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendNotificationDto,
  ) {
    return this.commsService.sendNotification(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Query notifications' })
  @ApiQuery({ name: 'recipientUserId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING | SENT | READ | FAILED' })
  @ApiQuery({ name: 'channel', required: false })
  @Get('notifications')
  findNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('recipientUserId') recipientUserId?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
  ) {
    return this.commsService.findNotifications(user.organizationId, {
      ...(recipientUserId ? { recipientUserId } : {}),
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
    });
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  markNotificationRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.markNotificationRead(user.organizationId, id);
  }

  // ─── PTM Schedules ────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a PTM schedule' })
  @Post('ptm-schedules')
  createPtmSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePtmScheduleDto,
  ) {
    return this.commsService.createPtmSchedule(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'List PTM schedules' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'academicYearId', required: false })
  @Get('ptm-schedules')
  findPtmSchedules(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.commsService.findPtmSchedules(user.organizationId, {
      ...(campusId ? { campusId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a PTM schedule with slots and bookings' })
  @Get('ptm-schedules/:id')
  findPtmSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.findPtmSchedule(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Publish a PTM schedule (makes it bookable)' })
  @Post('ptm-schedules/:id/publish')
  @HttpCode(HttpStatus.OK)
  publishPtmSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.publishPtmSchedule(user.organizationId, id);
  }

  // ─── PTM Teacher Slots ────────────────────────────────────────

  @ApiOperation({ summary: 'Add a teacher availability slot to a PTM schedule' })
  @Post('ptm-schedules/:id/teacher-slots')
  addTeacherSlot(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreatePtmTeacherSlotDto,
  ) {
    return this.commsService.addTeacherSlot(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'List teacher slots for a PTM schedule' })
  @Get('ptm-schedules/:id/teacher-slots')
  findTeacherSlots(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.findTeacherSlots(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Remove a teacher slot from a PTM schedule' })
  @Delete('ptm-schedules/:id/teacher-slots/:slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTeacherSlot(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('slotId') slotId: string,
  ) {
    return this.commsService.deleteTeacherSlot(user.organizationId, id, slotId);
  }

  // ─── PTM Bookings ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Book a PTM slot for a guardian and student' })
  @Post('ptm-schedules/:id/bookings')
  createBooking(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreatePtmBookingDto,
  ) {
    return this.commsService.createBooking(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'List bookings for a PTM schedule' })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'guardianId', required: false })
  @Get('ptm-schedules/:id/bookings')
  findBookings(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('teacherId') teacherId?: string,
    @Query('guardianId') guardianId?: string,
  ) {
    return this.commsService.findBookings(user.organizationId, id, {
      ...(teacherId ? { teacherId } : {}),
      ...(guardianId ? { guardianId } : {}),
    });
  }

  @ApiOperation({ summary: 'Cancel a PTM booking' })
  @Post('ptm-schedules/:id/bookings/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.commsService.cancelBooking(user.organizationId, id, bookingId);
  }
}
