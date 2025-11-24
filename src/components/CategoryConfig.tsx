
import React, { useState } from 'react';
import { Plus, Trash2, Map, Briefcase, Network, Upload, FileSpreadsheet, Download, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { LocationItem, Department, Position } from '../types';

interface CategoryConfigProps {
  provinces: LocationItem[];
  onUpdateProvinces: (items: LocationItem[]) => void;
  districts: LocationItem[];
  onUpdateDistricts: (items: LocationItem[]) => void;
  wards: LocationItem[];
  onUpdateWards: (items: LocationItem[]) => void;
  
  departments: Department[];
  onUpdateDepartments: (items: Department[]) => void;
  positions: Position[];
  onUpdatePositions: (items: Position[]) => void;
}

type ConfigTab = 'location' | 'department' | 'position';
type LocationTab = 'province' | 'district' | 'ward';

export const CategoryConfig: React.FC<CategoryConfigProps> = ({
  provinces, onUpdateProvinces,
  districts, onUpdateDistricts,
  wards, onUpdateWards,
  departments, onUpdateDepartments,
  positions, onUpdatePositions
}) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('location');
  
  // Location State
  const [locTab, setLocTab] = useState<LocationTab>('province');
  const [locParentId, setLocParentId] = useState('');
  
  // Inputs
  const [newName, setNewName] = useState('');
  const [deptParentId, setDeptParentId] = useState('');

  // Handlers
  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = Math.floor(Math.random() * 1000000).toString();

    if (activeTab === 'location') {
      if (locTab === 'province') {
        onUpdateProvinces([...provinces, { id, name: newName }]);
      } else if (locTab === 'district') {
        if (!locParentId) return alert('Chọn Tỉnh/Thành phố trực thuộc');
        onUpdateDistricts([...districts, { id, name: newName, parentId: locParentId }]);
      } else {
        if (!locParentId) return alert('Chọn Quận/Huyện trực thuộc');
        onUpdateWards([...wards, { id, name: newName, parentId: locParentId }]);
      }
    } else if (activeTab === 'department') {
      onUpdateDepartments([...departments, { id, name: newName, parentId: deptParentId || undefined }]);
    } else {
      onUpdatePositions([...positions, { id, name: newName }]);
    }
    setNewName('');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    if (activeTab === 'location') {
        if (locTab === 'province') onUpdateProvinces(provinces.filter(i => i.id !== id));
        else if (locTab === 'district') onUpdateDistricts(districts.filter(i => i.id !== id));
        else onUpdateWards(wards.filter(i => i.id !== id));
    } else if (activeTab === 'department') {
        onUpdateDepartments(departments.filter(i => i.id !== id));
    } else {
        onUpdatePositions(positions.filter(i => i.id !== id));
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Mock import logic
        alert(`Đã import thành công dữ liệu từ file: ${file.name}`);
        e.target.value = ''; // Reset input
    }
  };

  const renderLocationConfig = () => (
    <div className="flex flex-col h-full">
        <div className="flex border-b border-gray-200 mb-4">
            <button onClick={() => { setLocTab('province'); setLocParentId(''); }} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${locTab === 'province' ? 'border-cadovina-600 text-cadovina-600' : 'border-transparent text-gray-500'}`}>Tỉnh/Thành</button>
            <button onClick={() => { setLocTab('district'); setLocParentId(provinces[0]?.id || ''); }} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${locTab === 'district' ? 'border-cadovina-600 text-cadovina-600' : 'border-transparent text-gray-500'}`}>Quận/Huyện</button>
            <button onClick={() => { setLocTab('ward'); setLocParentId(districts[0]?.id || ''); }} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${locTab === 'ward' ? 'border-cadovina-600 text-cadovina-600' : 'border-transparent text-gray-500'}`}>Phường/Xã</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
            {locTab !== 'province' && (
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Trực thuộc</label>
                    <select value={locParentId} onChange={e => setLocParentId(e.target.value)} className="w-full p-2 border rounded text-sm">
                        <option value="">-- Chọn --</option>
                        {locTab === 'district' 
                            ? provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            : districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                        }
                    </select>
                </div>
            )}
            <div className={`md:col-span-${locTab === 'province' ? '9' : '6'}`}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên đơn vị</label>
                <input 
                    value={newName} onChange={e => setNewName(e.target.value)} 
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Nhập tên..."
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
            </div>
            <div className="md:col-span-3">
                <button onClick={handleAdd} className="w-full py-2 bg-cadovina-600 text-white rounded text-sm hover:bg-cadovina-700 flex items-center justify-center gap-2">
                    <Plus size={16} /> Thêm
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto border rounded bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0">
                    <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Tên</th>
                        {locTab !== 'province' && <th className="px-4 py-2">Trực thuộc</th>}
                        <th className="px-4 py-2 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {(locTab === 'province' ? provinces : 
                      locTab === 'district' ? districts.filter(d => !locParentId || d.parentId === locParentId) :
                      wards.filter(w => !locParentId || w.parentId === locParentId)
                    ).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.id}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                            {locTab !== 'province' && (
                                <td className="px-4 py-2 text-gray-600">
                                    {locTab === 'district' 
                                        ? provinces.find(p => p.id === item.parentId)?.name 
                                        : districts.find(d => d.id === item.parentId)?.name}
                                </td>
                            )}
                            <td className="px-4 py-2 text-right">
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderDeptConfig = () => (
      <div className="flex flex-col h-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
              <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phòng ban cha (nếu có)</label>
                  <select value={deptParentId} onChange={e => setDeptParentId(e.target.value)} className="w-full p-2 border rounded text-sm">
                      <option value="">-- Không (Cấp cao nhất) --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
              </div>
              <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên phòng ban</label>
                  <input 
                      value={newName} onChange={e => setNewName(e.target.value)} 
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Nhập tên phòng ban..."
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
              </div>
              <div className="md:col-span-3">
                  <button onClick={handleAdd} className="w-full py-2 bg-cadovina-600 text-white rounded text-sm hover:bg-cadovina-700 flex items-center justify-center gap-2">
                      <Plus size={16} /> Thêm
                  </button>
              </div>
          </div>

          <div className="flex-1 overflow-auto border rounded bg-white p-2">
             {/* Tree View Simulation */}
             {departments.filter(d => !d.parentId).map(parent => (
                 <div key={parent.id} className="mb-2">
                     <div className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 group">
                         <div className="flex items-center gap-2 font-semibold text-gray-800">
                             <FolderTree size={16} className="text-blue-600" />
                             {parent.name}
                         </div>
                         <button onClick={() => handleDelete(parent.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                     </div>
                     {/* Children */}
                     <div className="ml-6 mt-1 border-l-2 border-gray-200 pl-2 space-y-1">
                         {departments.filter(child => child.parentId === parent.id).map(child => (
                             <div key={child.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 text-sm">
                                 <div className="flex items-center gap-2 text-gray-600">
                                     <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                     {child.name}
                                 </div>
                                 <button onClick={() => handleDelete(child.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                             </div>
                         ))}
                     </div>
                 </div>
             ))}
          </div>
      </div>
  );

  const renderPosConfig = () => (
    <div className="flex flex-col h-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
            <div className="md:col-span-9">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên chức vụ</label>
                <input 
                    value={newName} onChange={e => setNewName(e.target.value)} 
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Nhập tên chức vụ..."
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
            </div>
            <div className="md:col-span-3">
                <button onClick={handleAdd} className="w-full py-2 bg-cadovina-600 text-white rounded text-sm hover:bg-cadovina-700 flex items-center justify-center gap-2">
                    <Plus size={16} /> Thêm
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto border rounded bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0">
                    <tr>
                        <th className="px-4 py-2">Tên Chức Vụ</th>
                        <th className="px-4 py-2 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {positions.map(pos => (
                        <tr key={pos.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900">{pos.name}</td>
                            <td className="px-4 py-2 text-right">
                                <button onClick={() => handleDelete(pos.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            
            {/* Header & Tabs */}
            <div className="border-b border-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Network className="text-cadovina-600" />
                        Cấu Hình Danh Mục
                    </h2>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100">
                            <Download size={14} /> Tải Template
                        </button>
                        <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 cursor-pointer">
                            <FileSpreadsheet size={14} /> Import Excel
                            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
                        </label>
                    </div>
                </div>
                <div className="flex px-4 gap-1 bg-gray-50">
                    <button onClick={() => setActiveTab('location')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'location' ? 'border-cadovina-600 text-cadovina-600 bg-white rounded-t-lg' : 'border-transparent text-gray-500'}`}>
                        <Map size={16} /> Địa Chính
                    </button>
                    <button onClick={() => setActiveTab('department')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'department' ? 'border-cadovina-600 text-cadovina-600 bg-white rounded-t-lg' : 'border-transparent text-gray-500'}`}>
                        <Network size={16} /> Phòng Ban
                    </button>
                    <button onClick={() => setActiveTab('position')} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'position' ? 'border-cadovina-600 text-cadovina-600 bg-white rounded-t-lg' : 'border-transparent text-gray-500'}`}>
                        <Briefcase size={16} /> Chức Vụ
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-hidden">
                {activeTab === 'location' && renderLocationConfig()}
                {activeTab === 'department' && renderDeptConfig()}
                {activeTab === 'position' && renderPosConfig()}
            </div>

        </div>
    </div>
  );
};
