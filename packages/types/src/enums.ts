export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT',
  GRADUATED = 'GRADUATED',
  TRANSFERRED = 'TRANSFERRED',
  DECEASED = 'DECEASED',
  SUSPENDED = 'SUSPENDED',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
  RETIRED = 'RETIRED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  HOLIDAY = 'HOLIDAY',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SubstitutionStatus {
  SUGGESTED = 'SUGGESTED',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum FeePaymentMethod {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  CHEQUE = 'CHEQUE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DD = 'DD',
  UPI = 'UPI',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
}

export enum AcademicYearStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  PROMOTED = 'PROMOTED',
  FAILED = 'FAILED',
  LEFT = 'LEFT',
  GRADUATED = 'GRADUATED',
}

export enum PeriodType {
  CLASS = 'CLASS',
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  ASSEMBLY = 'ASSEMBLY',
  ACTIVITY = 'ACTIVITY',
}

export enum EmployeeCategory {
  TEACHING = 'TEACHING',
  NON_TEACHING = 'NON_TEACHING',
  SUPPORT = 'SUPPORT',
  TRANSPORT = 'TRANSPORT',
  ADMINISTRATION = 'ADMINISTRATION',
}
