// //import { GoogleGenAI, Type, Schema } from "@google/genai";
// import { Employee, Gender, EmployeeStatus } from "../types";

// // Initialize Gemini Client
// // The API key must be provided in the environment variable API_KEY
// //const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// const employeeSchema: Schema = {
//   type: Type.OBJECT,
//   properties: {
//     employeeCode: { type: Type.STRING, description: "Unique code starting with NV" },
//     fullName: { type: Type.STRING },
//     dateOfBirth: { type: Type.STRING, description: "YYYY-MM-DD" },
//     gender: { type: Type.STRING, enum: [Gender.Male, Gender.Female, Gender.Other] },
//     departmentId: { type: Type.STRING, description: "Department code like 'PB01'" },
//     position: { type: Type.STRING },
//     joinDate: { type: Type.STRING, description: "YYYY-MM-DD" },
//     status: { type: Type.STRING, enum: [EmployeeStatus.Active, EmployeeStatus.Resigned, EmployeeStatus.Maternity] },
//     identityNumber: { type: Type.STRING },
//     identityDate: { type: Type.STRING, description: "YYYY-MM-DD" },
//     identityPlace: { type: Type.STRING },
//     taxCode: { type: Type.STRING },
//     addressPermanent: { type: Type.STRING },
//     addressContact: { type: Type.STRING },
//     phoneNumber: { type: Type.STRING },
//     email: { type: Type.STRING },
//     bankAccount: { type: Type.STRING },
//     bankName: { type: Type.STRING },
//     bankBranch: { type: Type.STRING },
//   },
//   required: ["employeeCode", "fullName", "joinDate"],
// };

// export const generateFakeEmployee = async (): Promise<Employee | null> => {
//   try {
//     // const response = await ai.models.generateContent({
//     //   model: "gemini-2.5-flash",
//     //   contents: "Generate a realistic JSON object for a Vietnamese employee in an HRM system. Include tax code and join date.",
//     //   config: {
//     //     responseMimeType: "application/json",
//     //     responseSchema: employeeSchema,
//     //     temperature: 0.7,
//     //   },
//     // });

//     if (response.text) {
//       return JSON.parse(response.text) as Employee;
//     }
//     return null;
//   } catch (error) {
//     console.error("Error generating employee data:", error);
//     return null;
//   }
// };
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
