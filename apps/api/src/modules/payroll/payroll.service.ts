import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../database/prisma.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { CreatePayrollRunDto, ProcessPayrollRunDto } from './dto/create-payroll-run.dto';
import { CreateAdjustmentDto, RejectAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpsertTaxDeclarationDto } from './dto/upsert-tax-declaration.dto';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Adjustment types that add to earnings vs deductions ─────────────────────
const EARNING_ADJUSTMENTS  = ['BONUS', 'OVERTIME', 'ARREAR', 'REIMBURSEMENT', 'OTHER'] as const;
const DEDUCTION_ADJUSTMENTS = ['DEDUCTION'] as const;

// ─── Attendance status constants ──────────────────────────────────────────────
const PRESENT_STATUSES   = ['PRESENT', 'LATE', 'EXCUSED', 'WORK_FROM_HOME'] as const;
const HALF_DAY_STATUS    = 'HALF_DAY';
const ABSENT_STATUS      = 'ABSENT';
const ON_LEAVE_STATUS    = 'ON_LEAVE';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Salary Components ────────────────────────────────────────

  async createSalaryComponent(organizationId: string, dto: CreateSalaryComponentDto) {
    const existing = await this.prisma.salaryComponent.findFirst({
      where: { organizationId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Salary component with code '${dto.code}' already exists`);
    }
    return this.prisma.salaryComponent.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        componentType: dto.componentType,
        calculationType: dto.calculationType,
        ...(dto.isTaxable !== undefined ? { isTaxable: dto.isTaxable } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async findSalaryComponents(organizationId: string, componentType?: string) {
    return this.prisma.salaryComponent.findMany({
      where: {
        organizationId,
        ...(componentType ? { componentType } : {}),
      },
      orderBy: [{ componentType: 'asc' }, { name: 'asc' }],
    });
  }

  async updateSalaryComponent(
    organizationId: string,
    id: string,
    dto: Partial<CreateSalaryComponentDto>,
  ) {
    await this.getSalaryComponentOrFail(organizationId, id);
    return this.prisma.salaryComponent.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.componentType ? { componentType: dto.componentType } : {}),
        ...(dto.calculationType ? { calculationType: dto.calculationType } : {}),
        ...(dto.isTaxable !== undefined ? { isTaxable: dto.isTaxable } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async deleteSalaryComponent(organizationId: string, id: string) {
    await this.getSalaryComponentOrFail(organizationId, id);
    const inUse = await this.prisma.employeeSalaryComponent.findFirst({
      where: { salaryComponentId: id },
    });
    if (inUse) {
      throw new BadRequestException(
        'Salary component is assigned to employee structures and cannot be deleted',
      );
    }
    await this.prisma.salaryComponent.delete({ where: { id } });
  }

  private async getSalaryComponentOrFail(organizationId: string, id: string) {
    const component = await this.prisma.salaryComponent.findFirst({
      where: { id, organizationId },
    });
    if (!component) throw new NotFoundException('Salary component not found');
    return component;
  }

  // ─── Salary Structures ────────────────────────────────────────

  async createSalaryStructure(organizationId: string, dto: CreateSalaryStructureDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.salaryStructure.updateMany({
        where: { employeeId: dto.employeeId, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED', effectiveTo: new Date(dto.effectiveFrom) },
      });

      const structure = await tx.salaryStructure.create({
        data: {
          employeeId: dto.employeeId,
          effectiveFrom: new Date(dto.effectiveFrom),
          ...(dto.effectiveTo ? { effectiveTo: new Date(dto.effectiveTo) } : {}),
          basicSalary: dto.basicSalary,
          grossSalary: dto.grossSalary,
          status: 'ACTIVE',
        },
      });

      if (dto.components && dto.components.length > 0) {
        await tx.employeeSalaryComponent.createMany({
          data: dto.components.map((c) => ({
            salaryStructureId: structure.id,
            salaryComponentId: c.salaryComponentId,
            ...(c.amount !== undefined ? { amount: c.amount } : {}),
            ...(c.percentage !== undefined ? { percentage: c.percentage } : {}),
          })),
        });
      }

      return tx.salaryStructure.findUnique({
        where: { id: structure.id },
        include: { components: { include: { salaryComponent: true } } },
      });
    });
  }

  async findSalaryStructures(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.salaryStructure.findMany({
      where: { employeeId },
      include: { components: { include: { salaryComponent: true } } },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findActiveSalaryStructure(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const structure = await this.prisma.salaryStructure.findFirst({
      where: { employeeId, status: 'ACTIVE' },
      include: { components: { include: { salaryComponent: true } } },
    });
    if (!structure) throw new NotFoundException('No active salary structure found for this employee');
    return structure;
  }

  // ─── Payroll Runs ─────────────────────────────────────────────

  async createPayrollRun(organizationId: string, dto: CreatePayrollRunDto) {
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);
    if (start >= end) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    const existing = await this.prisma.payrollRun.findFirst({
      where: { organizationId, periodStart: start, periodEnd: end },
    });
    if (existing) {
      throw new BadRequestException('A payroll run already exists for this period');
    }

    return this.prisma.payrollRun.create({
      data: { organizationId, periodStart: start, periodEnd: end, status: 'DRAFT' },
    });
  }

  async findPayrollRuns(organizationId: string, status?: string) {
    return this.prisma.payrollRun.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      include: { _count: { select: { records: true } } },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findPayrollRun(organizationId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, organizationId },
      include: {
        records: {
          include: { items: { include: { salaryComponent: true } } },
          orderBy: { employeeId: 'asc' },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  // ─── Pre-payroll validation ───────────────────────────────────

  /**
   * Validate a payroll run before processing.
   * Returns a health report: missing salary structures, missing attendance data, etc.
   */
  async validatePayrollRun(organizationId: string, id: string) {
    const run = await this.getPayrollRunOrFail(organizationId, id);

    const employees = await this.prisma.employee.findMany({
      where: { organizationId, employmentStatus: 'ACTIVE' },
      include: { person: true },
      orderBy: { employeeNumber: 'asc' },
    });

    const results = await Promise.all(
      employees.map(async (emp) => {
        const structure = await this.prisma.salaryStructure.findFirst({
          where: { employeeId: emp.id, status: 'ACTIVE' },
        });

        const attendanceCount = await this.prisma.employeeAttendance.count({
          where: {
            employeeId: emp.id,
            date: { gte: run.periodStart, lte: run.periodEnd },
          },
        });

        const leaveCount = await this.prisma.leaveRequest.count({
          where: {
            employeeId: emp.id,
            status: 'APPROVED',
            startDate: { lte: run.periodEnd },
            endDate: { gte: run.periodStart },
          },
        });

        const issues: string[] = [];
        if (!structure) issues.push('Missing salary structure');
        if (attendanceCount === 0) issues.push('No attendance data for period');

        return {
          employeeId: emp.id,
          employeeNumber: emp.employeeNumber,
          name: `${emp.person.firstName} ${emp.person.lastName}`,
          hasSalaryStructure: !!structure,
          hasAttendanceData: attendanceCount > 0,
          attendanceDays: attendanceCount,
          approvedLeaves: leaveCount,
          issues,
        };
      }),
    );

    const totalEmployees   = employees.length;
    const missingStructure = results.filter((r) => !r.hasSalaryStructure).length;
    const missingAttendance = results.filter((r) => !r.hasAttendanceData).length;
    const withIssues        = results.filter((r) => r.issues.length > 0).length;

    return {
      runId:  id,
      period: { start: run.periodStart, end: run.periodEnd },
      summary: {
        totalEmployees,
        readyToProcess: totalEmployees - withIssues,
        withIssues,
        missingStructure,
        missingAttendance,
      },
      canProcess: totalEmployees > 0 && missingStructure < totalEmployees,
      employees: results,
    };
  }

  // ─── Core payroll processing ──────────────────────────────────

  /**
   * Process a payroll run with full attendance + leave integration:
   *
   * Attendance categorisation:
   *   PRESENT / LATE / EXCUSED / WORK_FROM_HOME → eligible (full day)
   *   HALF_DAY                                  → eligible (0.5 day)
   *   ON_LEAVE (paid)                           → eligible via paidLeaveDays
   *   ON_LEAVE (unpaid) / ABSENT                → LOP
   *
   * LOP formula: lopDays / workingDays × basicSalary
   * Net = gross_earnings − deductions − lopAmount
   */
  async processPayrollRun(
    organizationId: string,
    id: string,
    dto: ProcessPayrollRunDto,
    processedBy: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id, organizationId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!['DRAFT', 'PROCESSING'].includes(run.status)) {
      throw new BadRequestException(`Payroll run with status '${run.status}' cannot be processed`);
    }

    await this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'PROCESSING', processedBy, processedAt: new Date() },
    });

    const employeeFilter = dto.employeeIds?.length
      ? { id: { in: dto.employeeIds }, organizationId, employmentStatus: 'ACTIVE' }
      : { organizationId, employmentStatus: 'ACTIVE' };

    const employees = await this.prisma.employee.findMany({ where: employeeFilter });

    const periodStart = run.periodStart;
    const periodEnd   = run.periodEnd;
    const workingDays = this.countWeekdays(periodStart, periodEnd);

    for (const employee of employees) {
      const structure = await this.prisma.salaryStructure.findFirst({
        where: { employeeId: employee.id, status: 'ACTIVE' },
        include: { components: { include: { salaryComponent: true } } },
      });
      if (!structure) continue;

      // ── 1. Attendance breakdown ──────────────────────────────
      const attendanceRecords = await this.prisma.employeeAttendance.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: periodStart, lte: periodEnd },
        },
        select: { status: true, workHours: true },
      });

      let fullPresentCount = 0;
      let halfDayCount     = 0;
      let absentCount      = 0;
      let onLeaveCount     = 0;
      let overtimeHours    = new Decimal(0);

      for (const rec of attendanceRecords) {
        if ((PRESENT_STATUSES as readonly string[]).includes(rec.status)) {
          fullPresentCount++;
          // Overtime = hours beyond 8 per day
          if (rec.workHours && rec.workHours.gt(8)) {
            overtimeHours = overtimeHours.plus(rec.workHours.minus(8));
          }
        } else if (rec.status === HALF_DAY_STATUS) {
          halfDayCount++;
        } else if (rec.status === ABSENT_STATUS) {
          absentCount++;
        } else if (rec.status === ON_LEAVE_STATUS) {
          onLeaveCount++;
        }
      }

      // ── 2. Leave request breakdown ───────────────────────────
      const approvedLeaves = await this.prisma.leaveRequest.findMany({
        where: {
          employeeId: employee.id,
          status: 'APPROVED',
          startDate: { lte: periodEnd },
          endDate:   { gte: periodStart },
        },
        include: { leaveType: true },
      });

      let paidLeaveDays   = new Decimal(0);
      let unpaidLeaveDays = new Decimal(0);

      for (const leave of approvedLeaves) {
        // Clamp to pay period
        const leaveStart = leave.startDate > periodStart ? leave.startDate : periodStart;
        const leaveEnd   = leave.endDate < periodEnd     ? leave.endDate   : periodEnd;
        const days       = new Decimal(this.countCalendarDays(leaveStart, leaveEnd));

        if (leave.leaveType.isPaid) {
          paidLeaveDays = paidLeaveDays.plus(days);
        } else {
          unpaidLeaveDays = unpaidLeaveDays.plus(days);
        }
      }

      // ── 3. Compute eligible days and LOP ─────────────────────
      // Half-day counts as 0.5 eligible
      const halfDayEligible = new Decimal(halfDayCount).times(0.5);
      // Eligible = full present + half-day portion + paid leave
      const eligibleDays = new Decimal(fullPresentCount)
        .plus(halfDayEligible)
        .plus(paidLeaveDays);

      // LOP = absent + unpaid leave + half-day absent portion
      const halfDayLop = new Decimal(halfDayCount).times(0.5);
      const lopDays    = new Decimal(absentCount).plus(unpaidLeaveDays).plus(halfDayLop);

      // Present days stored = full present + half-day as 0.5 each
      const presentDaysDecimal = new Decimal(fullPresentCount).plus(halfDayEligible);

      // ── 4. Salary component calculation ──────────────────────
      const basic = new Decimal(structure.basicSalary);
      const gross = new Decimal(structure.grossSalary);

      let totalEarnings   = new Decimal(0);
      let totalDeductions = new Decimal(0);
      const itemsData: Array<{ salaryComponentId: string; amount: Decimal }> = [];

      for (const line of structure.components) {
        const comp = line.salaryComponent;
        let amount = new Decimal(0);

        if (comp.calculationType === 'FIXED') {
          amount = new Decimal(line.amount ?? 0);
        } else if (comp.calculationType === 'PERCENTAGE_OF_BASIC') {
          amount = basic.times(new Decimal(line.percentage ?? 0)).dividedBy(100);
        } else if (comp.calculationType === 'PERCENTAGE_OF_GROSS') {
          amount = gross.times(new Decimal(line.percentage ?? 0)).dividedBy(100);
        }

        itemsData.push({ salaryComponentId: comp.id, amount });

        if (comp.componentType === 'EARNING') {
          totalEarnings = totalEarnings.plus(amount);
        } else {
          totalDeductions = totalDeductions.plus(amount);
        }
      }

      // ── 5. LOP deduction ─────────────────────────────────────
      // Formula: lopDays / workingDays × basicSalary
      const lopAmount =
        workingDays > 0
          ? lopDays.times(basic).dividedBy(workingDays).toDecimalPlaces(2)
          : new Decimal(0);

      // ── 6. Gross and net salary (base) ────────────────────────
      const hasAttendanceData = attendanceRecords.length > 0;
      const attendanceRatio =
        hasAttendanceData && workingDays > 0
          ? Decimal.min(eligibleDays.dividedBy(workingDays), new Decimal(1))
          : new Decimal(1);

      const proratedGross      = basic.plus(totalEarnings).times(attendanceRatio).toDecimalPlaces(2);
      const proratedBasic      = basic.times(attendanceRatio).toDecimalPlaces(2);
      const proratedDeductions = totalDeductions.times(attendanceRatio).toDecimalPlaces(2);

      // ── 7. Adjustments (bonuses, arrears, OT pay, reimbursements, deductions) ──
      const effectivePeriod = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;

      const approvedAdjustments = await this.prisma.payrollAdjustment.findMany({
        where: { employeeId: employee.id, organizationId, effectivePeriod, status: 'APPROVED' },
      });

      let totalAdjustmentEarnings   = new Decimal(0);
      let totalAdjustmentDeductions = new Decimal(0);

      for (const adj of approvedAdjustments) {
        const amt = new Decimal(adj.amount);
        if ((EARNING_ADJUSTMENTS as readonly string[]).includes(adj.adjustmentType)) {
          totalAdjustmentEarnings = totalAdjustmentEarnings.plus(amt);
        } else {
          totalAdjustmentDeductions = totalAdjustmentDeductions.plus(amt);
        }
      }

      const totalAdjustments = totalAdjustmentEarnings.minus(totalAdjustmentDeductions).toDecimalPlaces(2);

      // ── 8. Active loan deductions ─────────────────────────────
      const activeLoans = await this.prisma.employeeLoan.findMany({
        where: { employeeId: employee.id, organizationId, status: 'ACTIVE', startDate: { lte: periodEnd } },
      });

      let totalLoanDeductions = new Decimal(0);
      const loanInstallments: Array<{ loanId: string; amount: Decimal }> = [];

      for (const loan of activeLoans) {
        const actualDeduction = Decimal.min(
          new Decimal(loan.monthlyDeduction),
          new Decimal(loan.outstandingAmount),
        );
        if (actualDeduction.lte(0)) continue;
        totalLoanDeductions = totalLoanDeductions.plus(actualDeduction);
        loanInstallments.push({ loanId: loan.id, amount: actualDeduction });
      }

      // ── 9. TDS computation ────────────────────────────────────
      const financialYear = this.deriveFinancialYear(new Date(run.periodStart));
      const taxDecl = await this.prisma.taxDeclaration.findFirst({
        where: { organizationId, employeeId: employee.id, financialYear },
      });
      const regime = ((taxDecl?.taxRegime ?? 'NEW') as 'OLD' | 'NEW');
      const annualizedGross = proratedGross.times(12);
      const taxResult = this.computeIncomeTax(annualizedGross, regime, {
        section80C:      new Decimal(taxDecl?.section80C   ?? 0),
        hraExemption:    new Decimal(taxDecl?.hraExemption  ?? 0),
        otherDeductions: new Decimal(taxDecl?.otherDeductions ?? 0),
      });
      const tdsAmount = taxResult.monthlyTds;

      // ── 10. Final net salary (including TDS) ──────────────────
      const netSalary = proratedGross
        .plus(totalAdjustmentEarnings)
        .minus(proratedDeductions)
        .minus(totalAdjustmentDeductions)
        .minus(lopAmount)
        .minus(totalLoanDeductions)
        .minus(tdsAmount)
        .toDecimalPlaces(2);

      // ── 11. Upsert PayrollRecord ──────────────────────────────
      const recordData = {
        workingDays,
        presentDays:         presentDaysDecimal,
        absentDays:          absentCount,
        halfDayCount,
        paidLeaveDays,
        unpaidLeaveDays,
        lopDays,
        lopAmount,
        overtimeHours:       overtimeHours.toDecimalPlaces(2),
        basic:               proratedBasic,
        gross:               proratedGross,
        totalDeductions:     proratedDeductions,
        totalAdjustments,
        totalLoanDeductions: totalLoanDeductions.toDecimalPlaces(2),
        tdsAmount:           tdsAmount.toDecimalPlaces(2),
        taxRegime:           regime,
        netSalary,
        status:              'PENDING',
      };

      const existingRecord = await this.prisma.payrollRecord.findFirst({
        where: { payrollRunId: id, employeeId: employee.id },
      });

      let recordId: string;

      if (existingRecord) {
        await this.prisma.payrollItem.deleteMany({ where: { payrollRecordId: existingRecord.id } });
        // Reset previously-included adjustments so they can be re-included
        await this.prisma.payrollAdjustment.updateMany({
          where: { payrollRecordId: existingRecord.id },
          data:  { status: 'APPROVED', payrollRecordId: null },
        });
        await this.prisma.payrollRecord.update({ where: { id: existingRecord.id }, data: recordData });
        recordId = existingRecord.id;
      } else {
        const record = await this.prisma.payrollRecord.create({
          data: { payrollRunId: id, employeeId: employee.id, ...recordData },
        });
        recordId = record.id;
      }

      // ── 12. Upsert TaxCalculation audit record ────────────────
      await this.prisma.taxCalculation.upsert({
        where: { payrollRecordId: recordId },
        create: {
          payrollRecordId:  recordId,
          taxDeclarationId: taxDecl?.id ?? null,
          taxRegime:        regime,
          annualizedGross:  taxResult.annualizedGross,
          totalExemptions:  taxResult.totalExemptions,
          taxableIncome:    taxResult.taxableIncome,
          incomeTaxAnnual:  taxResult.incomeTaxAnnual,
          rebate87A:        taxResult.rebate87A,
          educationCess:    taxResult.educationCess,
          totalAnnualTax:   taxResult.totalAnnualTax,
          monthlyTds:       taxResult.monthlyTds,
        },
        update: {
          taxDeclarationId: taxDecl?.id ?? null,
          taxRegime:        regime,
          annualizedGross:  taxResult.annualizedGross,
          totalExemptions:  taxResult.totalExemptions,
          taxableIncome:    taxResult.taxableIncome,
          incomeTaxAnnual:  taxResult.incomeTaxAnnual,
          rebate87A:        taxResult.rebate87A,
          educationCess:    taxResult.educationCess,
          totalAnnualTax:   taxResult.totalAnnualTax,
          monthlyTds:       taxResult.monthlyTds,
        },
      });

      // ── 13. PayrollItems (salary component level) ─────────────
      await this.prisma.payrollItem.createMany({
        data: itemsData.map((item) => ({
          payrollRecordId:   recordId,
          salaryComponentId: item.salaryComponentId,
          amount:            item.amount.times(attendanceRatio).toDecimalPlaces(2),
        })),
      });

      // ── 14. Mark adjustments as INCLUDED ─────────────────────
      if (approvedAdjustments.length > 0) {
        await this.prisma.payrollAdjustment.updateMany({
          where: { id: { in: approvedAdjustments.map((a) => a.id) } },
          data:  { status: 'INCLUDED', payrollRecordId: recordId },
        });
      }

      // ── 15. Create loan installments + reduce outstanding ─────
      for (const inst of loanInstallments) {
        const alreadyExists = await this.prisma.loanInstallment.findFirst({
          where: { loanId: inst.loanId, payrollRunId: id },
        });
        if (!alreadyExists) {
          await this.prisma.loanInstallment.create({
            data: { loanId: inst.loanId, payrollRunId: id, amount: inst.amount, status: 'DEDUCTED', paidAt: new Date() },
          });
          const loan = await this.prisma.employeeLoan.findUnique({ where: { id: inst.loanId } });
          if (loan) {
            const newOutstanding = new Decimal(loan.outstandingAmount).minus(inst.amount).toDecimalPlaces(2);
            await this.prisma.employeeLoan.update({
              where: { id: inst.loanId },
              data:  { outstandingAmount: newOutstanding, status: newOutstanding.lte(0) ? 'COMPLETED' : 'ACTIVE' },
            });
          }
        }
      }
    }

    return this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: { _count: { select: { records: true } } },
    });
  }

  async approvePayrollRun(organizationId: string, id: string) {
    const run = await this.getPayrollRunOrFail(organizationId, id);
    if (run.status !== 'COMPLETED') {
      throw new BadRequestException('Only COMPLETED payroll runs can be approved');
    }
    return this.prisma.payrollRun.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async markPaid(organizationId: string, id: string) {
    const run = await this.getPayrollRunOrFail(organizationId, id);
    if (run.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED payroll runs can be marked as paid');
    }
    await this.prisma.payrollRecord.updateMany({
      where: { payrollRunId: id, status: { not: 'HELD' } },
      data: { status: 'PAID' },
    });
    return this.prisma.payrollRun.update({ where: { id }, data: { status: 'PAID' } });
  }

  async holdRecord(organizationId: string, runId: string, recordId: string) {
    await this.getPayrollRunOrFail(organizationId, runId);
    const record = await this.prisma.payrollRecord.findFirst({
      where: { id: recordId, payrollRunId: runId },
    });
    if (!record) throw new NotFoundException('Payroll record not found');
    return this.prisma.payrollRecord.update({ where: { id: recordId }, data: { status: 'HELD' } });
  }

  // ─── Payslip ──────────────────────────────────────────────────

  async getPayslip(organizationId: string, runId: string, employeeId: string) {
    await this.getPayrollRunOrFail(organizationId, runId);
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      include: { person: true, designation: true, department: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const record = await this.prisma.payrollRecord.findFirst({
      where: { payrollRunId: runId, employeeId },
      include: { items: { include: { salaryComponent: true } }, payrollRun: true },
    });
    if (!record) throw new NotFoundException('No payslip found for this employee in this run');

    return {
      employee: {
        id:             employee.id,
        name:           `${employee.person.firstName} ${employee.person.lastName}`,
        employeeNumber: employee.employeeNumber,
        designation:    employee.designation?.name,
        department:     employee.department?.name,
      },
      period: { start: record.payrollRun.periodStart, end: record.payrollRun.periodEnd },
      attendance: {
        workingDays:    record.workingDays,
        presentDays:    record.presentDays,
        absentDays:     record.absentDays,
        halfDayCount:   record.halfDayCount,
        paidLeaveDays:  record.paidLeaveDays,
        unpaidLeaveDays: record.unpaidLeaveDays,
        lopDays:        record.lopDays,
        overtimeHours:  record.overtimeHours,
      },
      earnings: record.items
        .filter((i) => i.salaryComponent.componentType === 'EARNING')
        .map((i) => ({ name: i.salaryComponent.name, code: i.salaryComponent.code, amount: i.amount })),
      deductions: record.items
        .filter((i) => i.salaryComponent.componentType === 'DEDUCTION')
        .map((i) => ({ name: i.salaryComponent.name, code: i.salaryComponent.code, amount: i.amount })),
      lop: {
        lopDays:  record.lopDays,
        lopAmount: record.lopAmount,
      },
      summary: {
        basic:           record.basic,
        gross:           record.gross,
        totalDeductions: record.totalDeductions,
        netSalary:       record.netSalary,
      },
      status: record.status,
    };
  }

  async getEmployeePayHistory(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.payrollRecord.findMany({
      where: { employeeId, payrollRun: { organizationId } },
      include: { payrollRun: true },
      orderBy: { payrollRun: { periodStart: 'desc' } },
    });
  }

  // ─── Adjustments ─────────────────────────────────────────────

  async createAdjustment(organizationId: string, createdBy: string, dto: CreateAdjustmentDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.payrollAdjustment.create({
      data: {
        organizationId,
        employeeId:      dto.employeeId,
        adjustmentType:  dto.adjustmentType,
        ...(dto.subType      ? { subType:     dto.subType }     : {}),
        ...(dto.description  ? { description: dto.description } : {}),
        amount:          dto.amount,
        effectivePeriod: dto.effectivePeriod,
        createdBy,
        status:          'PENDING',
      },
    });
  }

  async listAdjustments(
    organizationId: string,
    filters: { employeeId?: string; adjustmentType?: string; status?: string; effectivePeriod?: string },
  ) {
    return this.prisma.payrollAdjustment.findMany({
      where: {
        organizationId,
        ...(filters.employeeId     ? { employeeId: filters.employeeId }         : {}),
        ...(filters.adjustmentType ? { adjustmentType: filters.adjustmentType } : {}),
        ...(filters.status         ? { status: filters.status }                 : {}),
        ...(filters.effectivePeriod ? { effectivePeriod: filters.effectivePeriod } : {}),
      },
      include: {
        payrollRecord: { select: { id: true, netSalary: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveAdjustment(organizationId: string, adjustmentId: string, approvedBy: string) {
    const adj = await this.prisma.payrollAdjustment.findFirst({
      where: { id: adjustmentId, organizationId },
    });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve adjustment in status '${adj.status}'`);
    }
    return this.prisma.payrollAdjustment.update({
      where: { id: adjustmentId },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async rejectAdjustment(
    organizationId: string,
    adjustmentId: string,
    rejectedBy: string,
    dto: RejectAdjustmentDto,
  ) {
    const adj = await this.prisma.payrollAdjustment.findFirst({
      where: { id: adjustmentId, organizationId },
    });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject adjustment in status '${adj.status}'`);
    }
    return this.prisma.payrollAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status:     'REJECTED',
        approvedBy: rejectedBy,
        ...(dto.rejectionReason ? { rejectionReason: dto.rejectionReason } : {}),
      },
    });
  }

  // ─── Loans ────────────────────────────────────────────────────

  async createLoan(organizationId: string, dto: CreateLoanDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // Reject if an active loan of the same type already exists
    const existing = await this.prisma.employeeLoan.findFirst({
      where: { organizationId, employeeId: dto.employeeId, loanType: dto.loanType, status: 'ACTIVE' },
    });
    if (existing) {
      throw new BadRequestException(`Employee already has an active ${dto.loanType} loan`);
    }

    return this.prisma.employeeLoan.create({
      data: {
        organizationId,
        employeeId:       dto.employeeId,
        loanType:         dto.loanType,
        principalAmount:  dto.principalAmount,
        outstandingAmount: dto.principalAmount,
        monthlyDeduction: dto.monthlyDeduction,
        startDate:        new Date(dto.startDate),
        ...(dto.reason ? { reason: dto.reason } : {}),
        status:           'ACTIVE',
      },
    });
  }

  async listLoans(
    organizationId: string,
    filters: { employeeId?: string; status?: string; loanType?: string },
  ) {
    return this.prisma.employeeLoan.findMany({
      where: {
        organizationId,
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.status     ? { status: filters.status }         : {}),
        ...(filters.loanType   ? { loanType: filters.loanType }     : {}),
      },
      include: {
        installments: { orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLoanDetail(organizationId: string, loanId: string) {
    const loan = await this.prisma.employeeLoan.findFirst({
      where: { id: loanId, organizationId },
      include: {
        installments: { orderBy: { paidAt: 'asc' } },
      },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  async closeLoan(organizationId: string, loanId: string) {
    const loan = await this.prisma.employeeLoan.findFirst({
      where: { id: loanId, organizationId },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot close loan in status '${loan.status}'`);
    }
    return this.prisma.employeeLoan.update({
      where: { id: loanId },
      data: { status: 'CLOSED', endDate: new Date() },
    });
  }

  // ─── Tax Declarations ────────────────────────────────────────

  async upsertTaxDeclaration(organizationId: string, dto: UpsertTaxDeclarationDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.taxDeclaration.upsert({
      where: {
        organizationId_employeeId_financialYear: {
          organizationId,
          employeeId: dto.employeeId,
          financialYear: dto.financialYear,
        },
      },
      create: {
        organizationId,
        employeeId:      dto.employeeId,
        financialYear:   dto.financialYear,
        taxRegime:       dto.taxRegime,
        section80C:      dto.section80C,
        hraExemption:    dto.hraExemption ?? 0,
        otherDeductions: dto.otherDeductions ?? 0,
      },
      update: {
        taxRegime:       dto.taxRegime,
        section80C:      dto.section80C,
        hraExemption:    dto.hraExemption ?? 0,
        otherDeductions: dto.otherDeductions ?? 0,
      },
    });
  }

  async listTaxDeclarations(organizationId: string, financialYear?: string) {
    return this.prisma.taxDeclaration.findMany({
      where: {
        organizationId,
        ...(financialYear ? { financialYear } : {}),
      },
      orderBy: [{ financialYear: 'desc' }, { employeeId: 'asc' }],
    });
  }

  async getTaxDeclaration(organizationId: string, employeeId: string, financialYear: string) {
    return this.prisma.taxDeclaration.findFirst({
      where: { organizationId, employeeId, financialYear },
    });
  }

  // ─── Payslip PDF ─────────────────────────────────────────────

  async generatePayslipPdf(
    organizationId: string,
    runId: string,
    employeeId: string,
    res: Response,
  ): Promise<void> {
    const payslip = await this.getPayslip(organizationId, runId, employeeId);

    // Fetch TDS detail if available (cast to any until Prisma regenerates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: any = await this.prisma.payrollRecord.findFirst({
      where: { payrollRunId: runId, employeeId },
    });

    const tdsAmount   = record?.tdsAmount           ? Number(record.tdsAmount)           : 0;
    const taxRegime   = (record?.taxRegime           ?? 'NEW') as string;
    const loanDeduct  = record?.totalLoanDeductions  ? Number(record.totalLoanDeductions)  : 0;
    const adjAmount   = record?.totalAdjustments     ? Number(record.totalAdjustments)     : 0;

    const formatRs = (n: number | string | Decimal) =>
      `₹${Number(n.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // PDF setup
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip-${employeeId.slice(0, 8)}.pdf"`,
    );

    const doc = new PDFDocument({ size: 'A4', margin: 45, bufferPages: true });
    doc.pipe(res);

    const W = 505; // usable width (595 - 45*2)
    const GREEN  = '#4a9b6f';
    const DARK   = '#2c322f';
    const MUTED  = '#6d746e';
    const LIGHT  = '#f4f1e9';
    const WHITE  = '#ffffff';

    // ── Header band ──────────────────────────────────────────────
    doc.rect(45, 45, W, 52).fill(GREEN);
    doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
       .text('PAYSLIP', 55, 55);
    doc.fontSize(9).font('Helvetica')
       .text(`Pay Period: ${new Date(payslip.period.start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, 55, 76);
    doc.fillColor(WHITE).fontSize(9)
       .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 55, 89);

    // ── Employee Info ─────────────────────────────────────────────
    let y = 115;
    doc.rect(45, y, W, 70).fill(LIGHT);
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold')
       .text(payslip.employee.name, 55, y + 10);
    doc.fontSize(9).font('Helvetica').fillColor(MUTED);
    doc.text(`Employee No: ${payslip.employee.employeeNumber ?? '—'}`, 55, y + 26);
    doc.text(`Designation: ${payslip.employee.designation ?? '—'}`, 55, y + 39);
    doc.text(`Department:  ${payslip.employee.department  ?? '—'}`, 55, y + 52);
    doc.text(`Tax Regime: ${taxRegime}`, 300, y + 26);
    doc.text(`Period: ${new Date(payslip.period.start).toLocaleDateString('en-IN')} – ${new Date(payslip.period.end).toLocaleDateString('en-IN')}`, 300, y + 39);

    // ── Attendance summary ────────────────────────────────────────
    y += 84;
    const attItems = [
      { label: 'Working Days', value: String(payslip.attendance.workingDays ?? '—') },
      { label: 'Present Days', value: String(payslip.attendance.presentDays ?? '—') },
      { label: 'LOP Days',     value: String(payslip.lop?.lopDays ?? '0') },
      { label: 'LOP Amount',   value: payslip.lop?.lopAmount ? formatRs(String(payslip.lop.lopAmount)) : '₹0.00' },
    ];
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Attendance', 45, y);
    y += 14;
    doc.rect(45, y, W, 1).fill('#e2ddd5'); y += 6;
    attItems.forEach((item, i) => {
      const cx = 45 + (i % 4) * (W / 4);
      if (i % 4 === 0 && i > 0) y += 22;
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(item.label, cx, y);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(item.value, cx, y + 10);
    });

    // ── Earnings & Deductions tables ──────────────────────────────
    y += 36;
    const colW = (W - 10) / 2;

    const drawTable = (
      title: string,
      rows: { label: string; value: string; highlight?: boolean }[],
      x: number,
      startY: number,
      titleColor: string,
    ): number => {
      let ty = startY;
      doc.fillColor(titleColor).fontSize(10).font('Helvetica-Bold').text(title, x, ty);
      ty += 14;
      doc.rect(x, ty, colW, 1).fill('#e2ddd5'); ty += 5;
      rows.forEach((row) => {
        doc.fillColor(row.highlight ? DARK : MUTED).fontSize(8).font(row.highlight ? 'Helvetica-Bold' : 'Helvetica')
           .text(row.label, x, ty);
        doc.fillColor(DARK).fontSize(8).font(row.highlight ? 'Helvetica-Bold' : 'Helvetica')
           .text(row.value, x + colW - 80, ty, { width: 80, align: 'right' });
        ty += 14;
      });
      doc.rect(x, ty, colW, 1).fill('#e2ddd5');
      return ty + 4;
    };

    const earningRows = [
      ...payslip.earnings.map((e) => ({ label: e.name, value: formatRs(e.amount) })),
      ...(adjAmount > 0 ? [{ label: 'Adjustments / Bonus', value: formatRs(adjAmount) }] : []),
      { label: 'Total Earnings', value: formatRs(payslip.summary.gross), highlight: true },
    ];

    const lopAmt = payslip.lop?.lopAmount ? Number(payslip.lop.lopAmount) : 0;
    const deductionRows = [
      ...payslip.deductions.map((d) => ({ label: d.name, value: formatRs(d.amount) })),
      ...(lopAmt    > 0 ? [{ label: 'Loss of Pay (LOP)',    value: formatRs(lopAmt)   }] : []),
      ...(loanDeduct > 0 ? [{ label: 'Loan EMI Deduction',   value: formatRs(loanDeduct) }] : []),
      ...(tdsAmount  > 0 ? [{ label: `TDS (${taxRegime} regime)`, value: formatRs(tdsAmount) }] : []),
      { label: 'Total Deductions', value: formatRs(Number(payslip.summary.totalDeductions) + lopAmt + loanDeduct + tdsAmount), highlight: true },
    ];

    const endY1 = drawTable('Earnings',   earningRows,   45,    y, GREEN);
    const endY2 = drawTable('Deductions', deductionRows, 45 + colW + 10, y, '#b04a3a');
    y = Math.max(endY1, endY2) + 16;

    // ── Net Salary box ────────────────────────────────────────────
    doc.rect(45, y, W, 38).fill(GREEN);
    doc.fillColor(WHITE).fontSize(10).font('Helvetica').text('NET SALARY', 55, y + 10);
    doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
       .text(formatRs(payslip.summary.netSalary), 55, y + 8, { align: 'right', width: W - 20 });

    // ── Footer ────────────────────────────────────────────────────
    y += 54;
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
       .text('This is a system-generated payslip and does not require a signature.', 45, y, { align: 'center', width: W });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
    });
  }

  // ─── Bank Export CSV ─────────────────────────────────────────

  async exportBankCsv(organizationId: string, runId: string, res: Response): Promise<void> {
    const run = await this.getPayrollRunOrFail(organizationId, runId);
    if (!['APPROVED', 'PAID'].includes(run.status)) {
      throw new BadRequestException('Bank export is only available for APPROVED or PAID runs');
    }

    const records = await this.prisma.payrollRecord.findMany({
      where: { payrollRunId: runId, status: { not: 'HELD' } },
    });

    const employeeIds = records.map((r) => r.employeeId);

    const [employees, bankDetails] = await Promise.all([
      this.prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        include: { person: true },
      }),
      this.prisma.employeeBankDetail.findMany({
        where: { employeeId: { in: employeeIds }, isPrimary: true },
      }),
    ]);

    const empMap  = new Map(employees.map((e) => [e.id, e]));
    const bankMap = new Map(bankDetails.map((b) => [b.employeeId, b]));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bank-export-${runId.slice(0, 8)}.csv"`);

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

    res.write('Employee Name,Employee No,Account Number,IFSC Code,Bank Name,Account Type,Net Amount\n');
    for (const record of records) {
      const emp  = empMap.get(record.employeeId);
      const bank = bankMap.get(record.employeeId);
      const name = emp
        ? `${emp.person?.firstName ?? ''} ${emp.person?.lastName ?? ''}`.trim()
        : record.employeeId;
      const empNo   = emp?.employeeNumber ?? '';
      const acct    = bank?.accountNumber ?? '';
      const ifsc    = bank?.ifscCode      ?? '';
      const bankNm  = bank?.bankName      ?? '';
      const acctType = bank?.accountType  ?? '';
      const net     = Number(record.netSalary).toFixed(2);
      res.write(`${escape(name)},${escape(empNo)},${escape(acct)},${escape(ifsc)},${escape(bankNm)},${escape(acctType)},${net}\n`);
    }
    res.end();
  }

  // ─── Private helpers ──────────────────────────────────────────

  private async getPayrollRunOrFail(organizationId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id, organizationId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  /** Derive financial year string (April–March) from a given date */
  private deriveFinancialYear(date: Date): string {
    const month = date.getMonth(); // 0-indexed
    const year  = date.getFullYear();
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }

  /** Apply progressive tax slabs to taxable income */
  private applySlabs(
    income: Decimal,
    slabs: { upTo: number; rate: number }[],
  ): Decimal {
    let tax = new Decimal(0);
    let prev = 0;
    for (const slab of slabs) {
      if (income.lte(prev)) break;
      const top    = slab.upTo === Infinity ? income : new Decimal(slab.upTo);
      const band   = Decimal.min(income, top).minus(prev);
      tax = tax.plus(band.times(slab.rate / 100));
      prev = slab.upTo;
    }
    return tax;
  }

  /** Compute monthly TDS from annualized gross + declarations */
  private computeIncomeTax(
    annualizedGross: Decimal,
    regime: 'OLD' | 'NEW',
    exemptions: { section80C: Decimal; hraExemption: Decimal; otherDeductions: Decimal },
  ) {
    const STANDARD_DEDUCTION = new Decimal(50000);

    let taxableIncome = annualizedGross.minus(STANDARD_DEDUCTION);

    if (regime === 'OLD') {
      const cap80C   = Decimal.min(exemptions.section80C, 150000);
      taxableIncome  = taxableIncome
        .minus(cap80C)
        .minus(exemptions.hraExemption)
        .minus(exemptions.otherDeductions);
    }
    taxableIncome = Decimal.max(taxableIncome, 0);

    const totalExemptions = regime === 'OLD'
      ? STANDARD_DEDUCTION
          .plus(Decimal.min(exemptions.section80C, 150000))
          .plus(exemptions.hraExemption)
          .plus(exemptions.otherDeductions)
      : STANDARD_DEDUCTION;

    const oldSlabs = [
      { upTo: 250000,   rate: 0  },
      { upTo: 500000,   rate: 5  },
      { upTo: 1000000,  rate: 20 },
      { upTo: Infinity, rate: 30 },
    ];
    const newSlabs = [
      { upTo: 300000,   rate: 0  },
      { upTo: 600000,   rate: 5  },
      { upTo: 900000,   rate: 10 },
      { upTo: 1200000,  rate: 15 },
      { upTo: 1500000,  rate: 20 },
      { upTo: Infinity, rate: 30 },
    ];

    const incomeTaxAnnual = this.applySlabs(taxableIncome, regime === 'OLD' ? oldSlabs : newSlabs);

    // 87A rebate
    let rebate87A = new Decimal(0);
    if (regime === 'OLD' && taxableIncome.lte(500000)) {
      rebate87A = Decimal.min(incomeTaxAnnual, 12500);
    } else if (regime === 'NEW' && taxableIncome.lte(700000)) {
      rebate87A = Decimal.min(incomeTaxAnnual, 25000);
    }

    const taxAfterRebate  = Decimal.max(incomeTaxAnnual.minus(rebate87A), 0);
    const educationCess   = taxAfterRebate.times(0.04).toDecimalPlaces(2);
    const totalAnnualTax  = taxAfterRebate.plus(educationCess).toDecimalPlaces(2);
    const monthlyTds      = totalAnnualTax.dividedBy(12).toDecimalPlaces(2);

    return {
      annualizedGross,
      totalExemptions: totalExemptions.toDecimalPlaces(2),
      taxableIncome:   taxableIncome.toDecimalPlaces(2),
      incomeTaxAnnual: incomeTaxAnnual.toDecimalPlaces(2),
      rebate87A:       rebate87A.toDecimalPlaces(2),
      educationCess,
      totalAnnualTax,
      monthlyTds,
    };
  }

  /** Count Mon–Fri weekdays between two dates inclusive */
  private countWeekdays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  /** Count calendar days between two dates inclusive */
  private countCalendarDays(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(ms / 86_400_000) + 1);
  }
}
