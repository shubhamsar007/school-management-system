import {
  Controller,
  Get,
  Post,
  Put,
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
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { CreateTimetableEntryDto, UpdateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { MoveTimetableEntryDto } from './dto/move-timetable-entry.dto';
import { SetTeacherAvailabilityDto } from './dto/set-teacher-availability.dto';
import { CreateSchedulingRuleDto } from './dto/create-scheduling-rule.dto';

@ApiTags('timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'timetable', version: '1' })
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // ─── Buildings ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a building on a campus' })
  @Post('buildings')
  createBuilding(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.timetableService.createBuilding(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List buildings for a campus' })
  @ApiQuery({ name: 'campusId', required: true })
  @Get('buildings')
  findBuildings(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId: string,
  ) {
    return this.timetableService.findBuildings(user.organizationId, campusId);
  }

  @ApiOperation({ summary: 'Update a building' })
  @Patch('buildings/:id')
  updateBuilding(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.timetableService.updateBuilding(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a building (blocked if it has rooms)' })
  @Delete('buildings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBuilding(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteBuilding(user.organizationId, id);
  }

  // ─── Rooms ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a room on a campus' })
  @Post('rooms')
  createRoom(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRoomDto,
  ) {
    return this.timetableService.createRoom(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List rooms for a campus' })
  @ApiQuery({ name: 'campusId', required: true })
  @ApiQuery({ name: 'buildingId', required: false })
  @ApiQuery({ name: 'roomType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Get('rooms')
  findRooms(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId: string,
    @Query('buildingId') buildingId?: string,
    @Query('roomType') roomType?: string,
    @Query('status') status?: string,
  ) {
    return this.timetableService.findRooms(user.organizationId, campusId, {
      ...(buildingId ? { buildingId } : {}),
      ...(roomType ? { roomType } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Update a room' })
  @Patch('rooms/:id')
  updateRoom(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateRoomDto,
  ) {
    return this.timetableService.updateRoom(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a room (blocked if assigned to timetable entries)' })
  @Delete('rooms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRoom(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteRoom(user.organizationId, id);
  }

  // ─── Periods ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a period slot for a campus' })
  @Post('periods')
  createPeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePeriodDto,
  ) {
    return this.timetableService.createPeriod(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all periods for a campus, ordered by periodNumber' })
  @ApiQuery({ name: 'campusId', required: true })
  @Get('periods')
  findPeriods(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId: string,
  ) {
    return this.timetableService.findPeriods(user.organizationId, campusId);
  }

  @ApiOperation({ summary: 'Update a period' })
  @Patch('periods/:id')
  updatePeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreatePeriodDto,
  ) {
    return this.timetableService.updatePeriod(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a period (blocked if used in timetable entries)' })
  @Delete('periods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.deletePeriod(user.organizationId, id);
  }

  // ─── Timetables ───────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new timetable (starts as DRAFT)' })
  @Post()
  createTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTimetableDto,
  ) {
    return this.timetableService.createTimetable(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List timetables' })
  @ApiQuery({ name: 'campusId', required: false })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'DRAFT | ACTIVE | ARCHIVED' })
  @Get()
  findTimetables(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: string,
  ) {
    return this.timetableService.findTimetables(user.organizationId, {
      ...(campusId ? { campusId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a full timetable with all entries' })
  @Get(':id')
  findTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.findTimetable(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Activate a timetable (DRAFT → ACTIVE, archives previous active)' })
  @Patch(':id/activate')
  activateTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.activateTimetable(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Archive a timetable' })
  @Patch(':id/archive')
  archiveTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.archiveTimetable(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Detect teacher/room conflicts across all entries in a timetable' })
  @Get(':id/conflicts')
  getConflicts(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.getConflicts(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a DRAFT timetable' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTimetable(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteTimetable(user.organizationId, id);
  }

  // ─── Timetable Entries ────────────────────────────────────────

  @ApiOperation({ summary: 'Add an entry to a DRAFT timetable (with conflict detection)' })
  @Post(':id/entries')
  addEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateTimetableEntryDto,
  ) {
    return this.timetableService.addEntry(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Update an entry (teacher / room / subject)' })
  @Patch(':id/entries/:entryId')
  updateEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateTimetableEntryDto,
  ) {
    return this.timetableService.updateEntry(user.organizationId, id, entryId, dto);
  }

  @ApiOperation({ summary: 'Remove an entry from a DRAFT timetable' })
  @Delete(':id/entries/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ) {
    return this.timetableService.deleteEntry(user.organizationId, id, entryId);
  }

  @ApiOperation({ summary: 'Move an entry to a different day/period (DRAFT only, re-checks conflicts)' })
  @Patch(':id/entries/:entryId/move')
  moveEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: MoveTimetableEntryDto,
  ) {
    return this.timetableService.moveEntry(user.organizationId, id, entryId, dto);
  }

  // ─── Views ────────────────────────────────────────────────────

  @ApiOperation({ summary: "Get a section's weekly schedule grouped by day" })
  @ApiQuery({ name: 'timetableId', required: false, description: 'Defaults to active timetable' })
  @Get('views/section/:sectionId')
  getSectionSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sectionId') sectionId: string,
    @Query('timetableId') timetableId?: string,
  ) {
    return this.timetableService.getSectionSchedule(user.organizationId, sectionId, timetableId);
  }

  // ─── Teacher Availability ─────────────────────────────────────

  @ApiOperation({ summary: "Get a teacher's weekly availability (7 days)" })
  @ApiQuery({ name: 'teacherId', required: true })
  @Get('teacher-availability')
  getTeacherAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Query('teacherId') teacherId: string,
  ) {
    return this.timetableService.getTeacherAvailability(user.organizationId, teacherId);
  }

  @ApiOperation({ summary: "Bulk-set a teacher's weekly availability" })
  @Put('teacher-availability/:teacherId')
  setTeacherAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Param('teacherId') teacherId: string,
    @Body() dto: SetTeacherAvailabilityDto,
  ) {
    return this.timetableService.setTeacherAvailability(user.organizationId, teacherId, dto);
  }

  // ─── Scheduling Rules ─────────────────────────────────────────

  @ApiOperation({ summary: 'List scheduling rules for a campus' })
  @ApiQuery({ name: 'campusId', required: true })
  @Get('rules')
  getSchedulingRules(
    @CurrentUser() user: CurrentUserPayload,
    @Query('campusId') campusId: string,
  ) {
    return this.timetableService.getSchedulingRules(user.organizationId, campusId);
  }

  @ApiOperation({ summary: 'Create a scheduling rule' })
  @Post('rules')
  createSchedulingRule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSchedulingRuleDto,
  ) {
    return this.timetableService.createSchedulingRule(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Update a scheduling rule' })
  @Patch('rules/:id')
  updateSchedulingRule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateSchedulingRuleDto,
  ) {
    return this.timetableService.updateSchedulingRule(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a scheduling rule' })
  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSchedulingRule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.timetableService.deleteSchedulingRule(user.organizationId, id);
  }

  // ─── Substitute Suggestions ───────────────────────────────────

  @ApiOperation({ summary: 'Get ranked substitute suggestions for a teacher absence' })
  @ApiQuery({ name: 'timetableId', required: true })
  @ApiQuery({ name: 'teacherId', required: true })
  @ApiQuery({ name: 'dayOfWeek', required: true, description: '1=Mon … 7=Sun' })
  @ApiQuery({ name: 'date', required: false, description: 'ISO date (YYYY-MM-DD) to check approved leaves' })
  @Get('substitute/suggest')
  suggestSubstitutes(
    @CurrentUser() user: CurrentUserPayload,
    @Query('timetableId') timetableId: string,
    @Query('teacherId') teacherId: string,
    @Query('dayOfWeek') dayOfWeek: string,
    @Query('date') date?: string,
  ) {
    return this.timetableService.suggestSubstitutes(
      user.organizationId,
      timetableId,
      teacherId,
      parseInt(dayOfWeek, 10),
      date,
    );
  }

  // ─── Views ────────────────────────────────────────────────────

  @ApiOperation({ summary: "Get a room's weekly schedule grouped by day" })
  @ApiQuery({ name: 'timetableId', required: false, description: 'Defaults to active timetable' })
  @Get('views/room/:roomId')
  getRoomSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roomId') roomId: string,
    @Query('timetableId') timetableId?: string,
  ) {
    return this.timetableService.getRoomSchedule(user.organizationId, roomId, timetableId);
  }

  @ApiOperation({ summary: "Get a teacher's weekly schedule grouped by day" })
  @ApiQuery({ name: 'timetableId', required: false, description: 'Defaults to active timetable' })
  @Get('views/teacher/:teacherId')
  getTeacherSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('teacherId') teacherId: string,
    @Query('timetableId') timetableId?: string,
  ) {
    return this.timetableService.getTeacherSchedule(user.organizationId, teacherId, timetableId);
  }
}
