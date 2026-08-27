'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Avatar, KpiCard, SearchBar, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface PayrollRun { id: string; runId: string; period: string; employees: number; gross: string; deductions: string; net: string; status: string; }
interface Payslip { id: string; name: string; designation: string; employeeId: string; period: string; gross: string; deductions: string; net: string; status: string; }
interface SalaryComponent { id: string; name: string; code: string; type: string; calculation: string; taxable: string; }

const RUNS: PayrollRun[] = [
  { id: '1', runId: 'RUN-2024-08', period: 'Aug 2024', employees: 82, gross: '₹21.2L', deductions: '₹2.8L', net: '₹18.4L', status: 'COMPLETED' },
  { id: '2', runId: 'RUN-2024-07', period: 'Jul 2024', employees: 80, gross: '₹20.8L', deductions: '₹2.6L', net: '₹18.2L', status: 'COMPLETED' },
  { id: '3', runId: 'RUN-2024-06', period: 'Jun 2024', employees: 80, gross: '₹20.8L', deductions: '₹2.6L', net: '₹18.2L', status: 'COMPLETED' },
  { id: '4', runId: 'RUN-2024-05', period: 'May 2024', employees: 79, gross: '₹20.4L', deductions: '₹2.5L', net: '₹17.9L', status: 'COMPLETED' },
  { id: '5', runId: 'RUN-2024-04', period: 'Apr 2024', employees: 79, gross: '₹20.4L', deductions: '₹2.5L', net: '₹17.9L', status: 'COMPLETED' },
  { id: '6', runId: 'RUN-2024-09', period: 'Sep 2024', employees: 87, gross: '₹22.0L', deductions: '₹2.9L', net: '₹19.1L', status: 'DRAFT' },
];

const PAYSLIPS: Payslip[] = [
  { id: '1', name: 'Priya Sharma', designation: 'Senior Teacher', employeeId: 'EMP-2019-0042', period: 'Aug 2024', gross: '₹62,000', deductions: '₹8,200', net: '₹53,800', status: 'PAID' },
  { id: '2', name: 'Ravi Kumar', designation: 'Teacher', employeeId: 'EMP-2021-0078', period: 'Aug 2024', gross: '₹48,000', deductions: '₹6,400', net: '₹41,600', status: 'PAID' },
  { id: '3', name: 'Ananya Das', designation: 'Teacher', employeeId: 'EMP-2020-0055', period: 'Aug 2024', gross: '₹52,000', deductions: '₹6,900', net: '₹45,100', status: 'PAID' },
  { id: '4', name: 'Suresh Menon', designation: 'Senior Teacher', employeeId: 'EMP-2018-0023', period: 'Aug 2024', gross: '₹66,000', deductions: '₹8,700', net: '₹57,300', status: 'PAID' },
  { id: '5', name: 'Lakshmi Nair', designation: 'Teacher', employeeId: 'EMP-2022-0091', period: 'Aug 2024', gross: '₹44,000', deductions: '₹5,900', net: '₹38,100', status: 'PAID' },
  { id: '6', name: 'Amit Joshi', designation: 'Teacher', employeeId: 'EMP-2023-0104', period: 'Aug 2024', gross: '₹44,000', deductions: '₹5,900', net: '₹38,100', status: 'PENDING' },
  { id: '7', name: 'Deepa Rao', designation: 'Senior Teacher', employeeId: 'EMP-2017-0011', period: 'Aug 2024', gross: '₹70,000', deductions: '₹9,200', net: '₹60,800', status: 'PAID' },
  { id: '8', name: 'Kiran Bhat', designation: 'Teacher', employeeId: 'EMP-2024-0112', period: 'Aug 2024', gross: '₹40,000', deductions: '₹5,400', net: '₹34,600', status: 'PAID' },
];

const COMPONENTS: SalaryComponent[] = [
  { id: '1', name: 'Basic Salary', code: 'BASIC', type: 'EARNING', calculation: 'Fixed', taxable: 'YES' },
  { id: '2', name: 'House Rent Allowance', code: 'HRA', type: 'EARNING', calculation: '40% of Basic', taxable: 'NO' },
  { id: '3', name: 'Provident Fund', code: 'PF', type: 'DEDUCTION', calculation: '12% of Basic', taxable: 'NO' },
  { id: '4', name: 'Professional Tax', code: 'PT', type: 'DEDUCTION', calculation: 'Fixed', taxable: 'YES' },
  { id: '5', name: 'Medical Allowance', code: 'MED', type: 'EARNING', calculation: 'Fixed', taxable: 'NO' },
  { id: '6', name: 'Transport Allowance', code: 'TA', type: 'EARNING', calculation: 'Fixed', taxable: 'NO' },
  { id: '7', name: 'Income Tax (TDS)', code: 'TDS', type: 'DEDUCTION', calculation: '% of Gross', taxable: 'YES' },
  { id: '8', name: 'Performance Bonus', code: 'BONUS', type: 'EARNING', calculation: 'Fixed', taxable: 'YES' },
];

const TABS = [{ id: 'runs', label: 'Payroll Runs', count: 8 }, { id: 'payslips', label: 'Payslips', count: 82 }, { id: 'components', label: 'Salary Components', count: 12 }];
const RUN_BADGE: Record<string, 'active' | 'pending' | 'default' | 'left'> = { COMPLETED: 'active', PROCESSING: 'pending', DRAFT: 'default', FAILED: 'left' };

export default function PayrollPage() {
  const [activeTab, setActiveTab] = React.useState('runs');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const runColumns: ColumnDef<PayrollRun>[] = [
    { id: 'runId', header: 'RUN ID', width: '130px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.runId}</span> },
    { id: 'period', header: 'PERIOD', width: '120px', accessor: 'period' },
    { id: 'employees', header: 'EMPLOYEES', width: '100px', align: 'center', accessor: (r) => r.employees },
    { id: 'gross', header: 'GROSS', width: '90px', align: 'right', accessor: 'gross' },
    { id: 'deductions', header: 'DEDUCTIONS', width: '110px', align: 'right', accessor: 'deductions' },
    { id: 'net', header: 'NET', width: '90px', align: 'right', cell: (r) => <span className="font-semibold">{r.net}</span> },
    { id: 'status', header: 'STATUS', width: '100px', cell: (r) => <Badge variant={RUN_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '100px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>View</button><span className="text-[#d7dce1]">|</span><button>Download</button></div> },
  ];

  const payslipColumns: ColumnDef<Payslip>[] = [
    { id: 'name', header: 'EMPLOYEE', width: 'minmax(160px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size="md" /><div><div className="text-sm font-medium">{r.name}</div><div className="text-[11px] text-[#8a929b]">{r.designation}</div></div></div> },
    { id: 'employeeId', header: 'EMPLOYEE ID', width: '120px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.employeeId}</span> },
    { id: 'period', header: 'PERIOD', width: '100px', accessor: 'period' },
    { id: 'gross', header: 'GROSS', width: '100px', align: 'right', accessor: 'gross' },
    { id: 'deductions', header: 'DEDUCTIONS', width: '110px', align: 'right', accessor: 'deductions' },
    { id: 'net', header: 'NET PAY', width: '100px', align: 'right', cell: (r) => <span className="font-semibold text-[#146b41]">{r.net}</span> },
    { id: 'status', header: 'STATUS', width: '90px', cell: (r) => <Badge variant={r.status === 'PAID' ? 'active' : 'pending'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '100px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>View</button><span className="text-[#d7dce1]">|</span><button>Download</button></div> },
  ];

  const componentColumns: ColumnDef<SalaryComponent>[] = [
    { id: 'name', header: 'COMPONENT NAME', width: '180px', accessor: 'name' },
    { id: 'code', header: 'CODE', width: '80px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.code}</span> },
    { id: 'type', header: 'TYPE', width: '100px', cell: (r) => <Badge variant={r.type === 'EARNING' ? 'active' : 'left'}>{r.type}</Badge> },
    { id: 'calculation', header: 'CALCULATION', width: '140px', accessor: 'calculation' },
    { id: 'taxable', header: 'TAXABLE', width: '80px', cell: (r) => <Badge variant={r.taxable === 'YES' ? 'default' : 'graduated'}>{r.taxable}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '90px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>Edit</button><span className="text-[#d7dce1]">|</span><button>Delete</button></div> },
  ];

  const filteredPayslips = PAYSLIPS.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.employeeId.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Salary runs, components, and payslips · 2024–25"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={RUNS} filename="payroll" formats={['csv', 'excel']}
              columns={[{ header: 'Run ID', accessor: 'runId' }, { header: 'Period', accessor: 'period' }, { header: 'Net', accessor: 'net' }]} />
            {activeTab === 'runs' && <Button variant="primary">Run Payroll</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL DISBURSED" value="₹18.4L" subtitle="this month" />
        <KpiCard title="EMPLOYEES PAID" value="82" trend="of 87" trendPositive subtitle="this run" />
        <KpiCard title="PENDING" value="5" trend="₹1.2L" trendPositive={false} subtitle="pending" />
        <KpiCard title="NEXT RUN" value="01 Sep" subtitle="2025" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {activeTab === 'payslips' && (
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
            <SearchBar placeholder="Search employee…" value={search} onChange={setSearch} className="w-64" />
            <div className="flex-1" />
          </div>
        )}

        {activeTab === 'runs' && <DataTable columns={runColumns} data={RUNS} />}
        {activeTab === 'payslips' && <DataTable columns={payslipColumns} data={filteredPayslips} />}
        {activeTab === 'components' && <DataTable columns={componentColumns} data={COMPONENTS} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize}
            total={activeTab === 'runs' ? RUNS.length : activeTab === 'payslips' ? filteredPayslips.length : COMPONENTS.length}
            onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
