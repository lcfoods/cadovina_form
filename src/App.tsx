import React, { useState, useEffect } from "react";
import { EmployeeModal } from "./components/EmployeeModal";
import { Employee } from "./types";

const GOOGLE_SHEET_API =
  "https://script.google.com/macros/s/AKfycbwDiBTomppsfBWbHtFYKjzlOIpPMueblwxwQGeCR7xAe4Kpy1h74md7OhATS6iP8WTmaA/exec";

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(GOOGLE_SHEET_API);
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans text-gray-800">

      {/* Header + Button thêm mới như cũ */}
      ...

      <main className="p-4">
        {/* Nếu có dữ liệu → hiển thị bảng */}
        {employees.length > 0 ? (
          <div className="bg-white border border-gray-300 rounded shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr className="text-left text-xs text-gray-600">
                  <th className="px-3 py-2">Mã NV</th>
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">Phòng ban</th>
                  <th className="px-3 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-2">{e.employeeCode}</td>
                    <td className="px-3 py-2 font-medium">{e.fullName}</td>
                    <td className="px-3 py-2">{e.departmentId}</td>
                    <td className="px-3 py-2 text-right">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Nếu chưa có dữ liệu → hiện như cũ
          <div className="text-center text-gray-400 py-20">
            Chưa có dữ liệu nhân viên. Vui lòng thêm mới.
          </div>
        )}
      </main>

      <EmployeeModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        fetchEmployees(); // refresh sau khi thêm
      }} />

    </div>
  );
};

export default App;
