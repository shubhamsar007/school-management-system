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
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { MarkStudentAttendanceDto } from './dto/mark-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { MarkEmployeeAttendanceDto } from './dto/mark-employee-attendance.dto';
import { UpdateEmployeeAttendanceDto } from './dto/update-employee-attendance.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/review-leave-request.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { RejectCorrectionDto } from './dto/reject-correction.dto';
import { AllocateLeaveBalancesDto } from './dto/allocate-leave-balances.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Overview / Roster / Leave Balances ─────────────────────

  @ApiOperation({ summary: 'Get attendance overview for a date (students + staff KPIs + alerts)' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  @Get('overview')
  getOverview(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getOverview(user.organizationId, campusId, date);
  }

  @ApiOperation({ summary: 'Get student roster with attendance status for a section and date' })
  @ApiQuery({ name: 'sectionId', required: true })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  @Get('roster')
  getAttendanceRoster(
    @CurrentUser() user: CurrentUserPayload,
    @Query('sectionId') sectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getRoster(user.organizationId, sectionId, academicYearId, date);
  }

  @ApiOperation({ summary: 'Allocate annual leave balances for all active employees' })
  @Post('leave-balances/allocate')
  @HttpCode(HttpStatus.OK)
  allocateLeaveBalances(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AllocateLeaveBalancesDto,
  ) {
    return this.attendanceService.allocateLeaveBalances(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Get leave balances for an employee' })
  @ApiQuery({ name: 'employeeId', required: true })
  @ApiQuery({ name: 'academicYearId', required: false })
  @Get('leave-balances')
  getLeaveBalances(
    @CurrentUser() user: CurrentUserPayload,
    @Query('employeeId') employeeId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.attendanceService.getLeaveBalances(user.organizationId, employeeId, academicYearId);
  }

  // ─── Health Alerts ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Get student attendance health alerts' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'academicYearId', required: false })
  @Get('health/students')
  getStudentHealthAlerts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.attendanceService.getStudentHealthAlerts(user.organizationId, campusId, academicYearId);
  }

  @ApiOperation({ summary: 'Get staff attendance health alerts' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  @Get('health/staff')
  getStaffHealthAlerts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getStaffHealthAlerts(user.organizationId, campusId, date);
  }

  // ─── Student Attendance ───────────────────────────────────────

  @ApiOperation({ summary: 'Mark attendance for one or more students (upsert by date)' })
  @Post('students')
  markStudentAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: MarkStudentAttendanceDto,
  ) {
    return this.attendanceService.markStudentAttendance(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Query student attendance records' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'enrollmentId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'Single date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'from', required: false, description: 'Start of date range' })
  @ApiQuery({ name: 'to', required: false, description: 'End of date range' })
  @Get('students')
  findStudentAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query('studentId') studentId?: string,
    @Query('enrollmentId') enrollmentId?: string,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.findStudentAttendance(user.organizationId, {
      ...(studentId ? { studentId } : {}),
      ...(enrollmentId ? { enrollmentId } : {}),
      ...(date ? { date } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
  }

  @ApiOperation({ summary: 'Update a student attendance record' })
  @Patch('students/:id')
  updateStudentAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentAttendanceDto,
  ) {
    return this.attendanceService.updateStudentAttendance(user.organizationId, id, user.userId, dto);
  }

  // ─── Employee Attendance ──────────────────────────────────────

  @ApiOperation({ summary: 'Mark attendance for an employee (upsert by date)' })
  @Post('employees')
  markEmployeeAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: MarkEmployeeAttendanceDto,
  ) {
    return this.attendanceService.markEmployeeAttendance(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Query employee attendance records' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @Get('employees')
  findEmployeeAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query('employeeId') employeeId?: string,
    @Query('campusId') campusId?: string,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.findEmployeeAttendance(user.organizationId, {
      ...(employeeId ? { employeeId } : {}),
      ...(campusId ? { campusId } : {}),
      ...(date ? { date } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
  }

  @ApiOperation({ summary: 'Update an employee attendance record' })
  @Patch('employees/:id')
  updateEmployeeAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeAttendanceDto,
  ) {
    return this.attendanceService.updateEmployeeAttendance(user.organizationId, id, user.userId, dto);
  }

  // ─── Leave Types ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a leave type' })
  @Post('leave-types')
  createLeaveType(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateLeaveTypeDto,
  ) {
    return this.attendanceService.createLeaveType(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all leave types' })
  @Get('leave-types')
  findLeaveTypes(@CurrentUser() user: CurrentUserPayload) {
    return this.attendanceService.findLeaveTypes(user.organizationId);
  }

  @ApiOperation({ summary: 'Update a leave type' })
  @Patch('leave-types/:id')
  updateLeaveType(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    return this.attendanceService.updateLeaveType(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a leave type' })
  @Delete('leave-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLeaveType(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.deleteLeaveType(user.organizationId, id);
  }

  // ─── Leave Requests ───────────────────────────────────────────

  @ApiOperation({ summary: 'Submit a leave request for an employee' })
  @Post('leave-requests/:employeeId')
  createLeaveRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.attendanceService.createLeaveRequest(user.organizationId, employeeId, dto);
  }

  @ApiOperation({ summary: 'List leave requests (filter by employeeId or status)' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING | APPROVED | REJECTED | CANCELLED' })
  @Get('leave-requests')
  findLeaveRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.attendanceService.findLeaveRequests(user.organizationId, {
      ...(employeeId ? { employeeId } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a leave request by ID' })
  @Get('leave-requests/:id')
  findLeaveRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.findLeaveRequest(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Approve a leave request' })
  @Post('leave-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveLeaveRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.approveLeaveRequest(user.organizationId, id, user.userId);
  }

  @ApiOperation({ summary: 'Reject a leave request' })
  @Post('leave-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectLeaveRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
  ) {
    return this.attendanceService.rejectLeaveRequest(user.organizationId, id, user.userId, dto);
  }

  @ApiOperation({ summary: 'Cancel a leave request (employee cancels own request)' })
  @Post('leave-requests/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelLeaveRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('employeeId') employeeId: string,
  ) {
    return this.attendanceService.cancelLeaveRequest(user.organizationId, id, employeeId);
  }

  @ApiOperation({ summary: 'Bulk approve multiple leave requests' })
  @Post('leave-requests/bulk-approve')
  @HttpCode(HttpStatus.OK)
  bulkApproveLeaveRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { ids: string[]; },
  ) {
    return this.attendanceService.bulkApproveLeaveRequests(
      user.organizationId,
      body.ids,
      user.userId,
    );
  }

  @ApiOperation({ summary: 'Bulk reject multiple leave requests' })
  @Post('leave-requests/bulk-reject')
  @HttpCode(HttpStatus.OK)
  bulkRejectLeaveRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { ids: string[]; rejectionReason?: string },
  ) {
    return this.attendanceService.bulkRejectLeaveRequests(
      user.organizationId,
      body.ids,
      user.userId,
      body.rejectionReason,
    );
  }

  @ApiOperation({ summary: 'Cancel an approved leave request and restore balance (admin action)' })
  @Post('leave-requests/:id/cancel-approved')
  @HttpCode(HttpStatus.OK)
  cancelApprovedLeaveRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.cancelApprovedLeaveRequest(
      user.organizationId,
      id,
      user.userId,
    );
  }

  @ApiOperation({ summary: 'Team leave availability for a date range (max 60 days)' })
  @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
  @Get('leave/team-availability')
  getTeamAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.attendanceService.getTeamAvailability(user.organizationId, from, to);
  }

  // ─── Sessions ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create or get existing attendance session for a section+date' })
  @Post('sessions')
  createSession(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSessionDto,
  ) {
    return this.attendanceService.createSession(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'List attendance sessions with optional filters' })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'status', required: false, description: 'OPEN | SUBMITTED | LOCKED' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @Get('sessions')
  findSessions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('sectionId') sectionId?: string,
    @Query('campusId') campusId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.findSessions(user.organizationId, {
      ...(sectionId ? { sectionId } : {}),
      ...(campusId ? { campusId } : {}),
      ...(date ? { date } : {}),
      ...(status ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a single attendance session by ID' })
  @Get('sessions/:id')
  findSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.findSession(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Submit an attendance session' })
  @Post('sessions/:id/submit')
  @HttpCode(HttpStatus.OK)
  submitSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.submitSession(user.organizationId, id, user.userId);
  }

  @ApiOperation({ summary: 'Lock an attendance session' })
  @Post('sessions/:id/lock')
  @HttpCode(HttpStatus.OK)
  lockSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.lockSession(user.organizationId, id, user.userId);
  }

  // ─── Corrections ───────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an attendance correction request' })
  @Post('corrections')
  createCorrection(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCorrectionDto,
  ) {
    return this.attendanceService.createCorrection(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'List attendance correction requests' })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING | APPROVED | REJECTED' })
  @ApiQuery({ name: 'attendanceType', required: false, description: 'STUDENT | EMPLOYEE' })
  @ApiQuery({ name: 'sessionId', required: false })
  @Get('corrections')
  findCorrections(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('attendanceType') attendanceType?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.attendanceService.findCorrections(user.organizationId, {
      ...(status ? { status } : {}),
      ...(attendanceType ? { attendanceType } : {}),
      ...(sessionId ? { sessionId } : {}),
    });
  }

  @ApiOperation({ summary: 'Approve a correction request and update attendance' })
  @Post('corrections/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveCorrection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.approveCorrection(user.organizationId, id, user.userId);
  }

  @ApiOperation({ summary: 'Reject a correction request' })
  @Post('corrections/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectCorrection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RejectCorrectionDto,
  ) {
    return this.attendanceService.rejectCorrection(
      user.organizationId,
      id,
      user.userId,
      dto.rejectionReason,
    );
  }

  // ─── Analytics ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get monthly attendance history for a student' })
  @ApiQuery({ name: 'year', required: true })
  @ApiQuery({ name: 'month', required: true, description: '1–12' })
  @Get('analytics/student/:studentId')
  getStudentHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.attendanceService.getStudentHistory(
      user.organizationId,
      studentId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @ApiOperation({ summary: 'Get attendance summary for all students in a section' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @Get('analytics/sections/:sectionId')
  getSectionSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sectionId') sectionId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getSectionSummary(
      user.organizationId,
      sectionId,
      academicYearId,
      from,
      to,
    );
  }

  @ApiOperation({ summary: 'Get attendance summary per class/section for current month' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @ApiQuery({ name: 'campusId', required: false })
  @Get('analytics/classes')
  getClassSummaries(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId: string,
    @Query('campusId') campusId?: string,
  ) {
    return this.attendanceService.getClassSummaries(user.organizationId, academicYearId, campusId);
  }

  @ApiOperation({ summary: 'Get attendance trend data for past N months' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months (default 6)' })
  @Get('analytics/trends')
  getAttendanceTrends(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId?: string,
    @Query('months') months?: string,
  ) {
    return this.attendanceService.getAttendanceTrends(
      user.organizationId,
      campusId,
      months ? parseInt(months, 10) : 6,
    );
  }
}
