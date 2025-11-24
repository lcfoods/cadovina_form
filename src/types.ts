
export enum EmployeeStatus {
  ACTIVE = 'Đang làm việc',
  PROBATION = 'Thử việc',
  RESIGNED = 'Đã nghỉ việc',
  LEAVE = 'Nghỉ thai sản/ốm',
}

export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ',
  OTHER = 'Khác',
}

// New Recruitment Types
export enum RecruitmentStatus {
  PENDING = 'Chờ phỏng vấn',
  INTERVIEWED = 'Đã phỏng vấn',
  PASSED = 'Đạt',
  FAILED = 'Không đạt',
  CONVERTED = 'Đã chuyển nhân viên', // Archived state
}

export interface Candidate {
  id: string;
  fullName: string;
  gender: Gender;
  dob: string;
  phone: string;
  email: string;
  identityCard: string; // CCCD
  
  // Address (Simplified for candidate, or full if AI extracted)
  street?: string;
  province?: string;
  district?: string;
  ward?: string;

  appliedPosition: string; // Vị trí ứng tuyển
  cvUrl?: string; // Link or Base64
  interviewDate?: string;
  status: RecruitmentStatus;
  note?: string; // Ghi chú phỏng vấn/đánh giá
}

export interface Department {
  id: string;
  name: string;
  parentId?: string;
}

export interface Position {
  id: string;
  name: string;
}

export interface LocationItem {
  id: string;
  name: string;
  parentId?: string; // District needs provinceId, Ward needs districtId
}

export interface Employee {
  id: string;
  employeeCode: string; // Mã NV
  fullName: string;
  gender: Gender;
  dob: string; // Date string YYYY-MM-DD
  phone: string;
  email: string;
  identityCard: string; // CCCD/CMND
  issuedDate: string;
  issuedPlace: string;
  
  // New Address Structure
  street: string;
  province: string; // Store Name for simplicity in this demo
  district: string;
  ward: string;
  addressLevel: 2 | 3; // 2 cấp or 3 cấp

  department: string;
  position: string;
  startDate: string;
  resignationDate?: string; // Ngày nghỉ việc
  salary: number;
  status: EmployeeStatus;
  avatarUrl?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  newThisMonth: number;
  departmentDistribution: { name: string; value: number }[];
  genderDistribution: { name: string; value: number }[];
}
