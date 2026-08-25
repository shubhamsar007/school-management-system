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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations', version: '1' })
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  // ─── Organization ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new organization' })
  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
  }

  @ApiOperation({ summary: 'Get own organization' })
  @Get('me')
  getMyOrg(@CurrentUser() user: CurrentUserPayload) {
    return this.organizationService.findOne(user.organizationId);
  }

  @ApiOperation({ summary: 'Get organization by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @ApiOperation({ summary: 'Update own organization' })
  @Patch('me')
  updateMyOrg(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Update organization by ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  // ─── Campuses ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'List campuses for an organization' })
  @Get(':id/campuses')
  findCampuses(@Param('id') id: string) {
    return this.organizationService.findCampuses(id);
  }

  @ApiOperation({ summary: 'Create a campus' })
  @Post(':id/campuses')
  createCampus(@Param('id') id: string, @Body() dto: CreateCampusDto) {
    return this.organizationService.createCampus(id, dto);
  }

  @ApiOperation({ summary: 'Get a campus by ID' })
  @Get(':id/campuses/:campusId')
  findCampus(@Param('id') id: string, @Param('campusId') campusId: string) {
    return this.organizationService.findCampus(id, campusId);
  }

  @ApiOperation({ summary: 'Update a campus' })
  @Patch(':id/campuses/:campusId')
  updateCampus(
    @Param('id') id: string,
    @Param('campusId') campusId: string,
    @Body() dto: UpdateCampusDto,
  ) {
    return this.organizationService.updateCampus(id, campusId, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a campus' })
  @Delete(':id/campuses/:campusId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCampus(@Param('id') id: string, @Param('campusId') campusId: string) {
    return this.organizationService.deleteCampus(id, campusId);
  }

  // ─── Academic Years ───────────────────────────────────────────

  @ApiOperation({ summary: 'List academic years' })
  @Get(':id/academic-years')
  findAcademicYears(@Param('id') id: string) {
    return this.organizationService.findAcademicYears(id);
  }

  @ApiOperation({ summary: 'Create an academic year' })
  @Post(':id/academic-years')
  createAcademicYear(@Param('id') id: string, @Body() dto: CreateAcademicYearDto) {
    return this.organizationService.createAcademicYear(id, dto);
  }

  @ApiOperation({ summary: 'Get an academic year' })
  @Get(':id/academic-years/:yearId')
  findAcademicYear(@Param('id') id: string, @Param('yearId') yearId: string) {
    return this.organizationService.findAcademicYear(id, yearId);
  }

  @ApiOperation({ summary: 'Update an academic year' })
  @Patch(':id/academic-years/:yearId')
  updateAcademicYear(
    @Param('id') id: string,
    @Param('yearId') yearId: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.organizationService.updateAcademicYear(id, yearId, dto);
  }

  // ─── Settings ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get organization settings' })
  @ApiQuery({ name: 'category', required: false })
  @Get(':id/settings')
  getSettings(@Param('id') id: string, @Query('category') category?: string) {
    return this.organizationService.getSettings(id, category);
  }

  @ApiOperation({ summary: 'Upsert a setting' })
  @Post(':id/settings')
  upsertSetting(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { key: string; value: Prisma.InputJsonValue; valueType: string; category: string },
  ) {
    return this.organizationService.upsertSetting(
      id,
      body.key,
      body.value,
      body.valueType,
      body.category,
      user.userId,
    );
  }
}
