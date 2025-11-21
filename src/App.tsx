import React, { useState } from "react";
import { EmployeeModal } from "./components/EmployeeModal";

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans text-gray-800">
        {/* Header simulated Fast HRM */}
        <header className="bg-white h-12 shadow border-b border-gray-200 flex items-center px-4 z-10 relative">
            <div className="flex items-center gap-2 mr-8">
                 <div className="bg-[#0072bc] w-8 h-8 flex items-center justify-center text-white font-bold rounded-sm">F</div>
                 <h1 className="text-lg font-bold text-[#c10000] tracking-tight">Cadovina</h1>
            </div>
            
            <nav className="flex space-x-1 text-sm font-medium text-gray-600 h-full items-center">
                <a href="#" className="px-3 py-1 hover:bg-[#e6f0f8] hover:text-[#0072bc] rounded-sm transition-colors">Tổng quan</a>
                <a href="#" className="px-3 py-1 bg-[#e6f0f8] text-[#0072bc] rounded-sm transition-colors">Hồ sơ nhân sự</a>
                <a href="#" className="px-3 py-1 hover:bg-[#e6f0f8] hover:text-[#0072bc] rounded-sm transition-colors">Chấm công</a>
                <a href="#" className="px-3 py-1 hover:bg-[#e6f0f8] hover:text-[#0072bc] rounded-sm transition-colors">Tính lương</a>
                <a href="#" className="px-3 py-1 hover:bg-[#e6f0f8] hover:text-[#0072bc] rounded-sm transition-colors">Báo cáo</a>
            </nav>
        </header>

        {/* Content */}
        <main className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                     <h2 className="text-xl font-bold text-gray-700">Danh mục nhân viên</h2>
                     <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">0 bản ghi</span>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#0072bc] hover:bg-[#005a9e] text-white px-3 py-1.5 rounded shadow-sm text-sm font-medium transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Thêm mới
                </button>
            </div>

            {/* Empty State Table */}
            <div className="bg-white rounded shadow-sm border border-gray-300 min-h-[500px] relative">
                <div className="bg-gray-100 border-b border-gray-300 grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="col-span-2">Mã nhân viên</div>
                    <div className="col-span-3">Họ và tên</div>
                    <div className="col-span-2">Chức vụ</div>
                    <div className="col-span-3">Phòng ban</div>
                    <div className="col-span-2 text-right">Trạng thái</div>
                </div>
                
                <div className="flex flex-col items-center justify-center h-full absolute inset-0 top-8 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-2 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <p className="text-sm">Chưa có dữ liệu nhân viên.</p>
                    {!isModalOpen && (
                        <button onClick={() => setIsModalOpen(true)} className="mt-2 text-[#0072bc] hover:underline text-sm font-medium">
                            Tạo mới ngay
                        </button>
                    )}
                </div>
            </div>
        </main>

        {/* The Modal */}
        <EmployeeModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
        />
    </div>
  );
};

export default App;
