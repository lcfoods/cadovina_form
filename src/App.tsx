import React from "react";
import EmployeeModal from "./components/EmployeeModal";

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#ffffff] font-sans text-gray-800">
      {/* Header Cadovina */}
      <header className="bg-[#c10000] h-12 shadow border-b border-gray-200 flex items-center px-4 z-10 relative">
        <div className="flex items-center gap-2 mr-8">
          {/* Logo Placeholder */}
          <div className="bg-white text-[#c10000] font-bold w-8 h-8 flex items-center justify-center rounded">
            C
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Cadovina</h1>
        </div>

        <nav className="flex space-x-1 text-sm font-medium text-white/90 h-full items-center">
          <a href="#" className="px-3 py-1 hover:bg-white/10 rounded-sm transition-colors">Trang chủ</a>
          <a href="#" className="px-3 py-1 bg-white/15 text-white rounded-sm">Quản lý nhân sự</a>
          <a href="#" className="px-3 py-1 hover:bg-white/10 rounded-sm transition-colors">Chấm công</a>
          <a href="#" className="px-3 py-1 hover:bg-white/10 rounded-sm transition-colors">Công – Lương</a>
          <a href="#" className="px-3 py-1 hover:bg-white/10 rounded-sm transition-colors">Báo cáo</a>
          <a href="#" className="px-3 py-1 hover:bg-white/10 rounded-sm transition-colors">Hệ thống</a>
        </nav>
      </header>

      {/* Content */}
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Danh mục nhân viên</h2>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#c10000] hover:bg-[#a30000] text-white px-3 py-1.5 rounded text-sm font-medium shadow"
          >
            + Thêm mới
          </button>
        </div>

        <div className="bg-white rounded shadow border border-gray-300 min-h-[400px] flex items-center justify-center text-gray-500">
          Chưa có dữ liệu nhân viên. Vui lòng thêm mới.
        </div>
      </main>

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default App;
