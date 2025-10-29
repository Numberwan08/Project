import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Trash2, ChevronLeft, ChevronRight, Search, Package, MapPin, ExternalLink } from 'lucide-react'
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProductControllers() {
  const [products, setProducts] = useState([]);
  const [pending, setPending] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'

  useEffect(() => {
    fetchProducts();
    fetchPending();
    fetchRejected();
  }, []);

  const fetchProducts = () => {
    axios.get(import.meta.env.VITE_API + "product")
      .then(res => setProducts(res.data.data || []))
      .catch(() => setProducts([]));
  };

  const fetchPending = () => {
    axios.get(import.meta.env.VITE_API + "product/pending")
      .then(res => setPending(res.data.data || []))
      .catch(() => setPending([]));
  };

  const fetchRejected = () => {
    axios.get(import.meta.env.VITE_API + "product/rejected")
      .then(res => setRejected(res.data.data || []))
      .catch(() => setRejected([]));
  };

  const handleDelete = async (id_product) => {
    if (window.confirm("ยืนยันการลบสินค้านี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `product/${id_product}`);
        fetchProducts();
        fetchPending();
        fetchRejected();
        toast.success("ลบสินค้าสำเร็จ", { autoClose: 500 ,position: "top-center",});
      } catch (err) {
        toast.error("ลบสินค้าไม่สำเร็จ", { autoClose: 500 ,position: "top-center",});
      }
    }
  };

  const handleApprove = async (id_product) => {
    try {
      await axios.patch(import.meta.env.VITE_API + `product/${id_product}/status`, { status: 'อนุมัติ' });
      toast.success('อนุมัติสินค้าแล้ว', { autoClose: 800, position: 'top-center' });
      fetchPending();
      fetchRejected();
      fetchProducts();
    } catch (e) {
      toast.error('อนุมัติสินค้าไม่สำเร็จ', { autoClose: 800, position: 'top-center' });
    }
  };

  const handleReject = async (id_product) => {
    if (!window.confirm('ยืนยันการปฎิเสธสินค้านี้?')) return;
    try {
      await axios.patch(import.meta.env.VITE_API + `product/${id_product}/status`, { status: 'ปฎิเสธ' });
      toast.success('ปฎิเสธสินค้าแล้ว', { autoClose: 800, position: 'top-center' });
      fetchPending();
      fetchRejected();
    } catch (e) {
      toast.error('ปฎิเสธสินค้าไม่สำเร็จ', { autoClose: 800, position: 'top-center' });
    }
  };

  const list = tab === 'pending' ? pending : (tab === 'rejected' ? rejected : products);
  const filteredProducts = list.filter(item => {
  const searchText = search.toLowerCase();
  return (
    (item.name_product && item.name_product.toLowerCase().includes(searchText)) ||
    (item.detail_product && item.detail_product.toLowerCase().includes(searchText)) ||
    (item.name_location && item.name_location.toLowerCase().includes(searchText))
  );
});

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">จัดการสินค้า</h1>
          <p className="text-sm text-gray-600">อนุมัติสินค้าที่รอดำเนินการก่อนแสดงผล</p>
          <div className="mt-4 inline-flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
            <button
              className={`px-4 py-2 text-sm font-medium ${tab==='pending' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => { setTab('pending'); setPage(1);} }
            >รอดำเนินการ ({pending.length})</button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${tab==='approved' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => { setTab('approved'); setPage(1);} }
            >ผ่านการอนุมัติ ({products.length})</button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${tab==='rejected' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => { setTab('rejected'); setPage(1);} }
            >ปฎิเสธ ({rejected.length})</button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="ค้นหาชื่อสินค้า..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className=" px-4 py-3 text-center font-medium text-sm">ลำดับ</th>
                  <th className=" px-4 py-3 text-left font-medium text-sm">โปรไฟล์</th>
                  <th className=" px-4 py-3 text-left font-medium text-sm">ชื่อสินค้า</th>
                  <th className=" px-4 py-3 text-left font-medium text-sm">รายละเอียด</th>
                  <th className=" px-4 py-3 text-left font-medium text-sm">ราคา</th>
                  <th className=" px-4 py-3 text-left font-medium text-sm">สถานที่</th>
                  <th className=" px-4 py-3 text-center font-medium text-sm">{tab==='pending' ? 'ตรวจสอบ' : 'จัดการ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Package className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">ไม่พบข้อมูลสินค้า</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((item, idx) => (
                    <tr 
                      key={item.id_product}
                      className="hover:bg-purple-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-center text-gray-700 font-medium text-sm">
                        {(page - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={item.images}
                          alt={item.name_product}
                          className="w-16 h-16 object-cover rounded-lg shadow-md border-2 border-gray-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{item.name_product}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {item.detail_product}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {item.price} บาท
                        </span>
                      </td>
                      <td>
                       
                        <div className="flex font-medium text-gray-900 text-sm"> <MapPin size={14} className="text-purple-500 mt-1 mr-1" />{item.name_location || "ไม่มีสถานที่"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          {tab === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(item.id_product)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleReject(item.id_product)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                ปฎิเสธ
                              </button>
                              <a
                                href={`/detall_att/${item.id_post}?highlightProduct=${item.id_product}&suppressHiddenToast=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                โพสต์
                              </a>
                            </>
                          ) : tab === 'approved' ? (
                            <>
                              <a
                                href={`/detall_att/${item.id_post}?highlightProduct=${item.id_product}&suppressHiddenToast=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                โพสต์
                              </a>
                              <button
                                onClick={() => handleDelete(item.id_product)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                ลบ
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(item.id_product)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                อนุมัติ
                              </button>
                              <a
                                href={`/detall_att/${item.id_post}?highlightProduct=${item.id_product}&suppressHiddenToast=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                โพสต์
                              </a>
                              <button
                                onClick={() => handleDelete(item.id_product)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                ลบ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                แสดงรายการที่ {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredProducts.length)} จากทั้งหมด {filteredProducts.length} รายการ
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium shadow-sm text-xs">
                  {page} / {totalPages || 1}
                </span>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages || totalPages === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                >
                  ถัดไป
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductControllers
