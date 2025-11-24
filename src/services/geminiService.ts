
import { GoogleGenAI, Type } from "@google/genai";
import { Employee } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractEmployeeInfo = async (text: string, fileBase64?: string, mimeType?: string): Promise<Partial<Employee> | null> => {
  try {
    // Use gemini-2.5-flash for fast and efficient multimodal extraction
    const model = "gemini-2.5-flash"; 
    
    const parts: any[] = [];
    
    // Add file part if exists
    if (fileBase64 && mimeType) {
        parts.push({
            inlineData: {
                data: fileBase64,
                mimeType: mimeType
            }
        });
    }

    // Enhanced prompt for CV extraction
    const promptText = `Bạn là một chuyên gia nhân sự (HR). Nhiệm vụ của bạn là trích xuất thông tin ứng viên từ ${fileBase64 ? 'tài liệu CV/Hồ sơ (PDF/Ảnh)' : 'văn bản mô tả'} được cung cấp dưới đây thành định dạng JSON chuẩn.

      HƯỚNG DẪN XỬ LÝ:
      1. **Thông tin cá nhân**: Trích xuất chính xác Họ tên, SĐT, Email, Ngày sinh (YYYY-MM-DD). Nếu không có ngày sinh, hãy cố gắng ước lượng từ tuổi nếu có, hoặc để null.
      2. **Địa chỉ**: Đây là phần quan trọng. Hãy cố gắng phân tách địa chỉ thành 4 cấp:
         - "street": Số nhà, tên đường, ngõ/ngách.
         - "ward": Phường/Xã (Ví dụ: "Phường Bến Nghé", "Xã An Khánh"). Hãy thêm tiền tố "Phường" hoặc "Xã" nếu thiếu.
         - "district": Quận/Huyện (Ví dụ: "Quận 1", "Huyện Bình Chánh"). Hãy thêm tiền tố "Quận" hoặc "Huyện" hoặc "Thành phố" nếu thiếu.
         - "province": Tỉnh/Thành phố (Ví dụ: "Hồ Chí Minh", "Hà Nội").
      3. **Công việc**:
         - "department": Dự đoán phòng ban phù hợp nhất dựa trên kinh nghiệm (Ví dụ: Kinh doanh, Kế toán, IT, Nhân sự).
         - "position": Chức vụ đề xuất (Nhân viên, Trưởng nhóm, v.v.).
      4. **Lương**: Nếu có đề cập mức lương mong muốn hoặc hiện tại, hãy trích xuất số (VNĐ).

      Nội dung bổ sung từ người dùng: "${text}"
      
      Lưu ý: Chỉ trả về JSON, không thêm markdown hay giải thích.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            gender: { type: Type.STRING },
            dob: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
            identityCard: { type: Type.STRING },
            issuedDate: { type: Type.STRING },
            issuedPlace: { type: Type.STRING },
            
            // Address components
            street: { type: Type.STRING, description: "Số nhà, tên đường" },
            ward: { type: Type.STRING, description: "Phường, Xã" },
            district: { type: Type.STRING, description: "Quận, Huyện" },
            province: { type: Type.STRING, description: "Tỉnh, Thành phố" },
            
            department: { type: Type.STRING },
            position: { type: Type.STRING },
            salary: { type: Type.NUMBER },
          },
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) return null;
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error extracting info with Gemini:", error);
    return null;
  }
};
