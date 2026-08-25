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
import { ExaminationsService } from './examinations.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { CreateGradingSystemDto } from './dto/create-grading-system.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { EnterMarksDto } from './dto/enter-marks.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@ApiTags('examinations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'examinations', version: '1' })
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  // ─── Exam Types ───────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an exam type (e.g. Unit Test, Mid Term)' })
  @Post('exam-types')
  createExamType(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExamTypeDto,
  ) {
    return this.examinationsService.createExamType(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all exam types' })
  @Get('exam-types')
  findExamTypes(@CurrentUser() user: CurrentUserPayload) {
    return this.examinationsService.findExamTypes(user.organizationId);
  }

  @ApiOperation({ summary: 'Update an exam type' })
  @Patch('exam-types/:id')
  updateExamType(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateExamTypeDto,
  ) {
    return this.examinationsService.updateExamType(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete an exam type' })
  @Delete('exam-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExamType(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.deleteExamType(user.organizationId, id);
  }

  // ─── Grading Systems ──────────────────────────────────────────

  @ApiOperation({ summary: 'Create a grading system with grade rules' })
  @Post('grading-systems')
  createGradingSystem(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateGradingSystemDto,
  ) {
    return this.examinationsService.createGradingSystem(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all grading systems' })
  @Get('grading-systems')
  findGradingSystems(@CurrentUser() user: CurrentUserPayload) {
    return this.examinationsService.findGradingSystems(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a grading system by ID' })
  @Get('grading-systems/:id')
  findGradingSystem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.findGradingSystem(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a grading system' })
  @Delete('grading-systems/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteGradingSystem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.deleteGradingSystem(user.organizationId, id);
  }

  // ─── Exams ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an exam' })
  @Post('exams')
  createExam(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExamDto,
  ) {
    return this.examinationsService.createExam(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all exams' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'SCHEDULED | ONGOING | COMPLETED | CANCELLED' })
  @Get('exams')
  findExams(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: string,
  ) {
    return this.examinationsService.findExams(user.organizationId, {
      ...(academicYearId ? { academicYearId } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Get an exam by ID with subjects' })
  @Get('exams/:id')
  findExam(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.findExam(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update exam status (SCHEDULED → ONGOING → COMPLETED)' })
  @Patch('exams/:id/status')
  updateExamStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.examinationsService.updateExamStatus(user.organizationId, id, status);
  }

  @ApiOperation({ summary: 'Delete a scheduled exam' })
  @Delete('exams/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExam(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.deleteExam(user.organizationId, id);
  }

  // ─── Exam Subjects ────────────────────────────────────────────

  @ApiOperation({ summary: 'Add a subject (with schedule and marks config) to an exam' })
  @Post('exams/:id/subjects')
  addExamSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateExamSubjectDto,
  ) {
    return this.examinationsService.addExamSubject(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a subject from a scheduled exam' })
  @Delete('exams/:id/subjects/:examSubjectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExamSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('examSubjectId') examSubjectId: string,
  ) {
    return this.examinationsService.deleteExamSubject(user.organizationId, id, examSubjectId);
  }

  // ─── Marks ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Bulk enter / update marks for an exam subject (upsert)' })
  @Post('exam-subjects/:examSubjectId/marks')
  enterMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examSubjectId') examSubjectId: string,
    @Body() dto: EnterMarksDto,
  ) {
    return this.examinationsService.enterMarks(user.organizationId, examSubjectId, user.userId, dto);
  }

  @ApiOperation({ summary: 'Get all marks for an exam subject' })
  @Get('exam-subjects/:examSubjectId/marks')
  findMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examSubjectId') examSubjectId: string,
  ) {
    return this.examinationsService.findMarks(user.organizationId, examSubjectId);
  }

  // ─── Results ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Compute results for a completed exam (upsert per student)' })
  @Post('exams/:id/results/compute')
  @HttpCode(HttpStatus.OK)
  computeResults(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.computeResults(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Get computed results for an exam' })
  @Get('exams/:id/results')
  findResults(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.findResults(user.organizationId, id);
  }

  // ─── Homework ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a homework assignment' })
  @Post('homework')
  createHomework(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateHomeworkDto,
  ) {
    return this.examinationsService.createHomework(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List homework assignments' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @Get('homework')
  findHomework(
    @CurrentUser() user: CurrentUserPayload,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.examinationsService.findHomework(user.organizationId, {
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(teacherId ? { teacherId } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a homework assignment with all submissions' })
  @Get('homework/:id')
  findHomeworkById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.findHomeworkById(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a homework assignment' })
  @Delete('homework/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHomework(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.examinationsService.deleteHomework(user.organizationId, id);
  }

  // ─── Homework Submissions ─────────────────────────────────────

  @ApiOperation({ summary: 'Submit homework (student)' })
  @Post('homework/:id/submissions/:studentId')
  submitHomework(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.examinationsService.submitHomework(user.organizationId, id, studentId);
  }

  @ApiOperation({ summary: 'Grade a homework submission' })
  @Patch('homework/:id/submissions/:submissionId/grade')
  gradeSubmission(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.examinationsService.gradeSubmission(user.organizationId, id, submissionId, dto);
  }
}
