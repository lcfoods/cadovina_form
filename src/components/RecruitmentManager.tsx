
import React, { useState, useEffect } from 'react';
import { 
    UserPlus, Search, Filter, Calendar, FileText, CheckCircle2, XCircle, 
    MoreHorizontal, ArrowRight, Save, Briefcase, X, Loader2, Wand2, UploadCloud,
    User, Mail, Phone, MapPin, FileBadge
} from 'lucide-react';
import { Candidate, RecruitmentStatus, Gender, Department, Position, Employee, EmployeeStatus } from '../types';
import { GENDER_OPTIONS } from '../constants';
import { extractEmployeeInfo } from '../services/geminiService';

interface RecruitmentManagerProps {
    candidates: Candidate[];
    onUpdateCandidates: (candidates: Candidate[]) => void;
    onPromoteToEmployee: (candidate: Candidate, employeeDetails: Partial<Employee>) => void;
    departments: Department[];
    positions: Position[];
    existingEmployees: Employee[];
}

const STATUS_COLORS = {
    [RecruitmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [RecruitmentStatus.INTERVIEWED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [RecruitmentStatus.PASSED]: 'bg-green-100 text-green-800 border-green-200',
    [RecruitmentStatus.FAILED]: 'bg-gray-100 text-gray-600 border-gray-200',
    [RecruitmentStatus.CONVERTED]: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const RecruitmentManager: React.FC<RecruitmentManagerProps> = ({
    candidates, onUpdateCandidates, onPromoteToEmployee, departments, positions, existingEmployees
}) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Candidate>>({});
    
    // Decision Modal State
    const [decisionModalOpen, setDecisionModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [decisionData, setDecisionData] = useState({
        employeeCode: '',
        department: '',
        position: '',
        salary: 0,
        startDate: new Date().toISOString().split('T')[0],
        probationPeriod: '2 tháng',
        status: EmployeeStatus.PROBATION
    });

    // AI/File Upload State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // AI Preview State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<Partial<Candidate>>({});

    // --- Helpers ---
    const handleAddNew = () => {
        setFormData({
            fullName: '', gender: Gender.MALE, dob: '', phone: '', email: '', 
            identityCard: '', status: RecruitmentStatus.PENDING, appliedPosition: ''
        });
        setEditingId(null);
        setView('form');
    };

    const handleEdit = (c: Candidate) => {
        setFormData(c);
        setEditingId(c.id);
        setView('form');
    };

    const handleSaveCandidate = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic Validation
        if (!formData.fullName || !formData.phone) return alert('Vui lòng nhập họ tên và SĐT');

        const newCandidate = {
            ...formData,
            id: editingId || Date.now().toString(),
        } as Candidate;

        if (editingId) {
            onUpdateCandidates(candidates.map(c => c.id === editingId ? newCandidate : c));
        } else {
            onUpdateCandidates([...candidates, newCandidate]);
        }
        setView('list');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Xóa hồ sơ ứng viên này?')) {
            onUpdateCandidates(candidates.filter(c => c.id !== id));
        }
    };

    // --- Decision Modal Logic ---
    const openDecisionModal = (c: Candidate) => {
        // Generate Code logic (simple)
        const nextId = existingEmployees.length + 1;
        const code = `NV${String(nextId).padStart(4, '0')}`;
        
        setSelectedCandidate(c);
        setDecisionData(prev => ({
            ...prev,
            employeeCode: code,
            position: c.appliedPosition // Default to applied position
        }));
        setDecisionModalOpen(true);
    };

    const handleConfirmDecision = () => {
        if (!selectedCandidate) return;
        if (!decisionData.department || !decisionData.position) return alert('Vui lòng chọn Phòng ban và Chức vụ');
        
        onPromoteToEmployee(selectedCandidate, {
            employeeCode: decisionData.employeeCode,
            department: decisionData.department,
            position: decisionData.position,
            salary: Number(decisionData.salary),
            startDate: decisionData.startDate,
            status: decisionData.status
        });
        
        setDecisionModalOpen(false);
        setSelectedCandidate(null);
    };

    // --- AI Extraction Logic ---
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
        });
    };

    const handleAiExtract = async () => {
        if (!aiPrompt.trim() && !uploadedFile) return;
        setIsAiLoading(true);
        try {
            let base64File: string | undefined;
            let mimeType: string | undefined;
            if (uploadedFile) {
                base64File = await fileToBase64(uploadedFile);
                mimeType = uploadedFile.type;
            }
            const extractedData = await extractEmployeeInfo(aiPrompt, base64File, mimeType);
            if (extractedData) {
                // Instead of setting form data directly, open preview
                setPreviewData({
                    fullName: extractedData.fullName || '',
                    gender: (extractedData.gender as Gender) || Gender.MALE,
                    dob: extractedData.dob || '',
                    phone: extractedData.phone || '',
                    email: extractedData.email || '',
                    identityCard: extractedData.identityCard || '',
                    province: extractedData.province || '',
                    district: extractedData.district || '',
                    ward: extractedData.ward || '',
                    street: extractedData.street || '',
                    appliedPosition: extractedData.position || ''
                });
                setShowAiModal(false);
                setShowPreviewModal(true);
            } else {
                alert('Không tìm thấy thông tin hợp lệ. Vui lòng thử lại.');
            }
        } catch (e) { 
            console.error(e); 
            alert('Lỗi khi xử lý AI'); 
        }
        setIsAiLoading(false);
    };

    const handleApplyPreview = () => {
        setFormData(prev => ({
            ...prev,
            ...previewData
        }));
        setShowPreviewModal(false);
        setPreviewData({});
        setAiPrompt('');
        setUploadedFile(null);
    };

    // --- Renderers ---
    const renderList = () => {
        const filtered = candidates.filter(c => {
            if (c.status === RecruitmentStatus.CONVERTED) return false;
            if (filterStatus && c.status !== filterStatus) return false;
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                return c.fullName.toLowerCase().includes(s) || c.phone.includes(s) || c.appliedPosition.toLowerCase().includes(s);
            }
            return true;
        });

        return (
            <div className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-cadovina-500 focus:outline-none"
                            placeholder="Tìm ứng viên..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select 
                            className="px-3 py-2 border rounded-lg bg-white focus:ring-cadovina-500"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value={RecruitmentStatus.PENDING}>Chờ phỏng vấn</option>
                            <option value={RecruitmentStatus.INTERVIEWED}>Đã phỏng vấn</option>
                            <option value={RecruitmentStatus.PASSED}>Đạt</option>
                            <option value={RecruitmentStatus.FAILED}>Không đạt</option>
                        </select>
                        <button 
                            onClick={handleAddNew}
                            className="px-4 py-2 bg-cadovina-600 text-white rounded-lg hover:bg-cadovina-700 flex items-center gap-2 font-medium whitespace-nowrap"
                        >
                            <UserPlus size={18} /> Thêm Ứng Viên
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex-1 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Họ Tên</th>
                                <th className="px-6 py-3">Vị Trí Ứng Tuyển</th>
                                <th className="px-6 py-3">Liên Hệ</th>
                                <th className="px-6 py-3">Ngày Phỏng Vấn</th>
                                <th className="px-6 py-3">Kết Quả</th>
                                <th className="px-6 py-3 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-blue-50 group transition-colors">
                                    <td className="px-6 py-3 font-semibold text-gray-800">{c.fullName}</td>
                                    <td className="px-6 py-3 text-gray-600">{c.appliedPosition}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-gray-800">{c.phone}</div>
                                        <div className="text-gray-500 text-xs">{c.email}</div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {c.interviewDate || 'Chưa lịch'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[c.status]}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right flex items-center justify-end gap-2">
                                        {c.status === RecruitmentStatus.PASSED && (
                                            <button 
                                                onClick={() => openDecisionModal(c)}
                                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold shadow-sm"
                                                title="Chuyển sang nhân viên chính thức"
                                            >
                                                <CheckCircle2 size={14} /> Chuyển hồ sơ
                                            </button>
                                        )}
                                        <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-blue-600 p-1"><MoreHorizontal size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Không có ứng viên nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderForm = () => (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    {editingId ? 'Cập Nhật Hồ Sơ Ứng Viên' : 'Thêm Mới Ứng Viên'}
                </h3>
                <button type="button" onClick={() => setShowAiModal(true)} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline">
                    <Wand2 size={16}/> AI Scan CV
                </button>
            </div>
            
            <form onSubmit={handleSaveCandidate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-500 uppercase border-b pb-1">Thông tin cá nhân</h4>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                        <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Ngày sinh</label>
                            <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Giới tính</label>
                            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})} className="w-full p-2 border rounded text-sm">
                                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">SĐT *</label>
                            <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">CCCD/CMND</label>
                        <input value={formData.identityCard} onChange={e => setFormData({...formData, identityCard: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ (Tỉnh/Thành)</label>
                        <input value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Nhập tỉnh thành..." />
                    </div>
                </div>

                {/* Recruitment Info */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-500 uppercase border-b pb-1">Thông tin tuyển dụng</h4>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Vị trí ứng tuyển *</label>
                        <input required value={formData.appliedPosition} onChange={e => setFormData({...formData, appliedPosition: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="VD: Nhân viên kinh doanh" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Ngày phỏng vấn</label>
                        <input type="date" value={formData.interviewDate} onChange={e => setFormData({...formData, interviewDate: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Kết quả tuyển dụng</label>
                        <select 
                            value={formData.status} 
                            onChange={e => setFormData({...formData, status: e.target.value as RecruitmentStatus})} 
                            className={`w-full p-2 border rounded text-sm font-bold ${STATUS_COLORS[formData.status as RecruitmentStatus]}`}
                        >
                            <option value={RecruitmentStatus.PENDING}>Chờ phỏng vấn</option>
                            <option value={RecruitmentStatus.INTERVIEWED}>Đã phỏng vấn (Chờ KQ)</option>
                            <option value={RecruitmentStatus.PASSED}>Đạt (Pass)</option>
                            <option value={RecruitmentStatus.FAILED}>Không đạt (Fail)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú / Đánh giá</label>
                        <textarea rows={4} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="Nhập nhận xét về ứng viên..." />
                    </div>
                    
                    {formData.status === RecruitmentStatus.PASSED && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Ứng viên đã Đạt. Hãy lưu lại và bấm "Chuyển hồ sơ" ở danh sách để tiếp nhận nhân viên.
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                    <button type="button" onClick={() => setView('list')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border">Hủy bỏ</button>
                    <button type="submit" className="px-6 py-2 bg-cadovina-600 text-white rounded hover:bg-cadovina-700 font-bold shadow flex items-center gap-2">
                        <Save size={18} /> Lưu Hồ Sơ
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="p-6 h-full bg-gray-100">
            {view === 'list' ? renderList() : renderForm()}
            
            {/* Decision Modal */}
            {decisionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-cadovina-600 px-6 py-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Quyết định tiếp nhận</h3>
                            <button onClick={() => setDecisionModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Đang chuyển hồ sơ ứng viên <strong className="text-gray-800">{selectedCandidate?.fullName}</strong> sang Nhân viên chính thức.
                            </p>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Mã Nhân Viên (Tự động)</label>
                                <input value={decisionData.employeeCode} onChange={e => setDecisionData({...decisionData, employeeCode: e.target.value})} className="w-full p-2 bg-gray-100 border rounded text-sm" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Phòng Ban *</label>
                                <select 
                                    value={decisionData.department} 
                                    onChange={e => setDecisionData({...decisionData, department: e.target.value})} 
                                    className="w-full p-2 border rounded text-sm"
                                >
                                    <option value="">-- Chọn --</option>
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Chức Vụ (Quyết định) *</label>
                                <input value={decisionData.position} onChange={e => setDecisionData({...decisionData, position: e.target.value})} className="w-full p-2 border rounded text-sm" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Lương Chính thức</label>
                                    <input type="number" value={decisionData.salary} onChange={e => setDecisionData({...decisionData, salary: Number(e.target.value)})} className="w-full p-2 border rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Ngày bắt đầu</label>
                                    <input type="date" value={decisionData.startDate} onChange={e => setDecisionData({...decisionData, startDate: e.target.value})} className="w-full p-2 border rounded text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setDecisionModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm">Hủy</button>
                            <button onClick={handleConfirmDecision} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-sm flex items-center gap-2">
                                <Briefcase size={16} /> Xác nhận chuyển
                            </button>
                        </div>
                    </div>
                </div>
            )}

             {/* AI Upload Modal */}
             {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2"><Wand2 size={20} /> AI Scan CV</h3>
                        <button onClick={() => setShowAiModal(false)}><X size={24} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
                             <input type="file" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} className="hidden" id="cv-upload" accept="application/pdf,image/*" />
                             <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center">
                                <UploadCloud size={32} className="text-gray-400 mb-2" />
                                <span className="text-sm font-bold text-indigo-600">{uploadedFile ? uploadedFile.name : 'Chọn file CV (PDF/Ảnh)'}</span>
                             </label>
                        </div>
                        <textarea 
                            className="w-full p-3 border rounded text-sm" 
                            placeholder="Hoặc dán nội dung CV vào đây..." 
                            rows={3}
                            value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                        />
                        <button 
                            onClick={handleAiExtract}
                            disabled={isAiLoading}
                            className="w-full py-2 bg-indigo-600 text-white rounded font-bold flex justify-center items-center gap-2"
                        >
                            {isAiLoading ? <Loader2 className="animate-spin" /> : 'Trích xuất thông tin'}
                        </button>
                    </div>
                  </div>
                </div>
            )}

            {/* Preview & Edit Data Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
                        <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <CheckCircle2 size={20} /> Xác nhận kết quả trích xuất
                            </h3>
                            <button onClick={() => setShowPreviewModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <p className="text-sm text-gray-600 mb-4 bg-indigo-50 p-3 rounded border border-indigo-100">
                                Vui lòng kiểm tra và chỉnh sửa các thông tin dưới đây trước khi áp dụng vào hồ sơ.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><User size={12}/> Họ và tên</label>
                                    <input 
                                        value={previewData.fullName || ''} 
                                        onChange={e => setPreviewData({...previewData, fullName: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><FileBadge size={12}/> Vị trí ứng tuyển</label>
                                    <input 
                                        value={previewData.appliedPosition || ''} 
                                        onChange={e => setPreviewData({...previewData, appliedPosition: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Mail size={12}/> Email</label>
                                    <input 
                                        value={previewData.email || ''} 
                                        onChange={e => setPreviewData({...previewData, email: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Phone size={12}/> SĐT</label>
                                    <input 
                                        value={previewData.phone || ''} 
                                        onChange={e => setPreviewData({...previewData, phone: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Tỉnh / Thành phố</label>
                                    <input 
                                        value={previewData.province || ''} 
                                        onChange={e => setPreviewData({...previewData, province: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết (đã tách)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input placeholder="Quận/Huyện" value={previewData.district || ''} onChange={e => setPreviewData({...previewData, district: e.target.value})} className="p-2 border rounded text-xs" />
                                        <input placeholder="Phường/Xã" value={previewData.ward || ''} onChange={e => setPreviewData({...previewData, ward: e.target.value})} className="p-2 border rounded text-xs" />
                                        <input placeholder="Số nhà/Đường" value={previewData.street || ''} onChange={e => setPreviewData({...previewData, street: e.target.value})} className="p-2 border rounded text-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm font-medium">Hủy bỏ</button>
                            <button onClick={handleApplyPreview} className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-bold flex items-center gap-2 shadow">
                                <Save size={16} /> Áp dụng vào Form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
