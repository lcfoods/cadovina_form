import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, UserPlus, DollarSign, Building2, Eye, Filter, UserX, Briefcase } from 'lucide-react';
import { Employee, EmployeeStatus } from '../types';
import { DEPARTMENTS, POSITIONS, STATUS_OPTIONS } from '../constants';

interface DashboardProps {
  employees: Employee[];
  onViewEmployee: (employee: Employee) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Dashboard: React.FC<DashboardProps> = ({ employees, onViewEmployee }) => {
  const [activeTab, setActiveTab] = useState<'working' | 'resigned'>('working');
  
  // Filters
  const [filterDept, setFilterDept] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Process Data
  const { stats, filteredList } = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
    const totalSalary = employees.reduce((sum, e) => e.status !== EmployeeStatus.RESIGNED ? sum + e.salary : sum, 0);
    
    // Filter Logic
    let list = employees.filter(e => {
      // Tab Filter
      if (activeTab === 'working') {
        return e.status !== EmployeeStatus.RESIGNED;
      } else {
        return e.status === EmployeeStatus.RESIGNED;
      }
    });

    // Dropdown Filters
    if (filterDept) list = list.filter(e => e.department === filterDept);
    if (filterPos) list = list.filter(e => e.position === filterPos);
    if (filterStatus) list = list.filter(e => e.status === filterStatus);

    // Charts Data (Base on ALL working employees, ignoring local list filters for macro view)
    const workingEmployees = employees.filter(e => e.status !== EmployeeStatus.RESIGNED);
    
    const deptMap = new Map<string, number>();
    workingEmployees.forEach(e => {
      deptMap.set(e.department, (deptMap.get(e.department) || 0) + 1);
    });
    const deptData = Array.from(deptMap.entries()).map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      value 
    }));

    const genderMap = new Map<string, number>();
    workingEmployees.forEach(e => {
        genderMap.set(e.gender, (genderMap.get(e.gender) || 0) + 1);
    });
    const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

    return { 
      stats: { total, active, totalSalary, deptData, genderData },
      filteredList: list
    };
  }, [employees, activeTab, filterDept, filterPos, filterStatus]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-100 transition-transform hover:-translate-y-1" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        </div>
        <div className="p-3 rounded-full bg-gray-50 text-gray-600">
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  // Extract department names and positions from objects or strings
  const deptOptions = typeof DEPARTMENTS[0] === 'string' 
    ? DEPARTMENTS as string[] 
    : (DEPARTMENTS as any[]).map(d => d.name);
    
  const posOptions = typeof POSITIONS[0] === 'string'
    ? POSITIONS as string[]
    : (POSITIONS as any[]).map(p => p.name);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-gray-50">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Nhân Sự (Đang làm)" 
          value={stats.active} 
          icon={Users} 
          color="#e11b22" // Cadovina Red
        />
        <StatCard 
          title="Đã Nghỉ Việc" 
          value={employees.length - stats.total + (employees.filter(e => e.status === EmployeeStatus.RESIGNED).length)} 
          icon={UserX} 
          color="#6b7280" 
        />
        <StatCard 
          title="Quỹ Lương (Tháng)" 
          value={`${(stats.totalSalary / 1000000).toFixed(1)} Triệu`} 
          icon={DollarSign} 
          color="#f59e0b" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-cadovina-600" />
            Phân Bố Phòng Ban
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.deptData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#e11b22" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                    {stats.deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#e11b22' : '#f43f5e'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Users size={20} className="text-blue-600" />
             Cơ Cấu Giới Tính
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                  animationDuration={1000}
                >
                  {stats.genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee List Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Tabs Header */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('working')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 
                ${activeTab === 'working' ? 'border-cadovina-600 text-cadovina-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
                <Briefcase size={16} />
                Đang Làm Việc
                <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full ml-2">
                    {employees.filter(e => e.status !== EmployeeStatus.RESIGNED).length}
                </span>
            </button>
            <button 
                onClick={() => setActiveTab('resigned')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors border-b-2
                ${activeTab === 'resigned' ? 'border-gray-600 text-gray-800 bg-gray-100' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
                <UserX size={16} />
                Đã Nghỉ Việc
                <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full ml-2">
                    {employees.filter(e => e.status === EmployeeStatus.RESIGNED).length}
                </span>
            </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-gray-500 mr-2">
                <Filter size={16} />
                <span className="text-sm font-medium">Bộ lọc:</span>
            </div>
            
            <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-cadovina-500 outline-none bg-white shadow-sm"
            >
                <option value="">Tất cả Phòng ban</option>
                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
                value={filterPos} 
                onChange={(e) => setFilterPos(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-cadovina-500 outline-none bg-white shadow-sm"
            >
                <option value="">Tất cả Chức vụ</option>
                {posOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-cadovina-500 outline-none bg-white shadow-sm"
            >
                <option value="">Tất cả Trạng thái</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {(filterDept || filterPos || filterStatus) && (
                <button 
                    onClick={() => { setFilterDept(''); setFilterPos(''); setFilterStatus(''); }}
                    className="text-xs text-red-500 hover:underline ml-auto"
                >
                    Xóa bộ lọc
                </button>
            )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 font-bold border-b">Mã NV</th>
                        <th className="px-6 py-3 font-bold border-b">Họ Tên</th>
                        <th className="px-6 py-3 font-bold border-b">Phòng Ban</th>
                        <th className="px-6 py-3 font-bold border-b">Chức Vụ</th>
                        {activeTab === 'working' ? (
                           <th className="px-6 py-3 font-bold border-b">Ngày Vào Làm</th>
                        ) : (
                           <th className="px-6 py-3 font-bold border-b">Ngày Nghỉ Việc</th>
                        )}
                        <th className="px-6 py-3 font-bold border-b">Trạng Thái</th>
                        <th className="px-6 py-3 font-bold border-b text-right">Thao Tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredList.length > 0 ? (
                        filteredList.slice().reverse().map((emp) => (
                            <tr key={emp.id} className="hover:bg-blue-50 transition-colors group">
                                <td className="px-6 py-3 font-medium text-gray-900">{emp.employeeCode}</td>
                                <td className="px-6 py-3 text-cadovina-600 font-semibold">{emp.fullName}</td>
                                <td className="px-6 py-3 text-gray-600">{emp.department}</td>
                                <td className="px-6 py-3 text-gray-600">{emp.position}</td>
                                <td className="px-6 py-3 text-gray-600">
                                    {activeTab === 'working' ? emp.startDate : emp.resignationDate || '-'}
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border
                                        ${emp.status === EmployeeStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-200' : 
                                          emp.status === EmployeeStatus.PROBATION ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                          emp.status === EmployeeStatus.RESIGNED ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                          'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button 
                                      onClick={() => onViewEmployee(emp)}
                                      className="text-gray-400 hover:text-cadovina-600 hover:bg-white p-1.5 rounded-full transition-all shadow-none hover:shadow-sm border border-transparent hover:border-gray-200" 
                                      title="Xem chi tiết"
                                    >
                                      <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                                Không tìm thấy nhân viên phù hợp với bộ lọc.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
            Hiển thị {filteredList.length} kết quả
        </div>
      </div>
    </div>
  );
};
