import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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

@ApiTags('teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'teachers', version: '1' })
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ─── Teachers ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new teacher' })
  @Post()
  createTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTeacherDto,
  ) {
    return this.teacherService.createTeacher(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all teachers in the organisation' })
  @Get()
  findTeachers(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.findTeachers(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a teacher by ID' })
  @Get(':id')
  findTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.findTeacher(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a teacher' })
  @Patch(':id')
  updateTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teacherService.updateTeacher(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a teacher' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teacherService.deleteTeacher(user.organizationId, id);
  }

  // ─── Assignments ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Assign a teacher to a class/section/subject for an academic year' })
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
}
