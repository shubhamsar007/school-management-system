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
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { CreatePayrollRunDto, ProcessPayrollRunDto } from './dto/create-payroll-run.dto';

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'payroll', version: '1' })
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ─── Salary Components ────────────────────────────────────────

  @ApiOperation({ summary: 'Create a salary component (Basic, HRA, PF, etc.)' })
  @Post('salary-components')
  createSalaryComponent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSalaryComponentDto,
  ) {
    return this.payrollService.createSalaryComponent(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List salary components' })
  @ApiQuery({ name: 'componentType', required: false, description: 'EARNING | DEDUCTION' })
  @Get('salary-components')
  findSalaryComponents(
    @CurrentUser() user: CurrentUserPayload,
    @Query('componentType') componentType?: string,
  ) {
    return this.payrollService.findSalaryComponents(user.organizationId, componentType);
  }

  @ApiOperation({ summary: 'Update a salary component' })
  @Patch('salary-components/:id')
  updateSalaryComponent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateSalaryComponentDto,
  ) {
    return this.payrollService.updateSalaryComponent(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a salary component (blocked if in use)' })
  @Delete('salary-components/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSalaryComponent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.deleteSalaryComponent(user.organizationId, id);
  }

  // ─── Salary Structures ────────────────────────────────────────

  @ApiOperation({ summary: 'Assign a salary structure to an employee (supersedes previous active)' })
  @Post('salary-structures')
  createSalaryStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSalaryStructureDto,
  ) {
    return this.payrollService.createSalaryStructure(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'Get all salary structures for an employee (history)' })
  @Get('employees/:employeeId/salary-structures')
  findSalaryStructures(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.payrollService.findSalaryStructures(user.organizationId, employeeId);
  }

  @ApiOperation({ summary: 'Get the active salary structure for an employee' })
  @Get('employees/:employeeId/salary-structures/active')
  findActiveSalaryStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.payrollService.findActiveSalaryStructure(user.organizationId, employeeId);
  }

  // ─── Payroll Runs ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new payroll run (starts as DRAFT)' })
  @Post('runs')
  createPayrollRun(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePayrollRunDto,
  ) {
    return this.payrollService.createPayrollRun(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List payroll runs' })
  @ApiQuery({ name: 'status', required: false, description: 'DRAFT | PROCESSING | COMPLETED | APPROVED | PAID' })
  @Get('runs')
  findPayrollRuns(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
  ) {
    return this.payrollService.findPayrollRuns(user.organizationId, status);
  }

  @ApiOperation({ summary: 'Get a payroll run with all records and line items' })
  @Get('runs/:id')
  findPayrollRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.findPayrollRun(user.organizationId, id);
  }

  @ApiOperation({
    summary:
      'Process a payroll run — computes salary for each employee from their structure + attendance',
  })
  @Post('runs/:id/process')
  @HttpCode(HttpStatus.OK)
  processPayrollRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ProcessPayrollRunDto,
  ) {
    return this.payrollService.processPayrollRun(user.organizationId, id, dto, user.userId);
  }

  @ApiOperation({ summary: 'Approve a completed payroll run (COMPLETED → APPROVED)' })
  @Patch('runs/:id/approve')
  approvePayrollRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.approvePayrollRun(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Mark an approved payroll run as paid (APPROVED → PAID)' })
  @Patch('runs/:id/mark-paid')
  markPaid(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.markPaid(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Hold a specific employee record from the current payroll run' })
  @Patch('runs/:runId/records/:recordId/hold')
  holdRecord(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.payrollService.holdRecord(user.organizationId, runId, recordId);
  }

  // ─── Payslips ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get a structured payslip for an employee in a payroll run' })
  @Get('runs/:runId/payslips/:employeeId')
  getPayslip(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.payrollService.getPayslip(user.organizationId, runId, employeeId);
  }

  @ApiOperation({ summary: "Get an employee's full payroll history across all runs" })
  @Get('employees/:employeeId/history')
  getEmployeePayHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.payrollService.getEmployeePayHistory(user.organizationId, employeeId);
  }
}
