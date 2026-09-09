import { apiClient } from './api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalaryComponent {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  componentType: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE_OF_BASIC' | 'PERCENTAGE_OF_GROSS';
  isTaxable: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EmployeeSalaryComponent {
  id: string;
  salaryStructureId: string;
  salaryComponentId: string;
  amount: string | null;
  percentage: string | null;
  salaryComponent: SalaryComponent;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  basicSalary: string;
  grossSalary: string;
  status: 'ACTIVE' | 'SUPERSEDED';
  components: EmployeeSalaryComponent[];
}

export interface PayrollRun {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'APPROVED' | 'PAID';
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { records: number };
}

export interface PayrollItem {
  id: string;
  payrollRecordId: string;
  salaryComponentId: string;
  amount: string;
  salaryComponent: SalaryComponent;
}

export interface PayrollRecord {
  id: string;
  payrollRunId: string;
  employeeId: string;
  workingDays: number | null;
  presentDays: string | null;   // Decimal — can be 0.5 for half-days
  absentDays: number | null;
  halfDayCount: number | null;
  paidLeaveDays: string | null;
  unpaidLeaveDays: string | null;
  lopDays: string | null;
  lopAmount: string | null;
  overtimeHours: string | null;
  basic: string;
  gross: string;
  totalDeductions: string;
  netSalary: string;
  status: 'PENDING' | 'PAID' | 'HELD';
  items: PayrollItem[];
  payrollRun: PayrollRun;
}

// ─── Validation report ────────────────────────────────────────────────────────

export interface ValidationEmployeeResult {
  employeeId: string;
  employeeNumber: string;
  name: string;
  hasSalaryStructure: boolean;
  hasAttendanceData: boolean;
  attendanceDays: number;
  approvedLeaves: number;
  issues: string[];
}

export interface ValidationReport {
  runId: string;
  period: { start: string; end: string };
  summary: {
    totalEmployees: number;
    readyToProcess: number;
    withIssues: number;
    missingStructure: number;
    missingAttendance: number;
  };
  canProcess: boolean;
  employees: ValidationEmployeeResult[];
}

export interface PayrollRunDetail extends PayrollRun {
  records: PayrollRecord[];
}

export interface Payslip {
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    designation?: string;
    department?: string;
  };
  period: { start: string; end: string };
  attendance: { workingDays: number; presentDays: number };
  earnings: { name: string; code: string; amount: string }[];
  deductions: { name: string; code: string; amount: string }[];
  summary: {
    basic: string;
    gross: string;
    totalDeductions: string;
    netSalary: string;
  };
  status: string;
}

// ─── Adjustment & Loan types ──────────────────────────────────────────────────

export type AdjustmentType = 'BONUS' | 'OVERTIME' | 'ARREAR' | 'REIMBURSEMENT' | 'DEDUCTION' | 'OTHER';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INCLUDED';
export type LoanType = 'SALARY_ADVANCE' | 'PERSONAL_LOAN' | 'VEHICLE_LOAN' | 'OTHER';
export type LoanStatus = 'ACTIVE' | 'COMPLETED' | 'CLOSED';

export interface PayrollAdjustment {
  id: string;
  organizationId: string;
  employeeId: string;
  adjustmentType: AdjustmentType;
  subType: string | null;
  description: string | null;
  amount: string;                  // Decimal
  effectivePeriod: string;         // YYYY-MM
  status: AdjustmentStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  payrollRecordId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  payrollRecord?: { id: string; netSalary: string } | null;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  payrollRunId: string | null;
  amount: string;
  paidAt: string | null;
  status: 'PENDING' | 'PAID';
}

export interface EmployeeLoan {
  id: string;
  organizationId: string;
  employeeId: string;
  loanType: LoanType;
  principalAmount: string;
  outstandingAmount: string;
  monthlyDeduction: string;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  status: LoanStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  installments?: LoanInstallment[];
}

// ─── Request payload types ────────────────────────────────────────────────────

export interface CreateSalaryComponentData {
  name: string;
  code: string;
  componentType: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE_OF_BASIC' | 'PERCENTAGE_OF_GROSS';
  isTaxable?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface SalaryComponentLineData {
  salaryComponentId: string;
  amount?: number;
  percentage?: number;
}

export interface CreateSalaryStructureData {
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  basicSalary: number;
  grossSalary: number;
  components?: SalaryComponentLineData[];
}

export interface CreatePayrollRunData {
  periodStart: string;
  periodEnd: string;
}

export interface ProcessPayrollRunData {
  employeeIds?: string[];
}

export interface CreateAdjustmentData {
  employeeId: string;
  adjustmentType: AdjustmentType;
  subType?: string;
  description?: string;
  amount: number;
  effectivePeriod: string;   // YYYY-MM
}

export interface CreateLoanData {
  employeeId: string;
  loanType: LoanType;
  principalAmount: number;
  monthlyDeduction: number;
  startDate: string;         // ISO date string
  reason?: string;
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

export function formatPeriod(start: string, end: string): string {
  if (!start || !end) return '—';
  const s = new Date(start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Payroll API ──────────────────────────────────────────────────────────────

export const payrollApi = {
  salaryComponents: {
    list: (params?: { componentType?: string }) =>
      apiClient.get<SalaryComponent[]>(`/payroll/salary-components${buildQuery(params)}`),
    create: (data: CreateSalaryComponentData) =>
      apiClient.post<SalaryComponent>('/payroll/salary-components', data),
    update: (id: string, data: Partial<CreateSalaryComponentData>) =>
      apiClient.patch<SalaryComponent>(`/payroll/salary-components/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/payroll/salary-components/${id}`),
  },

  salaryStructures: {
    listForEmployee: (employeeId: string) =>
      apiClient.get<SalaryStructure[]>(`/payroll/employees/${employeeId}/salary-structures`),
    getActive: (employeeId: string) =>
      apiClient.get<SalaryStructure>(`/payroll/employees/${employeeId}/salary-structures/active`),
    create: (data: CreateSalaryStructureData) =>
      apiClient.post<SalaryStructure>('/payroll/salary-structures', data),
  },

  runs: {
    list: (params?: { status?: string }) =>
      apiClient.get<PayrollRun[]>(`/payroll/runs${buildQuery(params)}`),
    get: (id: string) =>
      apiClient.get<PayrollRunDetail>(`/payroll/runs/${id}`),
    create: (data: CreatePayrollRunData) =>
      apiClient.post<PayrollRun>('/payroll/runs', data),
    process: (id: string, data?: ProcessPayrollRunData) =>
      apiClient.post<PayrollRun>(`/payroll/runs/${id}/process`, data ?? {}),
    approve: (id: string) =>
      apiClient.patch<PayrollRun>(`/payroll/runs/${id}/approve`, {}),
    markPaid: (id: string) =>
      apiClient.patch<PayrollRun>(`/payroll/runs/${id}/mark-paid`, {}),
    holdRecord: (runId: string, recordId: string) =>
      apiClient.patch<PayrollRecord>(`/payroll/runs/${runId}/records/${recordId}/hold`, {}),
    validate: (id: string) =>
      apiClient.get<ValidationReport>(`/payroll/runs/${id}/validate`),
  },

  payslips: {
    get: (runId: string, employeeId: string) =>
      apiClient.get<Payslip>(`/payroll/runs/${runId}/payslips/${employeeId}`),
  },

  employees: {
    history: (employeeId: string) =>
      apiClient.get<PayrollRecord[]>(`/payroll/employees/${employeeId}/history`),
  },

  adjustments: {
    list: (params?: { employeeId?: string; adjustmentType?: string; status?: string; effectivePeriod?: string }) =>
      apiClient.get<PayrollAdjustment[]>(`/payroll/adjustments${buildQuery(params)}`),
    create: (data: CreateAdjustmentData) =>
      apiClient.post<PayrollAdjustment>('/payroll/adjustments', data),
    approve: (id: string) =>
      apiClient.patch<PayrollAdjustment>(`/payroll/adjustments/${id}/approve`, {}),
    reject: (id: string, reason?: string) =>
      apiClient.patch<PayrollAdjustment>(`/payroll/adjustments/${id}/reject`, { rejectionReason: reason }),
  },

  loans: {
    list: (params?: { employeeId?: string; status?: string; loanType?: string }) =>
      apiClient.get<EmployeeLoan[]>(`/payroll/loans${buildQuery(params)}`),
    get: (id: string) =>
      apiClient.get<EmployeeLoan>(`/payroll/loans/${id}`),
    create: (data: CreateLoanData) =>
      apiClient.post<EmployeeLoan>('/payroll/loans', data),
    close: (id: string) =>
      apiClient.patch<EmployeeLoan>(`/payroll/loans/${id}/close`, {}),
  },
};
