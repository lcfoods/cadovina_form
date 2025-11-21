import React, { useState, useEffect, FormEvent } from "react";
import { Employee, Gender, EmployeeStatus, DepartmentOption, DEFAULT_EMPLOYEE } from "../types";
import { GOOGLE_APPS_SCRIPT_URL } from "../config";

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

export default function EmployeeModal({ isOpen, onClose }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Employee>(DEFAULT_EMPLOYEE);
  const [notification, setNotification] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, boolean>>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'bank'>('general');

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_EMPLOYEE);
      setErrors({});
      setActiveTab("general");
    }
  }, [isOpen]);

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      const index = Array.prototype.indexOf.call(form, e.currentTarget);
      form.elements[index + 1]?.focus();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof Employee]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };
  // Submit to Google Sheets
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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

      const generalErr =
        newErrors.employeeCode || newErrors.fullName || newErrors.departmentId || newErrors.joinDate;
      if (generalErr) setActiveTab("general");
      else if (newErrors.phoneNumber) setActiveTab("contact");

      setNotification("⚠️ Vui lòng kiểm tra lại dữ liệu!");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setNotification("✔ Đã lưu dữ liệu thành công!");
      setTimeout(() => {
        setNotification(null);
        onClose();
      }, 2000);
    } catch {
      setNotification("❌ Lỗi khi lưu dữ liệu!");
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const getInputClass = (field: keyof Employee) =>
    `w-full border ${
      errors[field] ? "border-red-500 bg-red-50" : "border-gray-300"
    } rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#c10000]`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded shadow-xl border border-gray-300 flex flex-col"
      >
        <div className="bg-[#c10000] text-white px-4 py-2 font-bold flex justify-between items-center">
          <span>Cập nhật thông tin nhân viên</span>
          <button type="button" onClick={onClose} className="hover:bg-white/20 px-2 rounded">
            ✕
          </button>
        </div>

        {notification && (
          <div className="bg-yellow-100 text-[#c10000] px-3 py-2 text-sm font-medium shadow">
            {notification}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-300">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === "general" ? "text-[#c10000] border-b-2 border-[#c10000]" : "text-gray-600"
            }`}
          >
            Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === "contact" ? "text-[#c10000] border-b-2 border-[#c10000]" : "text-gray-600"
            }`}
          >
            Liên hệ & Địa chỉ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeTab === "bank" ? "text-[#c10000] border-b-2 border-[#c10000]" : "text-gray-600"
            }`}
          >
            Lương & Thuế
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-4 overflow-y-auto">

          {/* TAB: General */}
          {activeTab === "general" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mã nhân viên*</label>
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  autoFocus
                  className={getInputClass("employeeCode")}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Họ tên*</label>
                <input type="text" name="fullName" value={formData.fullName}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("fullName")} />
              </div>

              <div>
                <label className="text-sm font-medium">Phòng ban*</label>
                <select name="departmentId" value={formData.departmentId}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("departmentId")}>
                  <option value="">-- Chọn --</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Chức vụ</label>
                <input type="text" name="position" value={formData.position}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("position")} />
              </div>

              <div>
                <label className="text-sm font-medium">Ngày vào làm*</label>
                <input type="date" name="joinDate" value={formData.joinDate}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("joinDate")} />
              </div>
            </div>
          )}
          {/* TAB: Contact */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Địa chỉ thường trú</label>
                <input
                  type="text"
                  name="addressPermanent"
                  value={formData.addressPermanent}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("addressPermanent")}
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Địa chỉ liên lạc</label>
                <input
                  type="text"
                  name="addressContact"
                  value={formData.addressContact}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("addressContact")}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Số điện thoại</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("phoneNumber")}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">Số điện thoại không hợp lệ</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email cá nhân</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("email")}
                />
              </div>
            </div>
          )}

          {/* TAB: Bank & Tax */}
          {activeTab === "bank" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mã số thuế</label>
                <input
                  type="text"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("taxCode")}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Số tài khoản</label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("bankAccount")}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Ngân hàng</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("bankName")}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Chi nhánh</label>
                <input
                  type="text"
                  name="bankBranch"
                  value={formData.bankBranch}
                  onChange={handleInputChange}
                  onKeyDown={handleFieldKeyDown}
                  className={getInputClass("bankBranch")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-300 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
          >
            Đóng
          </button>

          <button
            type="submit"
            className="px-3 py-1.5 bg-[#c10000] text-white rounded shadow hover:bg-[#a30000]"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
