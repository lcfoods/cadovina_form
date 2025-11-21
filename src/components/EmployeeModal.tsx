import { GOOGLE_APPS_SCRIPT_URL } from "../config";

import React, { useState, useEffect } from "react";
import { Employee, Gender, EmployeeStatus, DepartmentOption, DEFAULT_EMPLOYEE } from "../types";
import { XIcon, SparklesIcon, ChevronDownIcon, TrashIcon, ExclamationTriangleIcon } from "./Icons";
import { generateFakeEmployee } from "../services/geminiService";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTMENTS: DepartmentOption[] = [
  { id: "PB01", name: "Phòng Kế toán" },
  { id: "PB02", name: "Phòng Nhân sự" },
  { id: "PB03", name: "Phòng Kinh doanh" },
  { id: "PB04", name: "Phòng Kỹ thuật" },
  { id: "PB05", name: "Ban Giám đốc" },
];

type TabType = 'general' | 'contact' | 'bank';

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<Employee>(DEFAULT_EMPLOYEE);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, boolean>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_EMPLOYEE);
      setActiveTab('general');
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, showDeleteConfirm]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error if exists when user types
    if (errors[name as keyof Employee]) {
        setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    setErrors({}); // Clear errors on generate start
    try {
      const data = await generateFakeEmployee();
      if (data) {
        setFormData(data);
        setNotification("Đã điền dữ liệu mẫu!");
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    // Simulate deletion
    alert(`Đã xóa nhân viên: ${formData.fullName || 'N/A'}`);
    onClose();
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation Logic
  const newErrors: Partial<Record<keyof Employee, boolean>> = {};

  if (!formData.employeeCode.trim()) newErrors.employeeCode = true;
  if (!formData.fullName.trim()) newErrors.fullName = true;
  if (!formData.departmentId) newErrors.departmentId = true;
  if (!formData.joinDate) newErrors.joinDate = true;

  const vnPhoneRegex = /^(0)(3|5|7|8|9)([0-9]{8})$/;
  if (formData.phoneNumber && !vnPhoneRegex.test(formData.phoneNumber)) {
    newErrors.phoneNumber = true;
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);

    const hasGeneralErrors =
      newErrors.employeeCode ||
      newErrors.fullName ||
      newErrors.departmentId ||
      newErrors.joinDate;
    const hasContactErrors = newErrors.phoneNumber;

    if (hasGeneralErrors && activeTab !== "general") {
      setActiveTab("general");
    } else if (!hasGeneralErrors && hasContactErrors && activeTab !== "contact") {
      setActiveTab("contact");
    }

    setNotification("Vui lòng kiểm tra lại dữ liệu!");
    setTimeout(() => setNotification(null), 3000);
    return;
  }

  try {
    // Gửi dữ liệu sang Google Apps Script
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    setNotification("Lưu thành công dữ liệu nhân viên! ✅");
    setTimeout(() => setNotification(null), 3000);

    // Nếu muốn reset form sau khi lưu:
    // setFormData(DEFAULT_EMPLOYEE);

    onClose();
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    setNotification("Có lỗi khi lưu dữ liệu lên Google Sheet ❌");
    setTimeout(() => setNotification(null), 4000);
  }
};


  if (!isOpen) return null;

  // Dynamic input style based on error state
  const getInputClassName = (fieldName: keyof Employee, extraClasses: string = "") => {
      const hasError = errors[fieldName];
      return `w-full border ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-[#0072bc] focus:ring-1 focus:ring-[#0072bc] h-8 ${extraClasses}`;
  };

  const labelStyle = "block text-sm text-gray-700 font-medium mb-1";
  const tabStyle = (tab: TabType) => `px-4 py-2 text-sm font-semibold border-t border-l border-r rounded-t-md cursor-pointer select-none ${activeTab === tab ? 'bg-white text-[#0072bc] border-b-white relative top-[1px]' : 'bg-gray-100 text-gray-600 border-b border-gray-300 hover:bg-gray-50'}`;
  
  // Standard style for optional fields
  const defaultInputStyle = "w-full border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-[#0072bc] focus:ring-1 focus:ring-[#0072bc] h-8";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f0f2f5] w-full max-w-4xl h-auto max-h-[90vh] flex flex-col shadow-2xl rounded border border-gray-400 overflow-hidden relative">
        
        {/* Fast HRM Style Header */}
        <div className="bg-[#0072bc] text-white px-4 py-2 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg uppercase tracking-wide">Cập nhật thông tin nhân viên</span>
          </div>
          <div className="flex items-center gap-2">
             <button 
              onClick={handleGenerateData} 
              disabled={isGenerating} 
              className="p-1 hover:bg-white/20 rounded flex items-center gap-1 text-xs font-medium border border-white/30"
              title="Tự động tạo dữ liệu (AI)"
            >
              <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>AI Fill</span>
            </button>
            <button onClick={onClose} className="p-1 hover:bg-red-600 rounded transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

         {/* Notification Toast */}
         {notification && (
            <div className={`absolute top-12 right-4 ${notification.includes('Vui lòng') ? 'bg-red-600' : 'bg-green-600'} text-white px-3 py-1 rounded shadow-lg text-sm z-50 animate-fade-in`}>
                {notification}
            </div>
        )}

        {/* Toolbar (typical in Fast) */}
        <div className="bg-[#e1e5eb] border-b border-gray-300 px-4 py-1.5 flex gap-2 sticky top-0">
            <button 
                onClick={handleSubmit}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 hover:border-[#0072bc] hover:text-[#0072bc] rounded-sm shadow-sm text-sm text-gray-700 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                </svg>
                Lưu
            </button>
            <button 
                onClick={() => {
                    setFormData(DEFAULT_EMPLOYEE);
                    setErrors({});
                }}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 hover:border-[#0072bc] hover:text-[#0072bc] rounded-sm shadow-sm text-sm text-gray-700 transition-all"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Mới
            </button>
             <div className="w-px bg-gray-300 mx-1"></div>
            <button 
                onClick={handleDeleteClick}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 hover:border-red-500 hover:text-red-600 rounded-sm shadow-sm text-sm text-gray-700 transition-all"
                title="Xóa nhân viên hiện tại"
            >
                <TrashIcon className="w-4 h-4" />
                Xóa
            </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white border border-gray-300 rounded shadow-sm p-4 mb-4">
                {/* Header Info Block */}
                <div className="grid grid-cols-12 gap-4 mb-4">
                    <div className="col-span-12 md:col-span-3">
                        <label className={labelStyle}>Mã nhân viên <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="employeeCode"
                            value={formData.employeeCode}
                            onChange={handleInputChange}
                            className={getInputClassName('employeeCode', 'font-bold')}
                            autoFocus
                        />
                        {errors.employeeCode && <span className="text-xs text-red-500 mt-1">Không được để trống</span>}
                    </div>
                    <div className="col-span-12 md:col-span-6">
                        <label className={labelStyle}>Tên nhân viên <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={getInputClassName('fullName', 'font-bold text-[#0072bc] uppercase')}
                        />
                         {errors.fullName && <span className="text-xs text-red-500 mt-1">Không được để trống</span>}
                    </div>
                    <div className="col-span-12 md:col-span-3">
                        <label className={labelStyle}>Trạng thái</label>
                         <div className="relative">
                            <select 
                                name="status" 
                                value={formData.status}
                                onChange={handleInputChange}
                                className={`${defaultInputStyle} appearance-none pr-8`}
                            >
                                {Object.values(EmployeeStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-300 mb-0">
                <div className={tabStyle('general')} onClick={() => setActiveTab('general')}>Thông tin chung</div>
                <div className={tabStyle('contact')} onClick={() => setActiveTab('contact')}>Liên hệ & Địa chỉ</div>
                <div className={tabStyle('bank')} onClick={() => setActiveTab('bank')}>Lương & Thuế</div>
            </div>

            {/* Tab Content Box */}
            <div className="bg-white border-l border-r border-b border-gray-300 p-4 min-h-[300px]">
                
                {/* TAB 1: GENERAL */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {/* Left Side */}
                        <div className="space-y-3">
                            <div>
                                <label className={labelStyle}>Bộ phận / Phòng ban <span className="text-red-500">*</span></label>
                                 <div className="relative">
                                    <select 
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={handleInputChange}
                                        className={`${getInputClassName('departmentId')} appearance-none`}
                                    >
                                        <option value="">-- Chọn bộ phận --</option>
                                        {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                {errors.departmentId && <span className="text-xs text-red-500 mt-1">Vui lòng chọn phòng ban</span>}
                            </div>
                            <div>
                                <label className={labelStyle}>Chức danh / Vị trí</label>
                                <input type="text" name="position" value={formData.position} onChange={handleInputChange} className={defaultInputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>Ngày vào làm <span className="text-red-500">*</span></label>
                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleInputChange} className={getInputClassName('joinDate')} />
                                {errors.joinDate && <span className="text-xs text-red-500 mt-1">Không được để trống</span>}
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Ngày sinh</label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={defaultInputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Giới tính</label>
                                     <div className="flex items-center gap-4 mt-1.5 h-8">
                                        {Object.values(Gender).map((g) => (
                                            <label key={g} className="flex items-center gap-1 cursor-pointer text-sm">
                                                <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleInputChange} className="accent-[#0072bc]" />
                                                {g}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelStyle}>Số CMND / CCCD</label>
                                    <input type="text" name="identityNumber" value={formData.identityNumber} onChange={handleInputChange} className={defaultInputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Ngày cấp</label>
                                    <input type="date" name="identityDate" value={formData.identityDate} onChange={handleInputChange} className={defaultInputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Nơi cấp</label>
                                    <input type="text" name="identityPlace" value={formData.identityPlace} onChange={handleInputChange} className={defaultInputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: CONTACT */}
                {activeTab === 'contact' && (
                     <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className={labelStyle}>Địa chỉ thường trú</label>
                            <input type="text" name="addressPermanent" value={formData.addressPermanent} onChange={handleInputChange} className={defaultInputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Địa chỉ liên lạc / Tạm trú</label>
                            <input type="text" name="addressContact" value={formData.addressContact} onChange={handleInputChange} className={defaultInputStyle} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Điện thoại di động</label>
                                <input 
                                    type="text" 
                                    name="phoneNumber" 
                                    value={formData.phoneNumber} 
                                    onChange={handleInputChange} 
                                    className={getInputClassName('phoneNumber')} 
                                />
                                {errors.phoneNumber && <span className="text-xs text-red-500 mt-1">SĐT không đúng định dạng VN</span>}
                            </div>
                            <div>
                                <label className={labelStyle}>Email cá nhân</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={defaultInputStyle} />
                            </div>
                        </div>
                     </div>
                )}

                {/* TAB 3: BANK & TAX */}
                {activeTab === 'bank' && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <label className={labelStyle}>Mã số thuế cá nhân</label>
                            <input type="text" name="taxCode" value={formData.taxCode} onChange={handleInputChange} className={defaultInputStyle} placeholder="MST..." />
                        </div>
                        <div className="col-span-2 border-t border-gray-200 my-1"></div>
                        <div className="col-span-2">
                             <h4 className="text-sm font-bold text-[#0072bc] mb-2">Thông tin chuyển khoản</h4>
                        </div>
                        <div>
                             <label className={labelStyle}>Số tài khoản</label>
                             <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} className={defaultInputStyle} />
                        </div>
                        <div>
                             <label className={labelStyle}>Ngân hàng</label>
                             <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className={defaultInputStyle} />
                        </div>
                        <div className="col-span-2">
                             <label className={labelStyle}>Chi nhánh</label>
                             <input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleInputChange} className={defaultInputStyle} />
                        </div>
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="bg-[#f0f2f5] px-4 py-2 border-t border-gray-300 flex justify-end gap-2 shrink-0">
             <button 
                onClick={onClose}
                className="min-w-[80px] px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded shadow-sm text-sm"
            >
                Đóng
            </button>
            <button 
                onClick={handleSubmit}
                className="min-w-[80px] px-3 py-1.5 bg-[#0072bc] text-white hover:bg-[#005a9e] rounded shadow-sm text-sm font-semibold"
            >
                Lưu
            </button>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[60]">
                <div className="bg-white w-[450px] shadow-2xl rounded border border-gray-400 flex flex-col animate-fade-in">
                    <div className="bg-[#0072bc] text-white px-3 py-1.5 font-bold text-sm flex justify-between items-center rounded-t">
                        <span>Thông báo</span>
                        <button onClick={() => setShowDeleteConfirm(false)} className="hover:bg-white/20 rounded p-0.5"><XIcon className="w-4 h-4 text-white"/></button>
                    </div>
                    <div className="p-6 flex items-start gap-4">
                        <div className="text-yellow-500 shrink-0">
                            <ExclamationTriangleIcon className="w-10 h-10" />
                        </div>
                        <div>
                            <p className="text-gray-700 mb-1.5 text-base">Bạn có chắc chắn muốn xóa nhân viên này không?</p>
                            <p className="text-base font-bold text-[#0072bc]">{formData.employeeCode || '(Trống)'} - {formData.fullName || '(Chưa có tên)'}</p>
                            <p className="text-xs text-gray-500 mt-2 italic">Hành động này không thể hoàn tác.</p>
                        </div>
                    </div>
                    <div className="bg-[#f0f2f5] px-3 py-3 flex justify-end gap-2 border-t border-gray-300 rounded-b">
                         <button 
                            onClick={() => setShowDeleteConfirm(false)} 
                            className="px-4 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
                        >
                            Không
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium shadow-sm"
                        >
                            Đồng ý
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
