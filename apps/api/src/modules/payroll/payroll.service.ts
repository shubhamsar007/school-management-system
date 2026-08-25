import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { CreatePayrollRunDto, ProcessPayrollRunDto } from './dto/create-payroll-run.dto';
import { Decimal } from '@prisma/client/runtime/library';

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
      throw new BadRequestException('Salary component is assigned to employee structures and cannot be deleted');
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
    // Verify employee belongs to org
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction(async (tx) => {
      // Supersede any currently active structure for this employee
      await tx.salaryStructure.updateMany({
        where: { employeeId: dto.employeeId, status: 'ACTIVE' },
        data: {
          status: 'SUPERSEDED',
          effectiveTo: new Date(dto.effectiveFrom),
        },
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
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
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

  /**
   * Core payroll processing:
   * 1. For each active employee (or specified subset), find their active salary structure
   * 2. Count their working days and present days from EmployeeAttendance in the period
   * 3. Compute each component (FIXED / PERCENTAGE_OF_BASIC / PERCENTAGE_OF_GROSS)
   * 4. Pro-rate net salary by attendance: net = full_net * (presentDays / workingDays)
   * 5. Upsert PayrollRecord + PayrollItems
   */
  async processPayrollRun(
    organizationId: string,
    id: string,
    dto: ProcessPayrollRunDto,
    processedBy: string,
  ) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, organizationId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!['DRAFT', 'PROCESSING'].includes(run.status)) {
      throw new BadRequestException(`Payroll run with status '${run.status}' cannot be processed`);
    }

    await this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'PROCESSING', processedBy, processedAt: new Date() },
    });

    // Get employees to process
    const employeeFilter = dto.employeeIds?.length
      ? { id: { in: dto.employeeIds }, organizationId, employmentStatus: 'ACTIVE' }
      : { organizationId, employmentStatus: 'ACTIVE' };

    const employees = await this.prisma.employee.findMany({ where: employeeFilter });

    const periodStart = run.periodStart;
    const periodEnd = run.periodEnd;

    // Count total working days in the period (non-holiday weekdays — simplified: count Mon-Fri)
    const workingDays = this.countWeekdays(periodStart, periodEnd);

    for (const employee of employees) {
      const structure = await this.prisma.salaryStructure.findFirst({
        where: { employeeId: employee.id, status: 'ACTIVE' },
        include: { components: { include: { salaryComponent: true } } },
      });

      if (!structure) continue; // Skip employees without a salary structure

      // Count present days from attendance records in the period
      const presentDays = await this.prisma.employeeAttendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: periodStart, lte: periodEnd },
          status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] },
        },
      });

      const basic = new Decimal(structure.basicSalary);
      const gross = new Decimal(structure.grossSalary);

      let totalEarnings = new Decimal(0);
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

      // Pro-rate: if no attendance data yet, use full salary
      const attendanceRatio =
        workingDays > 0 && presentDays < workingDays
          ? new Decimal(presentDays).dividedBy(workingDays)
          : new Decimal(1);

      const proratedBasic = basic.times(attendanceRatio).toDecimalPlaces(2);
      const proratedGross = basic.plus(totalEarnings).times(attendanceRatio).toDecimalPlaces(2);
      const proratedDeductions = totalDeductions.times(attendanceRatio).toDecimalPlaces(2);
      const netSalary = proratedGross.minus(proratedDeductions).toDecimalPlaces(2);

      // Upsert the payroll record (re-process safe)
      const existingRecord = await this.prisma.payrollRecord.findFirst({
        where: { payrollRunId: id, employeeId: employee.id },
      });

      let recordId: string;

      if (existingRecord) {
        await this.prisma.payrollItem.deleteMany({ where: { payrollRecordId: existingRecord.id } });
        await this.prisma.payrollRecord.update({
          where: { id: existingRecord.id },
          data: {
            workingDays,
            presentDays,
            basic: proratedBasic,
            gross: proratedGross,
            totalDeductions: proratedDeductions,
            netSalary,
            status: 'PENDING',
          },
        });
        recordId = existingRecord.id;
      } else {
        const record = await this.prisma.payrollRecord.create({
          data: {
            payrollRunId: id,
            employeeId: employee.id,
            workingDays,
            presentDays,
            basic: proratedBasic,
            gross: proratedGross,
            totalDeductions: proratedDeductions,
            netSalary,
            status: 'PENDING',
          },
        });
        recordId = record.id;
      }

      // Insert payroll items (pro-rated)
      await this.prisma.payrollItem.createMany({
        data: itemsData.map((item) => ({
          payrollRecordId: recordId,
          salaryComponentId: item.salaryComponentId,
          amount: item.amount.times(attendanceRatio).toDecimalPlaces(2),
        })),
      });
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
    return this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
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
    return this.prisma.payrollRun.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  async holdRecord(organizationId: string, runId: string, recordId: string) {
    await this.getPayrollRunOrFail(organizationId, runId);
    const record = await this.prisma.payrollRecord.findFirst({
      where: { id: recordId, payrollRunId: runId },
    });
    if (!record) throw new NotFoundException('Payroll record not found');
    return this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { status: 'HELD' },
    });
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
        id: employee.id,
        name: `${employee.person.firstName} ${employee.person.lastName}`,
        employeeNumber: employee.employeeNumber,
        designation: employee.designation?.name,
        department: employee.department?.name,
      },
      period: { start: record.payrollRun.periodStart, end: record.payrollRun.periodEnd },
      attendance: { workingDays: record.workingDays, presentDays: record.presentDays },
      earnings: record.items
        .filter((i) => i.salaryComponent.componentType === 'EARNING')
        .map((i) => ({ name: i.salaryComponent.name, code: i.salaryComponent.code, amount: i.amount })),
      deductions: record.items
        .filter((i) => i.salaryComponent.componentType === 'DEDUCTION')
        .map((i) => ({ name: i.salaryComponent.name, code: i.salaryComponent.code, amount: i.amount })),
      summary: {
        basic: record.basic,
        gross: record.gross,
        totalDeductions: record.totalDeductions,
        netSalary: record.netSalary,
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

  // ─── Helpers ──────────────────────────────────────────────────

  private async getPayrollRunOrFail(organizationId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id, organizationId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
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
}
