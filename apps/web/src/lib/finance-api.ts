import { apiClient } from './api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeeHead {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: string;
  isRefundable: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FeeStructureItem {
  id: string;
  feeStructureId: string;
  feeHeadId: string;
  amount: string;
  frequency: string;
  dueDay?: number;
  feeHead: FeeHead;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYearId: string;
  classId: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  items: FeeStructureItem[];
}

export interface StudentFeeAssignment {
  id: string;
  studentId: string;
  enrollmentId: string;
  feeStructureId: string;
  discountAmount: string;
  scholarshipAmount: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  feeStructure: FeeStructure;
}

export interface FeeInvoiceItem {
  id: string;
  invoiceId: string;
  feeHeadId: string;
  description?: string;
  amount: string;
  discount: string;
  netAmount: string;
  feeHead: FeeHead;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  enrollmentId: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  discount: string;
  fine: string;
  total: string;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: FeeInvoiceItem[];
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: string;
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  amount: string;
  paymentMethod: string;
  transactionReference?: string;
  paymentDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  allocations: PaymentAllocation[];
}

export interface FeeRefund {
  id: string;
  paymentId: string;
  refundNumber: string;
  amount: string;
  reason: string;
  refundMethod: string;
  transactionReference?: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED';
  processedAt?: string;
}

export interface StudentLedger {
  totalBilled: string;
  totalPaid: string;
  totalRefunded: string;
  balance: string;
}

// ─── Request payload types ────────────────────────────────────────────────────

export interface CreateFeeHeadData {
  name: string;
  code: string;
  category: string;
  isRefundable?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateFeeStructureData {
  academicYearId: string;
  classId: string;
  name: string;
  items?: {
    feeHeadId: string;
    amount: number;
    frequency: string;
    dueDay?: number | undefined;
  }[];
}

export interface CreateFeeAssignmentData {
  studentId: string;
  enrollmentId: string;
  feeStructureId: string;
  discountAmount?: number | undefined;
  scholarshipAmount?: number | undefined;
  effectiveFrom: string;
  effectiveTo?: string | undefined;
}

export interface CreateInvoiceData {
  studentId: string;
  enrollmentId: string;
  invoiceDate: string;
  dueDate: string;
  fine?: number | undefined;
  items: {
    feeHeadId: string;
    description?: string | undefined;
    amount: number;
    discount?: number | undefined;
  }[];
}

export interface RecordPaymentData {
  studentId: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string | undefined;
  paymentDate: string;
  allocations?: {
    invoiceId: string;
    amount: number;
  }[] | undefined;
}

export interface CreateRefundData {
  amount: number;
  reason: string;
  refundMethod: string;
  transactionReference?: string | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export function formatCurrency(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Finance API ──────────────────────────────────────────────────────────────

export const financeApi = {
  feeHeads: {
    list: (params?: { category?: string }) =>
      apiClient.get<FeeHead[]>(`/finance/fee-heads${buildQuery(params)}`),
    create: (data: CreateFeeHeadData) =>
      apiClient.post<FeeHead>('/finance/fee-heads', data),
    update: (id: string, data: Partial<CreateFeeHeadData>) =>
      apiClient.patch<FeeHead>(`/finance/fee-heads/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/finance/fee-heads/${id}`),
  },

  feeStructures: {
    list: (params?: { academicYearId?: string; classId?: string; status?: string }) =>
      apiClient.get<FeeStructure[]>(`/finance/fee-structures${buildQuery(params)}`),
    get: (id: string) =>
      apiClient.get<FeeStructure>(`/finance/fee-structures/${id}`),
    create: (data: CreateFeeStructureData) =>
      apiClient.post<FeeStructure>('/finance/fee-structures', data),
    publish: (id: string) =>
      apiClient.patch<FeeStructure>(`/finance/fee-structures/${id}/publish`, {}),
    delete: (id: string) =>
      apiClient.delete(`/finance/fee-structures/${id}`),
  },

  feeAssignments: {
    listForStudent: (studentId: string) =>
      apiClient.get<StudentFeeAssignment[]>(`/finance/students/${studentId}/fee-assignments`),
    create: (data: CreateFeeAssignmentData) =>
      apiClient.post<StudentFeeAssignment>('/finance/fee-assignments', data),
    updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
      apiClient.patch<StudentFeeAssignment>(`/finance/fee-assignments/${id}/status`, { status }),
  },

  invoices: {
    list: (params?: { studentId?: string; enrollmentId?: string; status?: string }) =>
      apiClient.get<FeeInvoice[]>(`/finance/invoices${buildQuery(params)}`),
    get: (id: string) =>
      apiClient.get<FeeInvoice>(`/finance/invoices/${id}`),
    create: (data: CreateInvoiceData) =>
      apiClient.post<FeeInvoice>('/finance/invoices', data),
    cancel: (id: string) =>
      apiClient.patch<FeeInvoice>(`/finance/invoices/${id}/cancel`, {}),
  },

  payments: {
    list: (params?: { studentId?: string; status?: string }) =>
      apiClient.get<FeePayment[]>(`/finance/payments${buildQuery(params)}`),
    get: (id: string) =>
      apiClient.get<FeePayment>(`/finance/payments/${id}`),
    record: (data: RecordPaymentData) =>
      apiClient.post<FeePayment>('/finance/payments', data),
  },

  refunds: {
    list: (paymentId: string) =>
      apiClient.get<FeeRefund[]>(`/finance/payments/${paymentId}/refunds`),
    create: (paymentId: string, data: CreateRefundData) =>
      apiClient.post<FeeRefund>(`/finance/payments/${paymentId}/refunds`, data),
  },

  ledger: {
    get: (studentId: string) =>
      apiClient.get<StudentLedger>(`/finance/students/${studentId}/ledger`),
  },
};
