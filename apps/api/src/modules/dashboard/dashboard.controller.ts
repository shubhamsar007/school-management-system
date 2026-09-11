import { Controller, Get, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Aggregated overview — students, staff, attendance, admissions, pending actions' })
  @Get('overview')
  getOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getOverview(user.organizationId);
  }

  @ApiOperation({ summary: 'Monthly attendance trend — students & staff % for last N months' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months (default: 6)' })
  @Get('attendance-trend')
  getAttendanceTrend(
    @CurrentUser() user: CurrentUserPayload,
    @Query('months') months?: string,
  ) {
    return this.dashboardService.getAttendanceTrend(
      user.organizationId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @ApiOperation({ summary: 'Monthly fee collection summary + totals' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months (default: 6)' })
  @Get('finance-summary')
  getFinanceSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('months') months?: string,
  ) {
    return this.dashboardService.getFinanceSummary(
      user.organizationId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @ApiOperation({ summary: 'Enrollment by class — enrolled count vs section capacity' })
  @Get('enrollment')
  getEnrollment(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getEnrollment(user.organizationId);
  }

  @ApiOperation({ summary: 'Active exam progress — marks completion % and pending verifications' })
  @Get('exam-progress')
  getExamProgress(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getExamProgress(user.organizationId);
  }

  @ApiOperation({ summary: 'Academic performance — avg scores by subject and class from latest completed exam' })
  @Get('academic-performance')
  getAcademicPerformance(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getAcademicPerformance(user.organizationId);
  }

  @ApiOperation({ summary: 'At-risk students — low attendance, declining marks, overdue fees' })
  @Get('at-risk')
  getAtRisk(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getAtRisk(user.organizationId);
  }

  @ApiOperation({ summary: "Today's substitution KPIs + 7-day coverage trend" })
  @Get('substitution-summary')
  getSubstitutionSummary(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getSubstitutionSummary(user.organizationId);
  }

  @ApiOperation({ summary: 'Staff HR — headline stats, department breakdown, employment type, joining trend, alerts' })
  @Get('staff-hr')
  getStaffHR(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getStaffHR(user.organizationId);
  }

  @ApiOperation({ summary: 'Leave trends — monthly approved/pending counts and breakdown by type' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months (default: 6)' })
  @Get('leave-trends')
  getLeaveTrends(
    @CurrentUser() user: CurrentUserPayload,
    @Query('months') months?: string,
  ) {
    return this.dashboardService.getLeaveTrends(
      user.organizationId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @ApiOperation({ summary: 'Year-over-year comparison — enrollment, fees, exams, staff across academic years' })
  @Get('yoy')
  getYoY(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getYoY(user.organizationId);
  }

  @ApiOperation({ summary: 'Dashboard targets — configured goals for key metrics' })
  @Get('targets')
  getTargets(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getTargets(user.organizationId);
  }

  @ApiOperation({ summary: 'Update dashboard targets' })
  @Patch('targets')
  updateTargets(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: Record<string, number>,
  ) {
    return this.dashboardService.updateTargets(user.organizationId, body);
  }

  @ApiOperation({ summary: 'Monthly payroll cost summary for current financial year' })
  @Get('payroll-summary')
  getPayrollSummary(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getPayrollSummary(user.organizationId);
  }
}
