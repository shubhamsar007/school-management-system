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

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'attendance', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

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
}
