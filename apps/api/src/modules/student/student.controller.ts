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
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { ListStudentsDto } from './dto/list-students.dto';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'students', version: '1' })
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ─── Students ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new student' })
  @Post()
  createStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentService.createStudent(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List students with filtering, search, and pagination' })
  @Get()
  findStudents(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListStudentsDto,
  ) {
    return this.studentService.findStudents(user.organizationId, query);
  }

  @ApiOperation({ summary: 'Get student KPI stats (total, active, boys, girls, new admissions)' })
  @Get('stats')
  getStudentStats(@CurrentUser() user: CurrentUserPayload) {
    return this.studentService.getStudentStats(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a student by ID' })
  @Get(':id')
  findStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.studentService.findStudent(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a student' })
  @Patch(':id')
  updateStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentService.updateStudent(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a student' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.studentService.deleteStudent(user.organizationId, id);
  }

  // ─── Enrollments ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Enroll a student in a class for an academic year' })
  @Post(':id/enrollments')
  createEnrollment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.studentService.createEnrollment(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'List all enrollments for a student' })
  @Get(':id/enrollments')
  findEnrollments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.studentService.findEnrollments(user.organizationId, id);
  }

  // ─── Guardians ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Add a guardian to a student' })
  @Post(':id/guardians')
  addGuardian(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateGuardianDto,
  ) {
    return this.studentService.addGuardian(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'List all guardians of a student' })
  @Get(':id/guardians')
  findGuardians(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.studentService.findGuardians(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Remove a guardian from a student' })
  @Delete(':id/guardians/:studentGuardianId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeGuardian(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('studentGuardianId') studentGuardianId: string,
  ) {
    return this.studentService.removeGuardian(user.organizationId, id, studentGuardianId);
  }
}
