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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';
import { UpdateQualificationDto } from './dto/update-qualification.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';
import { CreateLifecycleEventDto } from './dto/create-lifecycle-event.dto';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { CreateTrainingRecordDto } from './dto/create-training-record.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateBankDetailDto } from './dto/create-bank-detail.dto';
import { UpdateBankDetailDto } from './dto/update-bank-detail.dto';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingTaskDto } from './dto/update-onboarding-task.dto';
import { CreateOffboardingDto } from './dto/create-offboarding.dto';
import { UpdateOffboardingTaskDto } from './dto/update-offboarding-task.dto';

@ApiTags('teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'teachers', version: '1' })
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ─── Stats ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get employee KPI stats for the organisation' })
  @Get('stats')
  getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.getStats(user.organizationId);
  }

  // ─── Departments ──────────────────────────────────────────────

  @ApiOperation({ summary: 'List departments with employee headcounts' })
  @Get('departments')
  getDepartments(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.getDepartments(user.organizationId);
  }

  // ─── Form Options ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Get dropdown options for employee forms (departments, designations, employee types, campuses)' })
  @Get('form-options')
  getFormOptions(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.getFormOptions(user.organizationId);
  }

  // ─── Employees ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new employee' })
  @Post()
  createTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTeacherDto,
  ) {
    return this.teacherService.createTeacher(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List employees with filters and pagination' })
  @Get()
  findTeachers(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListEmployeesDto,
  ) {
    return this.teacherService.findTeachers(user.organizationId, query);
  }

  @ApiOperation({ summary: 'Get a single employee by ID' })
  @Get(':id')
  findTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findTeacher(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update an employee' })
  @Patch(':id')
  updateTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teacherService.updateTeacher(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete an employee' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.deleteTeacher(user.organizationId, id);
  }

  // ─── Assignments ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Assign teacher to class/section/subject' })
  @Post(':id/assignments')
  createAssignment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.teacherService.createAssignment(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'List all assignments for a teacher' })
  @Get(':id/assignments')
  findAssignments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findAssignments(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Remove a teacher assignment' })
  @Delete(':id/assignments/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssignment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.teacherService.deleteAssignment(user.organizationId, id, assignmentId);
  }

  // ─── Qualifications ───────────────────────────────────────────

  @ApiOperation({ summary: 'List qualifications for an employee' })
  @Get(':id/qualifications')
  findQualifications(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findQualifications(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Add a qualification record' })
  @Post(':id/qualifications')
  createQualification(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateQualificationDto,
  ) {
    return this.teacherService.createQualification(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update a qualification record' })
  @Patch(':id/qualifications/:qId')
  updateQualification(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('qId') qId: string,
    @Body() dto: UpdateQualificationDto,
  ) {
    return this.teacherService.updateQualification(user.organizationId, id, qId, dto);
  }

  @ApiOperation({ summary: 'Delete a qualification record' })
  @Delete(':id/qualifications/:qId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQualification(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('qId') qId: string,
  ) {
    return this.teacherService.deleteQualification(user.organizationId, id, qId);
  }

  // ─── Experience ───────────────────────────────────────────────

  @ApiOperation({ summary: 'List experience records for an employee' })
  @Get(':id/experience')
  findExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findExperience(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Add an experience record' })
  @Post(':id/experience')
  createExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.teacherService.createExperience(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update an experience record' })
  @Patch(':id/experience/:expId')
  updateExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('expId') expId: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.teacherService.updateExperience(user.organizationId, id, expId, dto);
  }

  @ApiOperation({ summary: 'Delete an experience record' })
  @Delete(':id/experience/:expId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('expId') expId: string,
  ) {
    return this.teacherService.deleteExperience(user.organizationId, id, expId);
  }

  // ─── Emergency Contacts ───────────────────────────────────────

  @ApiOperation({ summary: 'List emergency contacts for an employee' })
  @Get(':id/emergency-contacts')
  findEmergencyContacts(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findEmergencyContacts(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Add an emergency contact' })
  @Post(':id/emergency-contacts')
  createEmergencyContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.teacherService.createEmergencyContact(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update an emergency contact' })
  @Patch(':id/emergency-contacts/:contactId')
  updateEmergencyContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.teacherService.updateEmergencyContact(user.organizationId, id, contactId, dto);
  }

  @ApiOperation({ summary: 'Delete an emergency contact' })
  @Delete(':id/emergency-contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEmergencyContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('contactId') contactId: string,
  ) {
    return this.teacherService.deleteEmergencyContact(user.organizationId, id, contactId);
  }

  // ─── Lifecycle Events ─────────────────────────────────────────

  @ApiOperation({ summary: 'List lifecycle events for an employee' })
  @Get(':id/lifecycle-events')
  findLifecycleEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findLifecycleEvents(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Record a lifecycle event (status change)' })
  @Post(':id/lifecycle-events')
  createLifecycleEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateLifecycleEventDto,
  ) {
    return this.teacherService.createLifecycleEvent(user.organizationId, id, dto);
  }

  // ─── Performance Reviews ──────────────────────────────────────

  @ApiOperation({ summary: 'List performance reviews for an employee' })
  @Get(':id/performance-reviews')
  findPerformanceReviews(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findPerformanceReviews(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Create a performance review' })
  @Post(':id/performance-reviews')
  createPerformanceReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreatePerformanceReviewDto,
  ) {
    return this.teacherService.createPerformanceReview(user.organizationId, id, dto);
  }

  // ─── Training Records ─────────────────────────────────────────

  @ApiOperation({ summary: 'List training records for an employee' })
  @Get(':id/training-records')
  findTrainingRecords(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findTrainingRecords(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Add a training record' })
  @Post(':id/training-records')
  createTrainingRecord(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateTrainingRecordDto,
  ) {
    return this.teacherService.createTrainingRecord(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a training record' })
  @Delete(':id/training-records/:recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTrainingRecord(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('recordId') recordId: string,
  ) {
    return this.teacherService.deleteTrainingRecord(user.organizationId, id, recordId);
  }

  // ─── Assets ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'List assets issued to an employee' })
  @Get(':id/assets')
  findAssets(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findAssets(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Issue an asset to an employee' })
  @Post(':id/assets')
  createAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateAssetDto,
  ) {
    return this.teacherService.createAsset(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update an asset (e.g. mark as returned)' })
  @Patch(':id/assets/:assetId')
  updateAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.teacherService.updateAsset(user.organizationId, id, assetId, dto);
  }

  // ─── Bank Details ─────────────────────────────────────────────

  @ApiOperation({ summary: 'List bank details for an employee' })
  @Get(':id/bank-details')
  findBankDetails(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findBankDetails(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Add a bank detail record' })
  @Post(':id/bank-details')
  createBankDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateBankDetailDto,
  ) {
    return this.teacherService.createBankDetail(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update a bank detail record' })
  @Patch(':id/bank-details/:detailId')
  updateBankDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('detailId') detailId: string,
    @Body() dto: UpdateBankDetailDto,
  ) {
    return this.teacherService.updateBankDetail(user.organizationId, id, detailId, dto);
  }

  @ApiOperation({ summary: 'Delete a bank detail record' })
  @Delete(':id/bank-details/:detailId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBankDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('detailId') detailId: string,
  ) {
    return this.teacherService.deleteBankDetail(user.organizationId, id, detailId);
  }

  // ─── Onboarding ───────────────────────────────────────────────

  @ApiOperation({ summary: 'Get onboarding checklist for an employee' })
  @Get(':id/onboarding')
  findOnboarding(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findOnboarding(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Initiate onboarding for an employee' })
  @Post(':id/onboarding')
  createOnboarding(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateOnboardingDto,
  ) {
    return this.teacherService.createOnboarding(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update an onboarding task (mark complete/incomplete)' })
  @Patch(':id/onboarding/tasks/:taskId')
  updateOnboardingTask(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateOnboardingTaskDto,
  ) {
    return this.teacherService.updateOnboardingTask(user.organizationId, id, taskId, dto);
  }

  // ─── Offboarding ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Get offboarding checklist for an employee' })
  @Get(':id/offboarding')
  findOffboarding(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findOffboarding(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Initiate offboarding for an employee' })
  @Post(':id/offboarding')
  createOffboarding(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateOffboardingDto,
  ) {
    return this.teacherService.createOffboarding(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update an offboarding task (mark complete/incomplete)' })
  @Patch(':id/offboarding/tasks/:taskId')
  updateOffboardingTask(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateOffboardingTaskDto,
  ) {
    return this.teacherService.updateOffboardingTask(user.organizationId, id, taskId, dto);
  }
}
