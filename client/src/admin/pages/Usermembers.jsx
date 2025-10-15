import axios from "axios";
import React, { useEffect, useState } from "react";
import { Ban, RotateCcw, Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Usermember() {
  const [post, setPost] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  const getPost = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "member");
      setPost(res.data.rows);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPost();
  }, []);

  // Filter users based on search
  const filteredUsers = post.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id_user?.toString().includes(searchTerm)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleToggleStatus = async (user) => {
    const targetStatus = Number(user.status) === 0 ? 1 : 0;
    const confirmMsg = targetStatus === 0 ? "ยืนยันระงับผู้ใช้นี้?" : "ยืนยันปลดระงับผู้ใช้นี้?";
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await axios.patch(
        import.meta.env.VITE_API + `user/status/${user.id_user}`,
        { status: targetStatus }
      );
      setPost((prev) =>
        prev.map((u) =>
          u.id_user === user.id_user ? { ...u, status: targetStatus } : u
        )
      );
      toast.success(res?.data?.msg || "อัปเดตสถานะสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
    } catch (err) {
      toast.error("อัปเดตสถานะไม่สำเร็จ", { position: "top-center", autoClose: 1000 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-start gap-4">
            {/* ส่วนหัว */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการจำนวนผู้ใช้งาน</h1>
              <p className="text-sm text-gray-500">
                รายการสมาชิกทั้งหมด {filteredUsers.length} คน
              </p>
            </div>

            {/* กล่องค้นหา */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาสมาชิก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    ไอดีผู้ใช้
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">อีเมล</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">สถานะ</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((item, index) => (
                    <tr
                      key={item.id_user}
                      className="border-b border-gray-100 hover:bg-purple-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(page - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {item.id_user}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {item.first_name} {item.last_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.Email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          Number(item.status) === 0
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {Number(item.status) === 0 ? "ระงับ" : "ใช้งาน"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs ${
                            Number(item.status) === 0
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                          title={Number(item.status) === 0 ? "ปลดระงับ" : "ระงับ"}
                          onClick={() => handleToggleStatus(item)}
                        >
                          {Number(item.status) === 0 ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                          {Number(item.status) === 0 ? "ปลดระงับ" : "ระงับ"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">ไม่พบข้อมูลสมาชิก</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                แสดง {(page - 1) * itemsPerPage + 1} -{" "}
                {Math.min(page * itemsPerPage, filteredUsers.length)} จาก{" "}
                {filteredUsers.length} รายการ
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  ก่อนหน้า
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, current page and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? "bg-purple-500 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={handleNext}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Usermember;
