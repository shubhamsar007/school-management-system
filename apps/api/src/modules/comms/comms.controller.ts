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
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { CreatePtmScheduleDto } from './dto/create-ptm-schedule.dto';
import { CreatePtmTeacherSlotDto } from './dto/create-ptm-teacher-slot.dto';
import { CreatePtmBookingDto } from './dto/create-ptm-booking.dto';

@ApiTags('comms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'comms', version: '1' })
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  // ─── Notification Templates ───────────────────────────────────

  @ApiOperation({ summary: 'List notification templates' })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'ACTIVE | INACTIVE' })
  @Get('templates')
  listTemplates(
    @CurrentUser() user: CurrentUserPayload,
    @Query('eventType') eventType?: string,
    @Query('channel') channel?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
  ) {
    return this.commsService.listTemplates(user.organizationId, {
      ...(eventType ? { eventType } : {}),
      ...(channel ? { channel } : {}),
      ...(language ? { language } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Create a notification template' })
  @Post('templates')
  createTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.commsService.createTemplate(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Get a notification template by ID' })
  @Get('templates/:id')
  getTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.getTemplate(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a notification template' })
  @Patch('templates/:id')
  updateTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.commsService.updateTemplate(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Activate a notification template' })
  @Post('templates/:id/activate')
  @HttpCode(HttpStatus.OK)
  activateTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.activateTemplate(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Deactivate a notification template' })
  @Post('templates/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.deactivateTemplate(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete an inactive notification template' })
  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.deleteTemplate(user.organizationId, id);
  }

  // ─── Notification Rules ───────────────────────────────────────

  @ApiOperation({ summary: 'List automation rules' })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @Get('rules')
  listRules(
    @CurrentUser() user: CurrentUserPayload,
    @Query('eventType') eventType?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.commsService.listRules(user.organizationId, {
      ...(eventType ? { eventType } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    });
  }

  @ApiOperation({ summary: 'Create an automation rule' })
  @Post('rules')
  createRule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRuleDto,
  ) {
    return this.commsService.createRule(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Get a single automation rule' })
  @Get('rules/:id')
  getRule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.getRule(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update an automation rule' })
  @Patch('rules/:id')
  updateRule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.commsService.updateRule(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Toggle a rule active / inactive' })
  @Post('rules/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleRule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.toggleRule(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete an automation rule' })
  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.deleteRule(user.organizationId, id);
  }

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
  @ApiQuery({ name: 'category', required: false, description: 'ACADEMIC | ATTENDANCE | EXAMINATION | FINANCE | ADMISSIONS | HR | SUBSTITUTION | ANNOUNCEMENT | PTM | SYSTEM | GENERAL' })
  @Get('notifications')
  findNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('recipientUserId') recipientUserId?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('category') category?: string,
  ) {
    return this.commsService.findNotifications(user.organizationId, {
      ...(recipientUserId ? { recipientUserId } : {}),
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
      ...(category ? { category } : {}),
    });
  }

  @ApiOperation({ summary: 'Get unread notification count for the authenticated user' })
  @Get('notifications/unread-count')
  getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.getUnreadCount(user.organizationId, user.userId);
  }

  @ApiOperation({ summary: 'Get org-wide notification stats for the overview dashboard' })
  @Get('notifications/stats')
  getNotificationStats(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.getNotificationStats(user.organizationId);
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

  // ─── Analytics ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Analytics overview KPIs' })
  @ApiQuery({ name: 'days', required: false, description: '7 | 14 | 30 | 90' })
  @Get('analytics/overview')
  getAnalyticsOverview(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.commsService.getAnalyticsOverview(user.organizationId, days ? Number(days) : 30);
  }

  @ApiOperation({ summary: 'Analytics by delivery channel' })
  @ApiQuery({ name: 'days', required: false })
  @Get('analytics/by-channel')
  getAnalyticsByChannel(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.commsService.getAnalyticsByChannel(user.organizationId, days ? Number(days) : 30);
  }

  @ApiOperation({ summary: 'Analytics by event type (top 15)' })
  @ApiQuery({ name: 'days', required: false })
  @Get('analytics/by-event-type')
  getAnalyticsByEventType(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.commsService.getAnalyticsByEventType(user.organizationId, days ? Number(days) : 30);
  }

  @ApiOperation({ summary: 'Analytics by notification category' })
  @ApiQuery({ name: 'days', required: false })
  @Get('analytics/by-category')
  getAnalyticsByCategory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.commsService.getAnalyticsByCategory(user.organizationId, days ? Number(days) : 30);
  }

  @ApiOperation({ summary: 'Daily notification timeline (sent / failed / read per day)' })
  @ApiQuery({ name: 'days', required: false, description: '7 | 14 | 30' })
  @Get('analytics/timeline')
  getAnalyticsTimeline(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.commsService.getAnalyticsTimeline(user.organizationId, days ? Number(days) : 30);
  }

  @ApiOperation({ summary: 'Failure analysis — top errors, permanent fails, by channel' })
  @ApiQuery({ name: 'days', required: false })
  @Get('analytics/failures')
  getAnalyticsFailures(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
  ) {
    return this.commsService.getAnalyticsFailures(user.organizationId, days ? Number(days) : 30);
  }

  // ─── Preferences ──────────────────────────────────────────────

  @ApiOperation({ summary: "Get the authenticated user's notification preferences" })
  @Get('preferences/me')
  getPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.getPreferences(user.organizationId, user.userId);
  }

  @ApiOperation({ summary: "Update the authenticated user's notification preferences" })
  @Patch('preferences/me')
  updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      whatsappEnabled?: boolean;
      pushEnabled?: boolean;
      language?: string;
      quietHoursEnabled?: boolean;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      quietDays?: string[];
      mutedCategories?: string[];
    },
  ) {
    return this.commsService.updatePreferences(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
  @Post('notifications/mark-all-read')
  @HttpCode(HttpStatus.OK)
  markAllNotificationsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.markAllNotificationsRead(user.organizationId, user.userId);
  }

  // ─── Delivery Logs ────────────────────────────────────────────

  @ApiOperation({ summary: 'List delivery log entries with filtering + pagination' })
  @ApiQuery({ name: 'status', required: false, description: 'QUEUED | SENT | DELIVERED | FAILED | RETRYING | FAILED_PERMANENTLY' })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('deliveries')
  listDeliveries(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commsService.listDeliveries(
      user.organizationId,
      { ...(status ? { status } : {}), ...(channel ? { channel } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) },
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @ApiOperation({ summary: 'Delivery stats (counts by status + success rate)' })
  @Get('deliveries/stats')
  getDeliveryStats(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.getDeliveryStats(user.organizationId);
  }

  @ApiOperation({ summary: 'Retry a single failed delivery immediately' })
  @Post('deliveries/:id/retry')
  @HttpCode(HttpStatus.OK)
  retryDelivery(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.retryDelivery(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Queue all FAILED / FAILED_PERMANENTLY deliveries for immediate retry' })
  @Post('deliveries/retry-failed')
  @HttpCode(HttpStatus.OK)
  bulkRetryFailed(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.bulkRetryFailed(user.organizationId);
  }

  // ─── Provider Config ──────────────────────────────────────────

  @ApiOperation({ summary: 'List provider configurations' })
  @Get('provider-configs')
  listProviderConfigs(@CurrentUser() user: CurrentUserPayload) {
    return this.commsService.listProviderConfigs(user.organizationId);
  }

  @ApiOperation({ summary: 'Enable or disable a provider for a channel' })
  @Post('provider-configs')
  @HttpCode(HttpStatus.OK)
  upsertProviderConfig(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { channel: string; providerName: string; isEnabled: boolean; priority?: number },
  ) {
    return this.commsService.upsertProviderConfig(
      user.organizationId,
      dto.channel,
      dto.providerName,
      dto.isEnabled,
      dto.priority,
    );
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

  // ─── Notification Schedules ───────────────────────────────────

  @ApiOperation({ summary: 'List scheduled notification messages' })
  @ApiQuery({ name: 'recurrence', required: false, description: 'ONCE | DAILY | WEEKLY | MONTHLY' })
  @ApiQuery({ name: 'isActive', required: false })
  @Get('schedules')
  listSchedules(
    @CurrentUser() user: CurrentUserPayload,
    @Query('recurrence') recurrence?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.commsService.listSchedules(user.organizationId, {
      ...(recurrence ? { recurrence } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    });
  }

  @ApiOperation({ summary: 'Create a scheduled notification' })
  @Post('schedules')
  createSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: {
      name: string;
      description?: string;
      recurrence: string;
      scheduledAt?: string;
      cronExpression?: string;
      title: string;
      message: string;
      audienceType: string;
      audienceTarget?: string;
      templateId?: string;
      channels: string[];
      priority?: string;
      category?: string;
    },
  ) {
    return this.commsService.createSchedule(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Get a scheduled notification by ID' })
  @Get('schedules/:id')
  getSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.getSchedule(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a scheduled notification' })
  @Patch('schedules/:id')
  updateSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      recurrence?: string;
      scheduledAt?: string;
      cronExpression?: string;
      title?: string;
      message?: string;
      audienceType?: string;
      audienceTarget?: string;
      templateId?: string;
      channels?: string[];
      priority?: string;
      category?: string;
      isActive?: boolean;
    },
  ) {
    return this.commsService.updateSchedule(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Toggle a scheduled notification active/inactive' })
  @Post('schedules/:id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.toggleSchedule(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a scheduled notification' })
  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.deleteSchedule(user.organizationId, id);
  }

  // ─── Inbound Messages ─────────────────────────────────────────

  @ApiOperation({ summary: 'List inbound messages (two-way channel replies)' })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'RECEIVED | PROCESSED' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('inbound')
  listInboundMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commsService.listInboundMessages(
      user.organizationId,
      { ...(channel ? { channel } : {}), ...(status ? { status } : {}) },
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @ApiOperation({ summary: 'Receive an inbound message (called by provider webhook)' })
  @Post('inbound/receive')
  @HttpCode(HttpStatus.OK)
  receiveInbound(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { channel: string; fromAddress: string; body: string; providerMsgId?: string },
  ) {
    return this.commsService.receiveInbound(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Mark an inbound message as processed' })
  @Post('inbound/:id/process')
  @HttpCode(HttpStatus.OK)
  markInboundProcessed(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.commsService.markInboundProcessed(user.organizationId, id);
  }
}
