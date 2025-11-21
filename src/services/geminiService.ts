import { Employee, Gender, EmployeeStatus } from "../types";

export const generateFakeEmployee = async (): Promise<Employee> => {
  return {
    employeeCode: "NV0001",
    fullName: "Nguyễn Văn A",
    dateOfBirth: "1990-01-01",
    gender: Gender.Male,
    departmentId: "PB01",
    position: "Nhân viên",
    joinDate: "2023-01-01",
    status: EmployeeStatus.Active,
    identityNumber: "0123456789",
    identityDate: "2015-05-05",
    identityPlace: "TP. Hồ Chí Minh",
    taxCode: "1234567890",
    addressPermanent: "123 Lý Thường Kiệt, TP. HCM",
    addressContact: "123 Lý Thường Kiệt, TP. HCM",
    phoneNumber: "0901123456",
    email: "nguyenvana@example.com",
    bankAccount: "123456789",
    bankName: "Vietcombank",
    bankBranch: "Tân Bình"
  };
};
