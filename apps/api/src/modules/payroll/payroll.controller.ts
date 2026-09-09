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
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { CreatePayrollRunDto, ProcessPayrollRunDto } from './dto/create-payroll-run.dto';
import { CreateAdjustmentDto, RejectAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpsertTaxDeclarationDto } from './dto/upsert-tax-declaration.dto';

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

  // ─── Validation ───────────────────────────────────────────────

  @ApiOperation({
    summary:
      'Pre-payroll validation — returns health report: missing salary structures, attendance gaps, etc.',
  })
  @Get('runs/:id/validate')
  validatePayrollRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.validatePayrollRun(user.organizationId, id);
  }

  // ─── Adjustments ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a payroll adjustment (bonus, deduction, etc.)' })
  @Post('adjustments')
  createAdjustment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.payrollService.createAdjustment(user.organizationId, user.userId, dto);
  }

  @ApiOperation({ summary: 'List payroll adjustments with optional filters' })
  @ApiQuery({ name: 'employeeId',     required: false })
  @ApiQuery({ name: 'adjustmentType', required: false, description: 'BONUS | OVERTIME | ARREAR | REIMBURSEMENT | DEDUCTION | OTHER' })
  @ApiQuery({ name: 'status',         required: false, description: 'PENDING | APPROVED | REJECTED | INCLUDED' })
  @ApiQuery({ name: 'effectivePeriod', required: false, description: 'YYYY-MM' })
  @Get('adjustments')
  listAdjustments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('employeeId')     employeeId?: string,
    @Query('adjustmentType') adjustmentType?: string,
    @Query('status')         status?: string,
    @Query('effectivePeriod') effectivePeriod?: string,
  ) {
    const filters: { employeeId?: string; adjustmentType?: string; status?: string; effectivePeriod?: string } = {};
    if (employeeId)      filters.employeeId      = employeeId;
    if (adjustmentType)  filters.adjustmentType  = adjustmentType;
    if (status)          filters.status          = status;
    if (effectivePeriod) filters.effectivePeriod = effectivePeriod;
    return this.payrollService.listAdjustments(user.organizationId, filters);
  }

  @ApiOperation({ summary: 'Approve a pending adjustment' })
  @Patch('adjustments/:id/approve')
  approveAdjustment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.approveAdjustment(user.organizationId, id, user.userId);
  }

  @ApiOperation({ summary: 'Reject a pending adjustment' })
  @Patch('adjustments/:id/reject')
  rejectAdjustment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: RejectAdjustmentDto,
  ) {
    return this.payrollService.rejectAdjustment(user.organizationId, id, user.userId, dto);
  }

  // ─── Loans ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create an employee loan / salary advance' })
  @Post('loans')
  createLoan(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateLoanDto,
  ) {
    return this.payrollService.createLoan(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List employee loans with optional filters' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status',     required: false, description: 'ACTIVE | COMPLETED | CLOSED' })
  @ApiQuery({ name: 'loanType',   required: false, description: 'SALARY_ADVANCE | PERSONAL_LOAN | VEHICLE_LOAN | OTHER' })
  @Get('loans')
  listLoans(
    @CurrentUser() user: CurrentUserPayload,
    @Query('employeeId') employeeId?: string,
    @Query('status')     status?: string,
    @Query('loanType')   loanType?: string,
  ) {
    const filters: { employeeId?: string; status?: string; loanType?: string } = {};
    if (employeeId) filters.employeeId = employeeId;
    if (status)     filters.status     = status;
    if (loanType)   filters.loanType   = loanType;
    return this.payrollService.listLoans(user.organizationId, filters);
  }

  @ApiOperation({ summary: 'Get loan detail with full installment history' })
  @Get('loans/:id')
  getLoanDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.getLoanDetail(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Close / write-off a loan early' })
  @Patch('loans/:id/close')
  closeLoan(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollService.closeLoan(user.organizationId, id);
  }

  // ─── Tax Declarations ─────────────────────────────────────────

  @ApiOperation({
    summary: 'Upsert an employee tax declaration (regime + investment deductions)',
  })
  @Post('tax-declarations')
  upsertTaxDeclaration(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpsertTaxDeclarationDto,
  ) {
    return this.payrollService.upsertTaxDeclaration(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List tax declarations (all employees for a financial year)' })
  @ApiQuery({ name: 'financialYear', required: false, description: 'e.g. 2026-2027' })
  @Get('tax-declarations')
  listTaxDeclarations(
    @CurrentUser() user: CurrentUserPayload,
    @Query('financialYear') financialYear?: string,
  ) {
    return this.payrollService.listTaxDeclarations(user.organizationId, financialYear);
  }

  @ApiOperation({ summary: 'Get a specific employee tax declaration for a financial year' })
  @ApiQuery({ name: 'financialYear', required: true, description: 'e.g. 2026-2027' })
  @Get('tax-declarations/:employeeId')
  getTaxDeclaration(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
    @Query('financialYear') financialYear: string,
  ) {
    return this.payrollService.getTaxDeclaration(user.organizationId, employeeId, financialYear);
  }

  // ─── Payslip PDF ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Download a payslip as PDF' })
  @Get('runs/:runId/payslips/:employeeId/pdf')
  async getPayslipPdf(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
    @Param('employeeId') employeeId: string,
    @Res() res: Response,
  ) {
    return this.payrollService.generatePayslipPdf(user.organizationId, runId, employeeId, res);
  }

  // ─── Bank Export CSV ─────────────────────────────────────────

  @ApiOperation({
    summary: 'Export payroll run as a bank-transfer CSV (APPROVED or PAID runs only)',
  })
  @Get('runs/:id/export/bank')
  async exportBankFile(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    return this.payrollService.exportBankCsv(user.organizationId, id, res);
  }
}
