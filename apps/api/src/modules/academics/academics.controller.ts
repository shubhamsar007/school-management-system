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
import { AcademicsService } from './academics.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateClassSubjectDto } from './dto/create-class-subject.dto';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CreatePromotionRunDto } from './dto/create-promotion-run.dto';
import { UpdatePromotionResultsDto } from './dto/update-promotion-results.dto';

@ApiTags('academics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'academics', version: '1' })
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  // ─── Classes ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a class (e.g. Grade 1)' })
  @Post('classes')
  createClass(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClassDto,
  ) {
    return this.academicsService.createClass(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all classes with their sections' })
  @Get('classes')
  findClasses(@CurrentUser() user: CurrentUserPayload) {
    return this.academicsService.findClasses(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a class by ID' })
  @Get('classes/:id')
  findClass(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.findClass(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a class' })
  @Patch('classes/:id')
  updateClass(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.academicsService.updateClass(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a class' })
  @Delete('classes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteClass(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.deleteClass(user.organizationId, id);
  }

  // ─── Sections ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a section under a class (e.g. Grade 1 - A)' })
  @Post('classes/:classId/sections')
  createSection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.academicsService.createSection(user.organizationId, classId, dto);
  }

  @ApiOperation({ summary: 'List all sections for a class' })
  @Get('classes/:classId/sections')
  findSections(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
  ) {
    return this.academicsService.findSections(user.organizationId, classId);
  }

  @ApiOperation({ summary: 'Update a section' })
  @Patch('classes/:classId/sections/:sectionId')
  updateSection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.academicsService.updateSection(user.organizationId, classId, sectionId, dto);
  }

  @ApiOperation({ summary: 'Delete a section' })
  @Delete('classes/:classId/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.academicsService.deleteSection(user.organizationId, classId, sectionId);
  }

  // ─── Subjects ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a subject (e.g. Mathematics)' })
  @Post('subjects')
  createSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.academicsService.createSubject(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all subjects' })
  @Get('subjects')
  findSubjects(@CurrentUser() user: CurrentUserPayload) {
    return this.academicsService.findSubjects(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a subject by ID' })
  @Get('subjects/:id')
  findSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.findSubject(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a subject' })
  @Patch('subjects/:id')
  updateSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.academicsService.updateSubject(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a subject' })
  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.deleteSubject(user.organizationId, id);
  }

  // ─── Class Subjects ───────────────────────────────────────────

  @ApiOperation({ summary: 'Assign a subject to a class for an academic year' })
  @Post('class-subjects')
  createClassSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClassSubjectDto,
  ) {
    return this.academicsService.createClassSubject(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List class-subject assignments (filter by classId or academicYearId)' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'academicYearId', required: false })
  @Get('class-subjects')
  findClassSubjects(
    @CurrentUser() user: CurrentUserPayload,
    @Query('classId') classId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.academicsService.findClassSubjects(user.organizationId, classId, academicYearId);
  }

  @ApiOperation({ summary: 'Update class-subject configuration (marks, weightage, optional flag)' })
  @Patch('class-subjects/:id')
  updateClassSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClassSubjectDto,
  ) {
    return this.academicsService.updateClassSubject(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a subject from a class' })
  @Delete('class-subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteClassSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.deleteClassSubject(user.organizationId, id);
  }

  // ─── Teacher Assignments (academic read view) ─────────────────

  @ApiOperation({ summary: 'List teacher assignments filtered by year and/or class (academic view)' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'classId', required: false })
  @Get('assignments')
  findTeacherAssignments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.academicsService.findTeacherAssignments(user.organizationId, academicYearId, classId);
  }

  @ApiOperation({ summary: 'Get class teacher coverage (one entry per section per class)' })
  @ApiQuery({ name: 'academicYearId', required: true })
  @Get('class-teachers')
  getClassTeacherCoverage(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.academicsService.getClassTeacherCoverage(user.organizationId, academicYearId);
  }

  // ─── Dashboard Stats ──────────────────────────────────────────

  @ApiOperation({ summary: 'Get academic dashboard stats for the organisation' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @Get('stats')
  getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.academicsService.getStats(user.organizationId, academicYearId);
  }

  // ─── Academic Calendar ────────────────────────────────────────

  @ApiOperation({ summary: 'Create a calendar event' })
  @Post('calendar')
  createCalendarEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.academicsService.createCalendarEvent(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List calendar events (filter by year, month, year)' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'month', required: false, description: '1–12' })
  @ApiQuery({ name: 'year', required: false, description: 'e.g. 2026' })
  @Get('calendar')
  findCalendarEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.academicsService.findCalendarEvents(
      user.organizationId,
      academicYearId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @ApiOperation({ summary: 'Update a calendar event' })
  @Patch('calendar/:id')
  updateCalendarEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.academicsService.updateCalendarEvent(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a calendar event' })
  @Delete('calendar/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCalendarEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.deleteCalendarEvent(user.organizationId, id);
  }

  // ─── Promotion Runs ───────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new promotion run and populate student results' })
  @Post('promotions')
  createPromotionRun(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePromotionRunDto,
  ) {
    return this.academicsService.createPromotionRun(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List promotion runs' })
  @ApiQuery({ name: 'fromYearId', required: false })
  @Get('promotions')
  findPromotionRuns(
    @CurrentUser() user: CurrentUserPayload,
    @Query('fromYearId') fromYearId?: string,
  ) {
    return this.academicsService.findPromotionRuns(user.organizationId, fromYearId);
  }

  @ApiOperation({ summary: 'Get a promotion run with all student results' })
  @Get('promotions/:id')
  findPromotionRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.findPromotionRun(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Bulk-update student outcomes for a promotion run' })
  @Patch('promotions/:id/results')
  updatePromotionResults(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionResultsDto,
  ) {
    return this.academicsService.updatePromotionResults(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Finalize a promotion run — stamps promotionStatus on each enrollment' })
  @Post('promotions/:id/finalize')
  finalizePromotionRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.finalizePromotionRun(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a draft promotion run' })
  @Delete('promotions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePromotionRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.academicsService.deletePromotionRun(user.organizationId, id);
  }
}
