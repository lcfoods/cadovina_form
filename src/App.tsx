
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Settings, 
  Menu, 
  Search, 
  Bell,
  Sheet,
  Map,
  UserCheck
} from 'lucide-react';
import { EmployeeForm } from './components/EmployeeForm';
import { Dashboard } from './components/Dashboard';
import { AddressConfig } from './components/AddressConfig';
import { CategoryConfig } from './components/CategoryConfig';
import { RecruitmentManager } from './components/RecruitmentManager';
import { 
  INITIAL_EMPLOYEES, INITIAL_PROVINCES, INITIAL_DISTRICTS, INITIAL_WARDS, 
  INITIAL_DEPARTMENTS, INITIAL_POSITIONS, INITIAL_CANDIDATES 
} from './constants';
import { Employee, LocationItem, Department, Position, EmployeeStatus, Candidate, RecruitmentStatus } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'add_employee' | 'recruitment' | 'category_config'>('dashboard');
  
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State to hold the employee selected for viewing/editing
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Location & Category Data State
  const [provinces, setProvinces] = useState<LocationItem[]>(INITIAL_PROVINCES);
  const [districts, setDistricts] = useState<LocationItem[]>(INITIAL_DISTRICTS);
  const [wards, setWards] = useState<LocationItem[]>(INITIAL_WARDS);
  
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);

  const handleSaveEmployee = (newEmployee: Employee) => {
    const today = new Date().toISOString().split('T')[0];
    let processedEmployee = { ...newEmployee };

    if (processedEmployee.resignationDate) {
      if (processedEmployee.resignationDate <= today) {
        processedEmployee.status = EmployeeStatus.RESIGNED;
      } else if (processedEmployee.status === EmployeeStatus.RESIGNED) {
         processedEmployee.status = EmployeeStatus.ACTIVE; 
      }
    }

    setEmployees(prev => {
       const exists = prev.find(e => e.id === processedEmployee.id);
       if (exists) {
         return prev.map(e => e.id === processedEmployee.id ? processedEmployee : e);
       }
       return [...prev, processedEmployee];
    });
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setSelectedEmployee(null);
    setCurrentView('dashboard');
  };

  // --- Recruitment Logic ---
  const handlePromoteCandidate = (candidate: Candidate, empDetails: Partial<Employee>) => {
      const newEmployee: Employee = {
          id: `e_${Date.now()}`,
          employeeCode: empDetails.employeeCode || '',
          fullName: candidate.fullName,
          gender: candidate.gender,
          dob: candidate.dob,
          phone: candidate.phone,
          email: candidate.email,
          identityCard: candidate.identityCard,
          issuedDate: '', // To be updated later by user
          issuedPlace: '',
          
          street: candidate.street || '',
          province: candidate.province || '',
          district: candidate.district || '',
          ward: candidate.ward || '',
          addressLevel: 3,

          department: empDetails.department || '',
          position: empDetails.position || '',
          startDate: empDetails.startDate || '',
          salary: empDetails.salary || 0,
          status: empDetails.status || EmployeeStatus.PROBATION,
      };

      // 1. Add to Employees
      setEmployees(prev => [...prev, newEmployee]);

      // 2. Update Candidate Status to Converted
      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, status: RecruitmentStatus.CONVERTED } : c));

      alert(`Đã chuyển hồ sơ "${candidate.fullName}" sang danh sách Nhân viên thành công!`);
      setCurrentView('dashboard');
  };

  const handleViewEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setCurrentView('add_employee');
  };

  const handleNavClick = (view: typeof currentView) => {
    if (view === 'add_employee') {
      setSelectedEmployee(null); // Reset if clicking sidebar "Add Employee"
    }
    setCurrentView(view);
  };

  // Filter logic for Search (Global Header Search)
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const lowerTerm = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(lowerTerm) || 
      emp.employeeCode.toLowerCase().includes(lowerTerm) ||
      emp.department.toLowerCase().includes(lowerTerm) ||
      emp.phone.includes(lowerTerm)
    );
  }, [employees, searchTerm]);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-white flex-shrink-0 transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-cadovina-600">
           {isSidebarOpen ? (
             <h1 className="text-xl font-bold tracking-wider uppercase">Cadovina HRM</h1>
           ) : (
             <span className="font-bold text-xl">CH</span>
           )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 px-2">
           <NavItem 
              icon={LayoutDashboard} 
              label="Tổng Quan" 
              isOpen={isSidebarOpen} 
              active={currentView === 'dashboard'} 
              onClick={() => handleNavClick('dashboard')}
           />
           <NavItem 
              icon={UserPlus} 
              label="Hồ Sơ Nhân Viên" 
              isOpen={isSidebarOpen} 
              active={currentView === 'add_employee'} 
              onClick={() => handleNavClick('add_employee')}
           />
           <NavItem 
              icon={UserCheck} 
              label="Tuyển Dụng" 
              isOpen={isSidebarOpen} 
              active={currentView === 'recruitment'} 
              onClick={() => handleNavClick('recruitment')}
           />
           
           <div className="pt-4 pb-2">
              <div className="border-t border-slate-700 mx-2"></div>
           </div>
           
           <NavItem 
              icon={Settings} 
              label="Danh mục hệ thống" 
              isOpen={isSidebarOpen} 
              active={currentView === 'category_config'} 
              onClick={() => handleNavClick('category_config')} 
           />
           <NavItem icon={Sheet} label="Kết nối Google Sheet" isOpen={isSidebarOpen} active={false} onClick={() => alert("Tính năng cấu hình API đang phát triển")} />
        </nav>

      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-cadovina-600">
                    <Menu size={24} />
                </button>
                {/* Global Search is mostly for Dashboard, specific views have their own search */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm toàn hệ thống..." 
                        className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-cadovina-500 focus:border-transparent outline-none w-64 transition-all focus:w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative text-gray-500 hover:text-cadovina-600">
                    <Bell size={22} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
                </button>
            </div>
        </header>

        {/* View Area */}
        <main className="flex-1 overflow-hidden relative">
             {currentView === 'dashboard' && (
               <Dashboard 
                 employees={filteredEmployees} 
                 onViewEmployee={handleViewEmployee}
               />
             )}
             {currentView === 'add_employee' && (
                 <div className="h-full p-4 md:p-6">
                    <EmployeeForm 
                        onSave={handleSaveEmployee} 
                        onCancel={() => {
                          setSelectedEmployee(null);
                          setCurrentView('dashboard');
                        }}
                        provinces={provinces}
                        districts={districts}
                        wards={wards}
                        departments={departments}
                        positions={positions}
                        initialData={selectedEmployee}
                        existingEmployees={employees}
                    />
                 </div>
             )}
             {currentView === 'recruitment' && (
                <RecruitmentManager 
                   candidates={candidates}
                   onUpdateCandidates={setCandidates}
                   onPromoteToEmployee={handlePromoteCandidate}
                   departments={departments}
                   positions={positions}
                   existingEmployees={employees}
                />
             )}
             {currentView === 'category_config' && (
                <CategoryConfig 
                  // Pass Location Props
                  provinces={provinces} onUpdateProvinces={setProvinces}
                  districts={districts} onUpdateDistricts={setDistricts}
                  wards={wards} onUpdateWards={setWards}
                  // Pass Dept/Pos Props
                  departments={departments} onUpdateDepartments={setDepartments}
                  positions={positions} onUpdatePositions={setPositions}
                />
             )}
        </main>

      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-3 animate-fade-in-down z-50">
            <div className="bg-white rounded-full p-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
                <h4 className="font-bold text-sm">Thành công!</h4>
                <p className="text-xs opacity-90">Dữ liệu đã được cập nhật vào hệ thống.</p>
            </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for Nav Item
const NavItem = ({ icon: Icon, label, isOpen, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 border-l-4
        ${active ? 'bg-slate-800 text-white border-cadovina-600' : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}
    >
        <Icon size={20} className={`${active ? 'text-cadovina-400' : 'text-slate-400'}`} />
        {isOpen && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </button>
);

export default App;
