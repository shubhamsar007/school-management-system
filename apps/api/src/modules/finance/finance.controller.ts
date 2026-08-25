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
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateFeeHeadDto } from './dto/create-fee-head.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateStudentFeeAssignmentDto } from './dto/create-student-fee-assignment.dto';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finance', version: '1' })
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ─── Fee Heads ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a fee head (e.g. Tuition, Transport)' })
  @Post('fee-heads')
  createFeeHead(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateFeeHeadDto,
  ) {
    return this.financeService.createFeeHead(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all fee heads' })
  @ApiQuery({ name: 'category', required: false })
  @Get('fee-heads')
  findFeeHeads(
    @CurrentUser() user: CurrentUserPayload,
    @Query('category') category?: string,
  ) {
    return this.financeService.findFeeHeads(user.organizationId, category);
  }

  @ApiOperation({ summary: 'Update a fee head' })
  @Patch('fee-heads/:id')
  updateFeeHead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateFeeHeadDto,
  ) {
    return this.financeService.updateFeeHead(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a fee head' })
  @Delete('fee-heads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFeeHead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteFeeHead(user.organizationId, id);
  }

  // ─── Fee Structures ───────────────────────────────────────────

  @ApiOperation({ summary: 'Create a fee structure with line items' })
  @Post('fee-structures')
  createFeeStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateFeeStructureDto,
  ) {
    return this.financeService.createFeeStructure(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all fee structures' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'DRAFT | PUBLISHED' })
  @Get('fee-structures')
  findFeeStructures(
    @CurrentUser() user: CurrentUserPayload,
    @Query('academicYearId') academicYearId?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findFeeStructures(user.organizationId, {
      ...(academicYearId ? { academicYearId } : {}),
      ...(classId ? { classId } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a fee structure by ID' })
  @Get('fee-structures/:id')
  findFeeStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.findFeeStructure(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Publish a fee structure (DRAFT → PUBLISHED)' })
  @Patch('fee-structures/:id/publish')
  publishFeeStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.publishFeeStructure(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Delete a DRAFT fee structure' })
  @Delete('fee-structures/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFeeStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteFeeStructure(user.organizationId, id);
  }

  // ─── Student Fee Assignments ──────────────────────────────────

  @ApiOperation({ summary: 'Assign a fee structure to a student' })
  @Post('fee-assignments')
  assignFeeStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateStudentFeeAssignmentDto,
  ) {
    return this.financeService.assignFeeStructure(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List fee assignments for a student' })
  @Get('students/:studentId/fee-assignments')
  findStudentFeeAssignments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.financeService.findStudentFeeAssignments(user.organizationId, studentId);
  }

  @ApiOperation({ summary: 'Update fee assignment status (ACTIVE | INACTIVE)' })
  @Patch('fee-assignments/:id/status')
  updateFeeAssignmentStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.financeService.updateFeeAssignmentStatus(user.organizationId, id, status);
  }

  // ─── Invoices ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create and issue a fee invoice' })
  @Post('invoices')
  createInvoice(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateFeeInvoiceDto,
  ) {
    return this.financeService.createInvoice(user.organizationId, dto, user.userId);
  }

  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'enrollmentId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'ISSUED | PARTIALLY_PAID | PAID | OVERDUE | CANCELLED' })
  @Get('invoices')
  findInvoices(
    @CurrentUser() user: CurrentUserPayload,
    @Query('studentId') studentId?: string,
    @Query('enrollmentId') enrollmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findInvoices(user.organizationId, {
      ...(studentId ? { studentId } : {}),
      ...(enrollmentId ? { enrollmentId } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Get an invoice by ID' })
  @Get('invoices/:id')
  findInvoice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.findInvoice(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Cancel an invoice' })
  @Patch('invoices/:id/cancel')
  cancelInvoice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.cancelInvoice(user.organizationId, id);
  }

  // ─── Payments ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Record a fee payment and optionally allocate to invoices' })
  @Post('payments')
  recordPayment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.financeService.recordPayment(user.organizationId, dto, user.userId);
  }

  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING | CONFIRMED | FAILED | REFUNDED' })
  @Get('payments')
  findPayments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findPayments(user.organizationId, {
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a payment by ID' })
  @Get('payments/:id')
  findPayment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.financeService.findPayment(user.organizationId, id);
  }

  // ─── Refunds ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a refund for a payment' })
  @Post('payments/:paymentId/refunds')
  createRefund(
    @CurrentUser() user: CurrentUserPayload,
    @Param('paymentId') paymentId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.financeService.createRefund(user.organizationId, paymentId, dto, user.userId);
  }

  @ApiOperation({ summary: 'List refunds for a payment' })
  @Get('payments/:paymentId/refunds')
  findRefunds(
    @CurrentUser() user: CurrentUserPayload,
    @Param('paymentId') paymentId: string,
  ) {
    return this.financeService.findRefunds(user.organizationId, paymentId);
  }

  // ─── Student Ledger ───────────────────────────────────────────

  @ApiOperation({ summary: 'Get full fee ledger for a student (billed vs paid vs balance)' })
  @Get('students/:studentId/ledger')
  getStudentLedger(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.financeService.getStudentLedger(user.organizationId, studentId);
  }
}
