import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFeeHeadDto } from './dto/create-fee-head.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateStudentFeeAssignmentDto } from './dto/create-student-fee-assignment.dto';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { Decimal } from '@prisma/client/runtime/library';
import {
  FeeInvoice,
  FeePayment,
  FeeRefund,
  PaymentAllocation,
} from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Fee Heads ────────────────────────────────────────────────

  async createFeeHead(organizationId: string, dto: CreateFeeHeadDto) {
    const existing = await this.prisma.feeHead.findFirst({
      where: { organizationId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Fee head with code '${dto.code}' already exists`);
    }
    return this.prisma.feeHead.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        category: dto.category,
        ...(dto.isRefundable !== undefined ? { isRefundable: dto.isRefundable } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async findFeeHeads(organizationId: string, category?: string) {
    return this.prisma.feeHead.findMany({
      where: {
        organizationId,
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateFeeHead(organizationId: string, id: string, dto: Partial<CreateFeeHeadDto>) {
    await this.getFeeHeadOrFail(organizationId, id);
    if (dto.code) {
      const conflict = await this.prisma.feeHead.findFirst({
        where: { organizationId, code: dto.code, NOT: { id } },
      });
      if (conflict) {
        throw new BadRequestException(`Fee head code '${dto.code}' is already in use`);
      }
    }
    return this.prisma.feeHead.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.code ? { code: dto.code } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.isRefundable !== undefined ? { isRefundable: dto.isRefundable } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async deleteFeeHead(organizationId: string, id: string) {
    await this.getFeeHeadOrFail(organizationId, id);
    const usedInStructure = await this.prisma.feeStructureItem.findFirst({ where: { feeHeadId: id } });
    if (usedInStructure) {
      throw new BadRequestException('Fee head is used in a fee structure and cannot be deleted');
    }
    const usedInInvoice = await this.prisma.feeInvoiceItem.findFirst({ where: { feeHeadId: id } });
    if (usedInInvoice) {
      throw new BadRequestException('Fee head is used in an invoice and cannot be deleted');
    }
    await this.prisma.feeHead.delete({ where: { id } });
  }

  private async getFeeHeadOrFail(organizationId: string, id: string) {
    const feeHead = await this.prisma.feeHead.findFirst({ where: { id, organizationId } });
    if (!feeHead) throw new NotFoundException('Fee head not found');
    return feeHead;
  }

  // ─── Fee Structures ───────────────────────────────────────────

  async createFeeStructure(organizationId: string, dto: CreateFeeStructureDto) {
    return this.prisma.$transaction(async (tx) => {
      const feeStructure = await tx.feeStructure.create({
        data: {
          organizationId,
          academicYearId: dto.academicYearId,
          classId: dto.classId,
          name: dto.name,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.feeStructureItem.createMany({
          data: dto.items.map((item) => ({
            feeStructureId: feeStructure.id,
            feeHeadId: item.feeHeadId,
            amount: item.amount,
            frequency: item.frequency,
            ...(item.dueDay !== undefined ? { dueDay: item.dueDay } : {}),
          })),
        });
      }

      return tx.feeStructure.findUnique({
        where: { id: feeStructure.id },
        include: { items: { include: { feeHead: true } } },
      });
    });
  }

  async findFeeStructures(
    organizationId: string,
    filters: { academicYearId?: string; classId?: string; status?: string },
  ) {
    return this.prisma.feeStructure.findMany({
      where: {
        organizationId,
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { items: { include: { feeHead: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFeeStructure(organizationId: string, id: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id, organizationId },
      include: { items: { include: { feeHead: true } } },
    });
    if (!feeStructure) throw new NotFoundException('Fee structure not found');
    return feeStructure;
  }

  async publishFeeStructure(organizationId: string, id: string) {
    const feeStructure = await this.findFeeStructure(organizationId, id);
    if (feeStructure.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT fee structures can be published');
    }
    return this.prisma.feeStructure.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      include: { items: { include: { feeHead: true } } },
    });
  }

  async deleteFeeStructure(organizationId: string, id: string) {
    const feeStructure = await this.findFeeStructure(organizationId, id);
    if (feeStructure.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT fee structures can be deleted');
    }
    const hasAssignments = await this.prisma.studentFeeAssignment.findFirst({
      where: { feeStructureId: id },
    });
    if (hasAssignments) {
      throw new BadRequestException('Fee structure has student assignments and cannot be deleted');
    }
    await this.prisma.feeStructure.delete({ where: { id } });
  }

  // ─── Student Fee Assignments ──────────────────────────────────

  async assignFeeStructure(organizationId: string, dto: CreateStudentFeeAssignmentDto) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, organizationId },
    });
    if (!feeStructure) throw new NotFoundException('Fee structure not found');
    if (feeStructure.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED fee structures can be assigned to students');
    }

    const existing = await this.prisma.studentFeeAssignment.findFirst({
      where: {
        studentId: dto.studentId,
        enrollmentId: dto.enrollmentId,
        feeStructureId: dto.feeStructureId,
        status: 'ACTIVE',
      },
    });
    if (existing) {
      throw new BadRequestException('Student already has this fee structure assigned');
    }

    return this.prisma.studentFeeAssignment.create({
      data: {
        studentId: dto.studentId,
        enrollmentId: dto.enrollmentId,
        feeStructureId: dto.feeStructureId,
        discountAmount: dto.discountAmount ?? 0,
        scholarshipAmount: dto.scholarshipAmount ?? 0,
        effectiveFrom: new Date(dto.effectiveFrom),
        ...(dto.effectiveTo ? { effectiveTo: new Date(dto.effectiveTo) } : {}),
      },
      include: { feeStructure: true },
    });
  }

  async findStudentFeeAssignments(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId },
    });
    if (!student) throw new NotFoundException('Student not found');
    return this.prisma.studentFeeAssignment.findMany({
      where: { studentId },
      include: { feeStructure: { include: { items: { include: { feeHead: true } } } } },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async updateFeeAssignmentStatus(organizationId: string, assignmentId: string, status: string) {
    const assignment = await this.prisma.studentFeeAssignment.findFirst({
      where: { id: assignmentId },
      include: { feeStructure: true },
    });
    if (!assignment || assignment.feeStructure.organizationId !== organizationId) {
      throw new NotFoundException('Fee assignment not found');
    }
    return this.prisma.studentFeeAssignment.update({
      where: { id: assignmentId },
      data: { status },
    });
  }

  // ─── Fee Invoices ─────────────────────────────────────────────

  async createInvoice(organizationId: string, dto: CreateFeeInvoiceDto, _createdBy: string) {
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    return this.prisma.$transaction(async (tx) => {
      let subtotal = new Decimal(0);
      let totalDiscount = new Decimal(0);

      const itemsData = dto.items.map((item) => {
        const amount = new Decimal(item.amount);
        const discount = new Decimal(item.discount ?? 0);
        const netAmount = amount.minus(discount);
        subtotal = subtotal.plus(amount);
        totalDiscount = totalDiscount.plus(discount);
        return {
          feeHeadId: item.feeHeadId,
          description: item.description as string | undefined,
          amount,
          discount,
          netAmount,
        };
      });

      const fine = new Decimal(dto.fine ?? 0);
      const total = subtotal.minus(totalDiscount).plus(fine);

      const invoice = await tx.feeInvoice.create({
        data: {
          organizationId,
          studentId: dto.studentId,
          enrollmentId: dto.enrollmentId,
          invoiceNumber,
          invoiceDate: new Date(dto.invoiceDate),
          dueDate: new Date(dto.dueDate),
          subtotal,
          discount: totalDiscount,
          fine,
          total,
          status: 'ISSUED',
        },
      });

      await tx.feeInvoiceItem.createMany({
        data: itemsData.map((item) => ({
          invoiceId: invoice.id,
          feeHeadId: item.feeHeadId,
          ...(item.description ? { description: item.description } : {}),
          amount: item.amount,
          discount: item.discount,
          netAmount: item.netAmount,
        })),
      });

      return tx.feeInvoice.findUnique({
        where: { id: invoice.id },
        include: { items: { include: { feeHead: true } }, allocations: true },
      });
    });
  }

  async findInvoices(
    organizationId: string,
    filters: { studentId?: string; enrollmentId?: string; status?: string },
  ) {
    return this.prisma.feeInvoice.findMany({
      where: {
        organizationId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.enrollmentId ? { enrollmentId: filters.enrollmentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { items: { include: { feeHead: true } }, allocations: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findInvoice(organizationId: string, id: string) {
    const invoice = await this.prisma.feeInvoice.findFirst({
      where: { id, organizationId },
      include: { items: { include: { feeHead: true } }, allocations: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async cancelInvoice(organizationId: string, id: string) {
    const invoice = await this.findInvoice(organizationId, id);
    if (['PAID', 'CANCELLED'].includes(invoice.status)) {
      throw new BadRequestException(`Invoice with status '${invoice.status}' cannot be cancelled`);
    }
    const hasPayments = await this.prisma.paymentAllocation.findFirst({ where: { invoiceId: id } });
    if (hasPayments) {
      throw new BadRequestException('Invoice has payments applied and cannot be cancelled');
    }
    return this.prisma.feeInvoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: { include: { feeHead: true } }, allocations: true },
    });
  }

  // ─── Payments ─────────────────────────────────────────────────

  async recordPayment(organizationId: string, dto: RecordPaymentDto, receivedBy: string) {
    const receiptNumber = await this.generateReceiptNumber(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          organizationId,
          studentId: dto.studentId,
          receiptNumber,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          ...(dto.transactionReference ? { transactionReference: dto.transactionReference } : {}),
          paymentDate: new Date(dto.paymentDate),
          receivedBy,
          status: 'CONFIRMED',
        },
      });

      if (dto.allocations && dto.allocations.length > 0) {
        const totalAllocated = dto.allocations.reduce(
          (sum: number, a: { invoiceId: string; amount: number }) => sum + a.amount,
          0,
        );
        if (totalAllocated > dto.amount) {
          throw new BadRequestException('Total allocations exceed payment amount');
        }

        for (const allocation of dto.allocations) {
          const invoice = await tx.feeInvoice.findFirst({
            where: { id: allocation.invoiceId, organizationId },
          });
          if (!invoice) {
            throw new NotFoundException(`Invoice ${allocation.invoiceId} not found`);
          }
          if (['CANCELLED', 'PAID'].includes(invoice.status)) {
            throw new BadRequestException(`Invoice ${allocation.invoiceId} is ${invoice.status}`);
          }

          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: allocation.invoiceId,
              amount: allocation.amount,
            },
          });

          const allAllocations = await tx.paymentAllocation.findMany({
            where: { invoiceId: allocation.invoiceId },
          });
          const totalPaid = allAllocations.reduce(
            (sum: Decimal, a: PaymentAllocation) => sum.plus(a.amount),
            new Decimal(0),
          );
          const newStatus = totalPaid.greaterThanOrEqualTo(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';
          await tx.feeInvoice.update({ where: { id: allocation.invoiceId }, data: { status: newStatus } });
        }
      }

      return tx.feePayment.findUnique({
        where: { id: payment.id },
        include: { allocations: { include: { invoice: true } }, refunds: true },
      });
    });
  }

  async findPayments(
    organizationId: string,
    filters: { studentId?: string; status?: string },
  ) {
    return this.prisma.feePayment.findMany({
      where: {
        organizationId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { allocations: { include: { invoice: true } }, refunds: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findPayment(organizationId: string, id: string) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id, organizationId },
      include: { allocations: { include: { invoice: true } }, refunds: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // ─── Refunds ──────────────────────────────────────────────────

  async createRefund(organizationId: string, paymentId: string, dto: CreateRefundDto, approvedBy: string) {
    const payment = await this.findPayment(organizationId, paymentId);
    if (payment.status === 'REFUNDED') {
      throw new BadRequestException('Payment has already been fully refunded');
    }

    const existingRefunds = await this.prisma.feeRefund.findMany({ where: { paymentId } });
    const totalRefunded = existingRefunds.reduce(
      (sum: Decimal, r: FeeRefund) => sum.plus(r.amount),
      new Decimal(0),
    );
    const available = new Decimal(payment.amount).minus(totalRefunded);
    if (new Decimal(dto.amount).greaterThan(available)) {
      throw new BadRequestException(
        `Refund amount exceeds available balance. Available: ${available}`,
      );
    }

    const refundNumber = await this.generateRefundNumber(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.feeRefund.create({
        data: {
          paymentId,
          refundNumber,
          amount: dto.amount,
          reason: dto.reason,
          refundMethod: dto.refundMethod,
          ...(dto.transactionReference ? { transactionReference: dto.transactionReference } : {}),
          status: 'APPROVED',
          approvedBy,
          processedAt: new Date(),
        },
      });

      const newTotalRefunded = totalRefunded.plus(dto.amount);
      if (newTotalRefunded.greaterThanOrEqualTo(payment.amount)) {
        await tx.feePayment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });
      }

      return refund;
    });
  }

  async findRefunds(organizationId: string, paymentId: string) {
    await this.findPayment(organizationId, paymentId);
    return this.prisma.feeRefund.findMany({
      where: { paymentId },
      orderBy: { processedAt: 'desc' },
    });
  }

  // ─── Student Ledger ───────────────────────────────────────────

  async getStudentLedger(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organizationId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const [invoices, payments] = await Promise.all([
      this.prisma.feeInvoice.findMany({
        where: { studentId, organizationId },
        include: { items: { include: { feeHead: true } }, allocations: true },
        orderBy: { invoiceDate: 'asc' },
      }),
      this.prisma.feePayment.findMany({
        where: { studentId, organizationId, status: { in: ['CONFIRMED', 'REFUNDED'] } },
        include: { allocations: true, refunds: true },
        orderBy: { paymentDate: 'asc' },
      }),
    ]);

    const totalBilled = invoices
      .filter((i: FeeInvoice) => i.status !== 'CANCELLED')
      .reduce((sum: Decimal, i: FeeInvoice) => sum.plus(i.total), new Decimal(0));

    const totalPaid = payments.reduce(
      (sum: Decimal, p: FeePayment) => sum.plus(p.amount),
      new Decimal(0),
    );

    const totalRefunded = payments
      .flatMap((p: FeePayment & { refunds: FeeRefund[] }) => p.refunds)
      .reduce((sum: Decimal, r: FeeRefund) => sum.plus(r.amount), new Decimal(0));

    const balance = totalBilled.minus(totalPaid).plus(totalRefunded);

    return { studentId, totalBilled, totalPaid, totalRefunded, balance, invoices, payments };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.feeInvoice.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generateReceiptNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.feePayment.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    return `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generateRefundNumber(_organizationId: string): Promise<string> {
    const count = await this.prisma.feeRefund.count({});
    const year = new Date().getFullYear();
    return `REF-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
