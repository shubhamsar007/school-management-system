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
import { AdmissionsService } from './admissions.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { AddDocumentDto, VerifyDocumentDto } from './dto/add-document.dto';
import { EnrollApplicationDto } from './dto/enroll-application.dto';
import { WithdrawApplicationDto } from './dto/withdraw-application.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/create-interview.dto';

@ApiTags('admissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'admissions', version: '1' })
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  // ─── Stats ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get admissions stats (enquiry + application counts by status)' })
  @Get('stats')
  getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.admissionsService.getStats(user.organizationId);
  }

  // ─── Enquiries ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an admission enquiry' })
  @Post('enquiries')
  createEnquiry(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEnquiryDto,
  ) {
    return this.admissionsService.createEnquiry(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List enquiries (paginated)' })
  @ApiQuery({ name: 'status', required: false, description: 'NEW | CONTACTED | VISITED | APPLIED | CONVERTED | DROPPED' })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search by student name, parent name or phone' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('enquiries')
  findEnquiries(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('campusId') campusId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admissionsService.findEnquiries(user.organizationId, {
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedTo } : {}),
      ...(campusId ? { campusId } : {}),
      ...(search ? { search } : {}),
      ...(page ? { page: parseInt(page, 10) } : {}),
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
    });
  }

  @ApiOperation({ summary: 'Get an enquiry by ID' })
  @Get('enquiries/:id')
  findEnquiry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.findEnquiry(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update an enquiry (status, notes, assignment)' })
  @Patch('enquiries/:id')
  updateEnquiry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEnquiryDto,
  ) {
    return this.admissionsService.updateEnquiry(user.organizationId, id, dto);
  }

  // ─── Applications ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an admission application' })
  @Post('applications')
  createApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.admissionsService.createApplication(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List applications (paginated)' })
  @ApiQuery({ name: 'status', required: false, description: 'DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search by application number' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('applications')
  findApplications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admissionsService.findApplications(user.organizationId, {
      ...(status ? { status } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(classId ? { classId } : {}),
      ...(search ? { search } : {}),
      ...(page ? { page: parseInt(page, 10) } : {}),
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
    });
  }

  @ApiOperation({ summary: 'Get an application by ID with documents' })
  @Get('applications/:id')
  findApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.findApplication(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Submit an application for review' })
  @Post('applications/:id/submit')
  @HttpCode(HttpStatus.OK)
  submitApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.submitApplication(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Move application to UNDER_REVIEW' })
  @Post('applications/:id/review')
  @HttpCode(HttpStatus.OK)
  setUnderReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.setUnderReview(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Approve an application' })
  @Post('applications/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.approveApplication(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Reject an application' })
  @Post('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.admissionsService.rejectApplication(user.organizationId, id, dto);
  }

  // ─── Documents ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Attach a document to an application' })
  @Post('applications/:id/documents')
  addDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AddDocumentDto,
  ) {
    return this.admissionsService.addDocument(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'List documents for an application' })
  @Get('applications/:id/documents')
  findDocuments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.findDocuments(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Mark a document as verified' })
  @Post('applications/:id/documents/:docId/verify')
  @HttpCode(HttpStatus.OK)
  verifyDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.admissionsService.verifyDocument(user.organizationId, id, docId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Mark a document as rejected' })
  @Post('applications/:id/documents/:docId/reject')
  @HttpCode(HttpStatus.OK)
  rejectDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.admissionsService.rejectDocument(user.organizationId, id, docId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Remove a document from an application' })
  @Delete('applications/:id/documents/:docId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('docId') docId: string,
  ) {
    return this.admissionsService.removeDocument(user.organizationId, id, docId);
  }

  @ApiOperation({ summary: 'Enroll an approved application — creates Person + Student + StudentEnrollment' })
  @Post('applications/:id/enroll')
  @HttpCode(HttpStatus.OK)
  enrollApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: EnrollApplicationDto,
  ) {
    return this.admissionsService.enrollApplication(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Withdraw an application' })
  @Post('applications/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  withdrawApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: WithdrawApplicationDto,
  ) {
    return this.admissionsService.withdrawApplication(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Request revision on a submitted/under-review application' })
  @Post('applications/:id/request-revision')
  @HttpCode(HttpStatus.OK)
  requestRevision(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.admissionsService.requestRevision(user.organizationId, id, dto);
  }

  // ─── Follow-ups ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List follow-ups for an enquiry' })
  @Get('enquiries/:id/follow-ups')
  findFollowUps(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.findFollowUps(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Create a follow-up for an enquiry' })
  @Post('enquiries/:id/follow-ups')
  createFollowUp(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.admissionsService.createFollowUp(user.organizationId, id, user.userId, dto);
  }

  @ApiOperation({ summary: 'Update a follow-up' })
  @Patch('enquiries/:id/follow-ups/:followUpId')
  updateFollowUp(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('followUpId') followUpId: string,
    @Body() dto: UpdateFollowUpDto,
  ) {
    return this.admissionsService.updateFollowUp(user.organizationId, id, followUpId, dto);
  }

  @ApiOperation({ summary: 'Delete a follow-up' })
  @Delete('enquiries/:id/follow-ups/:followUpId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFollowUp(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('followUpId') followUpId: string,
  ) {
    return this.admissionsService.deleteFollowUp(user.organizationId, id, followUpId);
  }

  // ─── Interviews ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List interviews for an application' })
  @Get('applications/:id/interviews')
  findInterviews(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.admissionsService.findInterviews(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Schedule an interview for an application' })
  @Post('applications/:id/interviews')
  createInterview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.admissionsService.createInterview(user.organizationId, id, user.userId, dto);
  }

  @ApiOperation({ summary: 'Update an interview' })
  @Patch('applications/:id/interviews/:interviewId')
  updateInterview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('interviewId') interviewId: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.admissionsService.updateInterview(user.organizationId, id, interviewId, dto);
  }

  @ApiOperation({ summary: 'Delete an interview' })
  @Delete('applications/:id/interviews/:interviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteInterview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('interviewId') interviewId: string,
  ) {
    return this.admissionsService.deleteInterview(user.organizationId, id, interviewId);
  }
}
