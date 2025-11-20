export enum Gender {
  Male = "Nam",
  Female = "Nữ",
  Other = "Khác",
}

export enum EmployeeStatus {
  Active = "Đang làm việc",
  Resigned = "Đã nghỉ việc",
  Maternity = "Nghỉ thai sản",
}

export interface Employee {
  employeeCode: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  departmentId: string;
  position: string;
  joinDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  identityNumber: string; // CMND/CCCD
  identityDate: string;
  identityPlace: string;
  taxCode: string;
  addressPermanent: string; // Thường trú
  addressContact: string; // Tạm trú/Liên hệ
  phoneNumber: string;
  email: string;
  bankAccount: string;
  bankName: string;
  bankBranch: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export const DEFAULT_EMPLOYEE: Employee = {
  employeeCode: "",
  fullName: "",
  dateOfBirth: "",
  gender: Gender.Male,
  departmentId: "",
  position: "",
  joinDate: "",
  status: EmployeeStatus.Active,
  identityNumber: "",
  identityDate: "",
  identityPlace: "",
  taxCode: "",
  addressPermanent: "",
  addressContact: "",
  phoneNumber: "",
  email: "",
  bankAccount: "",
  bankName: "",
  bankBranch: "",
};
