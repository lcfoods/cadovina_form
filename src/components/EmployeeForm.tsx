
import React, { useState, useEffect, useMemo } from 'react';
import { Save, RotateCcw, Wand2, Loader2, MapPin, AlertTriangle, UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';
import { FormInput } from './FormInput';
import { DEPARTMENTS, POSITIONS, STATUS_OPTIONS, GENDER_OPTIONS, INITIAL_PROVINCES, INITIAL_DISTRICTS, INITIAL_WARDS } from '../constants';
import { Employee, EmployeeStatus, Gender, LocationItem, Department, Position } from '../types';
import { extractEmployeeInfo } from '../services/geminiService';

interface EmployeeFormProps {
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  provinces?: LocationItem[];
  districts?: LocationItem[];
  wards?: LocationItem[];
  initialData?: Employee | null;
  // Passed to check duplicates
  existingEmployees?: Employee[];
  // Categories
  departments?: Department[] | string[];
  positions?: Position[] | string[];
}

const INITIAL_STATE: Employee = {
  id: '',
  employeeCode: '',
  fullName: '',
  gender: Gender.MALE,
  dob: '',
  phone: '',
  email: '',
  identityCard: '',
  issuedDate: '',
  issuedPlace: '',
  
  street: '',
  province: '',
  district: '',
  ward: '',
  addressLevel: 3,

  department: '',
  position: '',
  startDate: new Date().toISOString().split('T')[0],
  resignationDate: '', // Initialize empty
  salary: 0,
  status: EmployeeStatus.ACTIVE,
};

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  onSave, 
  onCancel,
  provinces = INITIAL_PROVINCES,
  districts = INITIAL_DISTRICTS,
  wards = INITIAL_WARDS,
  initialData = null,
  existingEmployees = [],
  departments = DEPARTMENTS,
  positions = POSITIONS
}) => {
  const [formData, setFormData] = useState<Employee>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof Employee, string>>>({});
  const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Helper to convert departments to simple array for validation if needed
  const renderDeptOptions = () => {
    // Handle simple string array (legacy)
    if (departments.length > 0 && typeof departments[0] === 'string') {
       return (departments as string[]).map(d => <option key={d} value={d}>{d}</option>);
    }
    
    // Handle Tree Structure (Department[])
    const depts = departments as Department[];
    const roots = depts.filter(d => !d.parentId);
    
    const renderNode = (dept: Department, level: number) => {
       const children = depts.filter(d => d.parentId === dept.id);
       return [
          <option key={dept.id} value={dept.name}>
             {"\u00A0\u00A0".repeat(level) + (level > 0 ? "└─ " : "") + dept.name}
          </option>,
          ...children.map(child => renderNode(child, level + 1))
       ];
    };

    return roots.map(root => renderNode(root, 0));
  };

  const posOptions = useMemo(() => {
    if (!positions.length) return [];
    if (typeof positions[0] === 'string') return positions as string[];
    return (positions as Position[]).map(p => p.name);
  }, [positions]);

  // Initialize
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const randomId = Math.floor(Math.random() * 10000).toString();
      setFormData({
        ...INITIAL_STATE,
        id: randomId,
        employeeCode: `NV${randomId.padStart(4, '0')}`
      });
    }
  }, [initialData]);

  // Check for duplicate Identity Card immediately when it changes
  const isDuplicateIdentity = useMemo(() => {
    if (!formData.identityCard || formData.identityCard.length < 9) return false;
    return existingEmployees.some(
      e => e.identityCard === formData.identityCard && e.id !== formData.id
    );
  }, [formData.identityCard, existingEmployees, formData.id]);

  useEffect(() => {
    if (isDuplicateIdentity) {
        setErrors(prev => ({
            ...prev, 
            identityCard: 'Số CCCD/CMND này đã tồn tại trên hệ thống!'
        }));
    } else {
        setErrors(prev => {
            if (prev.identityCard?.includes('tồn tại')) {
                return { ...prev, identityCard: undefined };
            }
            return prev;
        });
    }
  }, [isDuplicateIdentity]);

  // Cascading Dropdowns
  const availableDistricts = useMemo(() => {
    if (!formData.province) return [];
    const selectedProv = provinces.find(p => p.name === formData.province);
    return selectedProv ? districts.filter(d => d.parentId === selectedProv.id) : [];
  }, [formData.province, provinces, districts]);

  const availableWards = useMemo(() => {
    // LEVEL 3: Ward depends on District
    if (formData.addressLevel === 3) {
        if (!formData.district) return [];
        const selectedDist = districts.find(d => d.name === formData.district);
        return selectedDist ? wards.filter(w => w.parentId === selectedDist.id) : [];
    } 
    // LEVEL 2: Ward depends on Province (Flattened list of all wards in the province)
    else {
        if (!formData.province) return [];
        const selectedProv = provinces.find(p => p.name === formData.province);
        if (!selectedProv) return [];
        
        // Get all districts in this province
        const districtIds = districts.filter(d => d.parentId === selectedProv.id).map(d => d.id);
        
        // Get all wards that belong to any of these districts
        return wards.filter(w => w.parentId && districtIds.includes(w.parentId));
    }
  }, [formData.district, formData.province, formData.addressLevel, districts, wards, provinces]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'salary' ? Number(value) : value,
      };

      // Logic for cascading resets
      if (name === 'province') { 
          newData.district = ''; 
          newData.ward = ''; 
      }
      if (name === 'district') { 
          newData.ward = ''; 
      }

      // Special Logic for Level 2 (Province + Ward):
      // When Ward is selected, auto-fill the District based on the Ward's parentId
      if (name === 'ward' && prev.addressLevel === 2) {
          const selectedWardObj = wards.find(w => w.name === value);
          if (selectedWardObj && selectedWardObj.parentId) {
              const parentDistObj = districts.find(d => d.id === selectedWardObj.parentId);
              if (parentDistObj) {
                  newData.district = parentDistObj.name;
              }
          }
      }
      
      return newData;
    });

    if (errors[name as keyof Employee]) {
      // Don't clear identityCard error here, it's handled by useEffect/isDuplicateIdentity
      if (name !== 'identityCard') {
         setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleAddressLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isTwoLevel = e.target.checked;
    setFormData(prev => ({
      ...prev,
      addressLevel: isTwoLevel ? 2 : 3,
      ward: '',     // Reset ward when switching modes to avoid mismatches
      district: ''  // Reset district as well
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Employee, string>> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    
    // Email Validation
    if (!formData.email.trim()) {
        newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email không đúng định dạng';
    }
    
    if (!formData.identityCard.trim()) {
        newErrors.identityCard = 'Vui lòng nhập số CCCD/CMND';
    } else if (isDuplicateIdentity) {
        newErrors.identityCard = 'Số CCCD/CMND này đã tồn tại trên hệ thống!';
    }

    if (!formData.department) newErrors.department = 'Vui lòng chọn phòng ban';
    if (!formData.position) newErrors.position = 'Vui lòng chọn chức vụ';
    if (!formData.province) newErrors.province = 'Vui lòng chọn Tỉnh/Thành phố';
    
    // District is required only for Level 3 visible input
    if (formData.addressLevel === 3 && !formData.district) newErrors.district = 'Vui lòng chọn Quận/Huyện';
    
    // Ward is required for both
    if (!formData.ward) newErrors.ward = 'Vui lòng chọn Phường/Xã';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (!form) return;

      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '-1');
      
      // Find the next input. If Address Level is 2, we might need to skip index 9 (District) if it's hidden
      let nextIndex = index + 1;
      
      // Logic to skip hidden inputs
      if (formData.addressLevel === 2 && nextIndex === 9) {
          nextIndex = 10; // Skip District, go to Ward
      }

      let nextElement = form.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement | null;
      
      if (nextElement) {
        nextElement.focus();
      } else {
        const saveBtn = document.getElementById('btn-save');
        saveBtn?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSaving(true);
      // Simulating network delay for realism
      await new Promise(resolve => setTimeout(resolve, 600));
      onSave(formData);
      setIsSaving(false);
    } else {
        setNotification({ type: 'error', message: 'Vui lòng kiểm tra lại các thông tin bắt buộc (màu đỏ).' });
        // Optional: Scroll to top of form to see errors
        const form = document.getElementById('employee-form');
        form?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
         // remove data:image/png;base64, prefix
         const result = reader.result as string;
         const base64 = result.split(',')[1];
         resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAiExtract = async () => {
    if (!aiPrompt.trim() && !uploadedFile) return;
    setIsAiLoading(true);
    
    try {
        let base64File: string | undefined = undefined;
        let mimeType: string | undefined = undefined;

        if (uploadedFile) {
            base64File = await fileToBase64(uploadedFile);
            mimeType = uploadedFile.type;
        }

        const extractedData = await extractEmployeeInfo(aiPrompt, base64File, mimeType);
        
        if (extractedData) {
        setFormData(prev => {
            const findMatch = (val: string | undefined, list: LocationItem[]) => {
            if (!val) return '';
            const match = list.find(item => item.name.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(item.name.toLowerCase()));
            return match ? match.name : '';
            };

            const matchedProvince = findMatch(extractedData.province, provinces);
            // Try to find district based on matched province
            let matchedDistrict = '';
            if (matchedProvince) {
                const provId = provinces.find(p => p.name === matchedProvince)?.id;
                const childDistricts = districts.filter(d => d.parentId === provId);
                matchedDistrict = findMatch(extractedData.district, childDistricts);
            }
            // Try to find ward
            let matchedWard = '';
            if (matchedDistrict) {
                const distId = districts.find(d => d.name === matchedDistrict)?.id;
                const childWards = wards.filter(w => w.parentId === distId);
                matchedWard = findMatch(extractedData.ward, childWards);
            }

            return {
            ...prev,
            ...extractedData,
            province: matchedProvince || extractedData.province || '',
            district: matchedDistrict || extractedData.district || '',
            ward: matchedWard || extractedData.ward || '',
            // Preserve core fields if not extracted
            id: prev.id,
            employeeCode: prev.employeeCode,
            addressLevel: prev.addressLevel
            };
        });
        setShowAiModal(false);
        setAiPrompt('');
        setUploadedFile(null);
        setNotification({ type: 'success', message: 'Đã trích xuất dữ liệu thành công! Vui lòng kiểm tra lại.' });
        } else {
        setNotification({ type: 'error', message: 'Không thể trích xuất thông tin. Vui lòng thử lại.' });
        }
    } catch (err) {
        console.error(err);
        setNotification({ type: 'error', message: 'Đã có lỗi xảy ra khi xử lý AI.' });
    }
    setIsAiLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`absolute top-4 right-6 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-bounce-in
            ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-cadovina-600 rounded-sm inline-block"></span>
                {initialData ? 'Hồ Sơ Nhân Viên' : 'Thêm Mới Nhân Viên'}
            </h2>
        </div>
        
        <div className="flex gap-3">
           {!initialData && (
             <button 
              type="button"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-200 shadow-sm"
            >
              <Wand2 size={16} />
              Nhập nhanh bằng CV/AI
            </button>
           )}
          <button 
            type="button"
            onClick={() => setFormData(initialData || INITIAL_STATE)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-300"
          >
            <RotateCcw size={16} />
            {initialData ? 'Khôi phục' : 'Làm mới'}
          </button>
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        <form id="employee-form" onSubmit={handleSubmit} className="max-w-6xl mx-auto">
            
            {/* Group 1: Basic Info */}
            <div className="bg-white p-5 rounded-md shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">1</div>
                  Thông tin chung
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormInput index={1} label="Mã Nhân Viên" name="employeeCode" value={formData.employeeCode} onChange={handleChange} onKeyDown={handleKeyDown} required disabled className="bg-gray-100" />
                    <FormInput index={2} label="Họ và Tên" name="fullName" value={formData.fullName} onChange={handleChange} onKeyDown={handleKeyDown} required error={errors.fullName} placeholder="NGUYỄN VĂN A" />
                    <FormInput index={3} label="Ngày Sinh" name="dob" type="date" value={formData.dob} onChange={handleChange} onKeyDown={handleKeyDown} />
                    <FormInput index={4} label="Giới Tính" name="gender" value={formData.gender} onChange={handleChange} onKeyDown={handleKeyDown} options={GENDER_OPTIONS} />
                </div>
            </div>

            {/* Group 2: Contact & ID */}
            <div className="bg-white p-5 rounded-md shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">2</div>
                  Liên hệ & Địa chỉ
                </h3>
                
                {/* Contact basic */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <FormInput index={5} label="Số Điện Thoại" name="phone" value={formData.phone} onChange={handleChange} onKeyDown={handleKeyDown} required error={errors.phone} placeholder="09xxxxxxxx" />
                    <FormInput index={6} label="Email Công Ty" name="email" type="email" value={formData.email} onChange={handleChange} onKeyDown={handleKeyDown} required error={errors.email} placeholder="example@cadovina.com" />
                    <div>
                       <FormInput 
                         index={7} 
                         label="Số CCCD/CMND" 
                         name="identityCard" 
                         value={formData.identityCard} 
                         onChange={handleChange} 
                         onKeyDown={handleKeyDown} 
                         required 
                         error={errors.identityCard} 
                       />
                    </div>
                </div>

                {/* Detailed Address Section */}
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                      <MapPin size={14} /> Địa chỉ thường trú
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="addrLevel" 
                        checked={formData.addressLevel === 2} 
                        onChange={handleAddressLevelChange}
                        className="w-4 h-4 text-cadovina-600 rounded focus:ring-cadovina-500"
                      />
                      <label htmlFor="addrLevel" className="text-sm text-gray-600 cursor-pointer select-none font-medium">
                        Sử dụng địa chỉ 2 cấp (Tỉnh - Xã/Phường)
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Province */}
                      <FormInput 
                        index={8} 
                        label="Tỉnh/Thành Phố" 
                        name="province" 
                        value={formData.province} 
                        onChange={handleChange} 
                        onKeyDown={handleKeyDown}
                        options={provinces.map(p => p.name)}
                        error={errors.province}
                        required
                      />

                      {/* District - Visible in 3 Level (Normal) OR 2 Level (Disabled & Auto-filled) */}
                      <FormInput 
                          index={9} 
                          label={formData.addressLevel === 2 ? "Quận/Huyện (Tự động)" : "Quận/Huyện"} 
                          name="district" 
                          value={formData.district} 
                          onChange={handleChange} 
                          onKeyDown={handleKeyDown}
                          options={availableDistricts.map(d => d.name)}
                          disabled={!formData.province || formData.addressLevel === 2}
                          error={errors.district}
                          required={formData.addressLevel === 3}
                          className={formData.addressLevel === 2 ? "opacity-80" : ""}
                      />

                      {/* Ward - Visible in both, but logic differs */}
                      <FormInput 
                        index={10} 
                        label="Phường/Xã" 
                        name="ward" 
                        value={formData.ward} 
                        onChange={handleChange} 
                        onKeyDown={handleKeyDown}
                        options={availableWards.map(w => w.name)}
                        // If Level 3: Needs district. If Level 2: Needs province
                        disabled={formData.addressLevel === 3 ? !formData.district : !formData.province}
                        error={errors.ward}
                        required
                      />

                      {/* Street */}
                      <FormInput 
                        index={11} 
                        label="Số nhà, Tên đường" 
                        name="street" 
                        value={formData.street} 
                        onChange={handleChange} 
                        onKeyDown={handleKeyDown}
                        placeholder="123 Đường ABC"
                      />
                  </div>
                </div>
            </div>

            {/* Group 3: Job Details */}
            <div className="bg-white p-5 rounded-md shadow-sm border border-gray-200 mb-6">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 uppercase flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">3</div>
                  Công việc & Lương
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Phòng Ban <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-white border rounded-md text-sm shadow-sm focus:ring-2 focus:ring-cadovina-500 focus:border-cadovina-500 ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                            data-index={12}
                            onKeyDown={handleKeyDown}
                        >
                            <option value="">-- Chọn Phòng Ban --</option>
                            {renderDeptOptions()}
                        </select>
                        {errors.department && <span className="mt-1 text-xs text-red-500 italic">{errors.department}</span>}
                    </div>

                    <FormInput index={13} label="Chức Vụ" name="position" value={formData.position} onChange={handleChange} onKeyDown={handleKeyDown} required options={posOptions} error={errors.position} />
                    <FormInput index={14} label="Ngày Vào Làm" name="startDate" type="date" value={formData.startDate} onChange={handleChange} onKeyDown={handleKeyDown} />
                    
                    {/* Resignation Date - Enhanced Warning Logic */}
                    <div className="relative">
                         <FormInput 
                            index={15} 
                            label="Ngày Nghỉ Việc" 
                            name="resignationDate" 
                            type="date" 
                            value={formData.resignationDate || ''} 
                            onChange={handleChange} 
                            onKeyDown={handleKeyDown} 
                         />
                         {formData.resignationDate && (() => {
                             const rDate = new Date(formData.resignationDate);
                             const today = new Date();
                             // Reset time for correct day comparison
                             today.setHours(0,0,0,0);
                             rDate.setHours(0,0,0,0);
                             
                             if (rDate <= today) {
                                 return (
                                     <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 flex items-start gap-2 animate-pulse">
                                         <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-600" />
                                         <span>
                                             <strong>Cảnh báo:</strong> Ngày nghỉ việc thuộc quá khứ hoặc hôm nay. 
                                             Trạng thái nhân viên sẽ tự động chuyển thành <span className="font-bold underline text-red-600">Đã nghỉ việc</span> sau khi lưu.
                                         </span>
                                     </div>
                                 );
                             }
                             return (
                                <div className="mt-1 text-[10px] text-gray-500">
                                   Ngày trong tương lai: Vẫn giữ trạng thái hiện tại.
                                </div>
                             );
                         })()}
                    </div>
                    
                    <FormInput index={16} label="Trạng Thái Hiện Tại" name="status" value={formData.status} onChange={handleChange} onKeyDown={handleKeyDown} options={STATUS_OPTIONS} />
                    <FormInput index={17} label="Lương Cơ Bản" name="salary" type="number" value={formData.salary} onChange={handleChange} onKeyDown={handleKeyDown} error={errors.salary} />
                </div>
            </div>

        </form>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center">
          <div className="text-xs text-gray-500 italic hidden md:block">
             * Nhấn Enter để chuyển sang trường tiếp theo. Dữ liệu sẽ được lưu vào Google Sheets.
          </div>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 rounded-md text-gray-700 font-medium hover:bg-gray-100 border border-gray-300 transition-all"
            >
                Hủy bỏ
            </button>
            <button
                id="btn-save"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-md bg-cadovina-600 text-white font-medium hover:bg-cadovina-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70"
            >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? 'Đang lưu...' : 'Cất & Lưu Trữ'}
            </button>
          </div>
      </div>

      {/* AI Prompt Modal with Upload */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Wand2 size={20} /> Trích xuất hồ sơ tự động (AI)
                </h3>
                <button onClick={() => setShowAiModal(false)} className="text-white/80 hover:text-white text-xl transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-5">
                {/* File Upload Area */}
                <div className="relative group">
                   <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                   <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 
                        ${uploadedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}>
                        
                        {uploadedFile ? (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    {uploadedFile.type.includes('pdf') ? <FileText size={24} /> : <UploadCloud size={24} />}
                                </div>
                                <p className="text-sm font-bold text-gray-800 truncate max-w-[250px]">{uploadedFile.name}</p>
                                <p className="text-xs text-green-600 mt-1">Đã sẵn sàng tải lên</p>
                                <button 
                                    className="absolute top-2 right-2 z-20 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-white"
                                    onClick={(e) => { e.preventDefault(); setUploadedFile(null); }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <UploadCloud className="mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors" size={32} />
                                <p className="text-sm font-medium">Kéo thả CV vào đây</p>
                                <p className="text-xs mt-1 text-gray-400">Hỗ trợ PDF, PNG, JPG</p>
                            </div>
                        )}
                   </div>
                </div>

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-2 text-gray-400 text-xs uppercase font-semibold tracking-wider">Hoặc dán nội dung</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <textarea 
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] text-sm resize-y"
                    placeholder="Dán nội dung text của CV hoặc mô tả ứng viên vào đây..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
                
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-100 flex gap-2">
                    <Wand2 size={14} className="shrink-0 text-blue-600 mt-0.5" />
                    <p>Hệ thống sẽ tự động phân tích tên, ngày sinh, địa chỉ (tách Tỉnh/Huyện/Xã) và đề xuất phòng ban phù hợp.</p>
                </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
                <button 
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-200 rounded transition-colors"
                >
                    Hủy bỏ
                </button>
                <button 
                    onClick={handleAiExtract}
                    disabled={isAiLoading || (!aiPrompt.trim() && !uploadedFile)}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                >
                    {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                    {isAiLoading ? 'Đang phân tích...' : 'Trích xuất ngay'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
