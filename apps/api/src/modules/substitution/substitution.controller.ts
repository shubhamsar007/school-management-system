import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubstitutionService } from './substitution.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ConfirmAssignmentDto } from './dto/confirm-assignment.dto';
import { ManualSubstitutionDto, DeclineAssignmentDto } from './dto/manual-substitution.dto';
import { CreateManualRequestDto } from './dto/create-manual-request.dto';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';
import { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';
import { CreateUnavailabilityOverrideDto } from './dto/create-unavailability-override.dto';

@ApiTags('substitutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'substitutions', version: '1' })
export class SubstitutionController {
  constructor(private readonly substitutionService: SubstitutionService) {}

  // ─── Trigger ──────────────────────────────────────────────────

  @ApiOperation({
    summary:
      'Trigger substitution requests for an approved leave (runs scoring algorithm)',
  })
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  trigger(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ManualSubstitutionDto,
  ) {
    return this.substitutionService.triggerForLeaveRequest(
      user.organizationId,
      dto.leaveRequestId,
    );
  }

  // ─── Today's Coverage ─────────────────────────────────────────

  @ApiOperation({ summary: "Get today's coverage board and KPIs" })
  @Get('today')
  getTodayCoverage(@CurrentUser() user: CurrentUserPayload) {
    return this.substitutionService.getTodayCoverage(user.organizationId);
  }

  // ─── Substitution Requests ────────────────────────────────────

  @ApiOperation({ summary: 'List substitution requests' })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING | PARTIALLY_ASSIGNED | FULLY_ASSIGNED | CANCELLED' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'leaveRequestId', required: false })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 25)' })
  @Get('requests')
  findRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('leaveRequestId') leaveRequestId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.substitutionService.findRequests(user.organizationId, {
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
      ...(leaveRequestId ? { leaveRequestId } : {}),
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @ApiOperation({ summary: 'Get a substitution request with its assignments and candidate scores' })
  @Get('requests/:id')
  findRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.findRequest(user.organizationId, id);
  }

  @ApiOperation({
    summary:
      'Get ranked candidate list for a substitution request (top qualified + disqualified with reasons)',
  })
  @Get('requests/:id/candidates')
  getRankedCandidates(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.getRankedCandidates(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Cancel a substitution request and all its pending assignments' })
  @Patch('requests/:id/cancel')
  cancelRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.cancelRequest(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Re-run scoring algorithm for a substitution request' })
  @Post('requests/:id/retry')
  @HttpCode(HttpStatus.OK)
  retryScoring(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.retryScoring(user.organizationId, id);
  }

  // ─── Assignments ──────────────────────────────────────────────

  @ApiOperation({ summary: 'List substitution assignments with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('assignments')
  findAssignments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('teacherId') teacherId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.substitutionService.findAssignments(user.organizationId, {
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
      ...(teacherId ? { teacherId } : {}),
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @ApiOperation({
    summary:
      'Confirm a substitute teacher for a specific assignment (human approval step)',
  })
  @Patch('assignments/:id/confirm')
  confirmAssignment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ConfirmAssignmentDto,
  ) {
    return this.substitutionService.confirmAssignment(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
  }

  @ApiOperation({ summary: 'Decline a confirmed assignment (substitute backs out)' })
  @Patch('assignments/:id/decline')
  declineAssignment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: DeclineAssignmentDto,
  ) {
    return this.substitutionService.declineAssignment(
      user.organizationId,
      id,
      dto.reason,
    );
  }

  @ApiOperation({ summary: 'Reassign an assignment to the next best candidate after decline' })
  @Post('assignments/:id/reassign')
  @HttpCode(HttpStatus.OK)
  reassignAfterDecline(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.reassignAfterDecline(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Escalate a substitution request to coordinator/admin' })
  @Post('requests/:id/escalate')
  @HttpCode(HttpStatus.OK)
  escalateRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.escalateRequest(user.organizationId, id);
  }

  // ─── Manual Request ───────────────────────────────────────────

  @ApiOperation({ summary: 'Create a manual substitution request (not tied to leave)' })
  @Post('manual')
  createManualRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateManualRequestDto,
  ) {
    return this.substitutionService.createManualRequest(
      user.organizationId,
      dto,
      user.userId,
    );
  }

  // ─── Policy ──────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get substitution policy for the organization' })
  @Get('policy')
  getPolicy(@CurrentUser() user: CurrentUserPayload) {
    return this.substitutionService.getPolicy(user.organizationId);
  }

  @ApiOperation({ summary: 'Create or update substitution policy' })
  @Patch('policy')
  upsertPolicy(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpsertPolicyDto) {
    return this.substitutionService.upsertPolicy(user.organizationId, dto);
  }

  // ─── Acting teacher ───────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get acting teacher for a timetable entry on a given date' })
  @ApiQuery({ name: 'timetableEntryId', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @Get('acting-teacher')
  getActingTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Query('timetableEntryId') timetableEntryId: string,
    @Query('date') date: string,
  ) {
    return this.substitutionService.getActingTeacher(user.organizationId, timetableEntryId, date);
  }

  // ─── Teacher Availability ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get availability schedule for a teacher (all 7 days)' })
  @Get('availability/:employeeId')
  getTeacherAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.substitutionService.getTeacherAvailability(user.organizationId, employeeId);
  }

  @ApiOperation({ summary: 'Set availability schedule for a teacher' })
  @Put('availability/:employeeId')
  @HttpCode(HttpStatus.OK)
  setTeacherAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
    @Body() body: { slots: Array<{ dayOfWeek: number; isAvailable: boolean; note?: string }> },
  ) {
    return this.substitutionService.setTeacherAvailability(user.organizationId, employeeId, body.slots);
  }

  // ─── Global Optimization ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Run global greedy optimization for all unresolved requests on a date' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD (defaults to today if omitted)' })
  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  optimizeDate(
    @CurrentUser() user: CurrentUserPayload,
    @Query('date') date?: string,
  ) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    return this.substitutionService.optimizeDate(user.organizationId, targetDate!);
  }

  // ─── Substitute Pools ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all substitute pools for the organization' })
  @Get('pools')
  listPools(@CurrentUser() user: CurrentUserPayload) {
    return this.substitutionService.listPools(user.organizationId);
  }

  @ApiOperation({ summary: 'Create a substitute pool' })
  @Post('pools')
  createPool(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreatePoolDto) {
    return this.substitutionService.createPool(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Update a substitute pool' })
  @Patch('pools/:id')
  updatePool(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePoolDto,
  ) {
    return this.substitutionService.updatePool(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a substitute pool' })
  @HttpCode(HttpStatus.OK)
  @Post('pools/:id/delete')
  deletePool(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.substitutionService.deletePool(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Get members of a substitute pool (with employee info)' })
  @Get('pools/:id/members')
  getPoolMembers(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.substitutionService.getPoolMembers(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Add a member to a substitute pool' })
  @Post('pools/:id/members')
  addPoolMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { employeeId: string },
  ) {
    return this.substitutionService.addPoolMember(user.organizationId, id, body.employeeId);
  }

  @ApiOperation({ summary: 'Remove a member from a substitute pool' })
  @HttpCode(HttpStatus.OK)
  @Post('pools/:id/members/:employeeId/remove')
  removePoolMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.substitutionService.removePoolMember(user.organizationId, id, employeeId);
  }

  // ─── Unavailability Overrides ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'List date-range unavailability overrides for a teacher' })
  @Get('unavailability/:employeeId')
  listUnavailabilityOverrides(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.substitutionService.listUnavailabilityOverrides(user.organizationId, employeeId);
  }

  @ApiOperation({ summary: 'Create a date-range unavailability override for a teacher' })
  @Post('unavailability')
  createUnavailabilityOverride(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateUnavailabilityOverrideDto,
  ) {
    return this.substitutionService.createUnavailabilityOverride(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Delete an unavailability override' })
  @HttpCode(HttpStatus.OK)
  @Post('unavailability/:id/delete')
  deleteUnavailabilityOverride(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.deleteUnavailabilityOverride(user.organizationId, id);
  }

  // ─── Audit Log ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get full audit timeline for a substitution request' })
  @Get('requests/:id/audit')
  getAuditLog(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.getAuditLog(user.organizationId, id);
  }
}
