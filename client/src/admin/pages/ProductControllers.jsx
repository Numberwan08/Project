import React, { useEffect, useState } from 'react'
import axios from 'axios'

function ProductControllers() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios.get(import.meta.env.VITE_API + "product")
      .then(res => setProducts(res.data.data || []))
      .catch(() => setProducts([]));
  };

  const handleDelete = async (id_product) => {
    if (window.confirm("ยืนยันการลบสินค้านี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `product/${id_product}`);
        fetchProducts();
      } catch (err) {
        alert("ลบสินค้าไม่สำเร็จ");
      }
    }
  };

  const filteredProducts = products.filter(item =>
    item.name_product
      ? item.name_product.toLowerCase().includes(search.toLowerCase())
      : false
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="flex flex-col items-center text-center min-h-screen p-4 text-4xl">
      จัดการสินค้า
      
      <div className="mt-5">
        <input
          type="text"
          className="input input-bordered w-96 text-base"
          placeholder="ค้นหาชื่อสินค้า"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1); // reset page when search
          }}
        />
      </div>
      
      <div className="p-4 mt-3 overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm text-left text-gray-700 border border-gray-300">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="w-[8%] border text-center">ลำดับ</th>
              <th className="w-[15%] px-4 py-2 border">โปรไฟล์</th>
              <th className="w-[30%] px-4 py-2 border">ชื่อสินค้า</th>
              <th className="w-[20%] px-4 py-2 border">รายละเอียด</th>
              <th className="w-[12%] px-4 py-2 border">ราคา</th>
              <th className="w-[15%] px-4 py-2 border">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400 text-lg">
                  ไม่พบข้อมูลสินค้า
                </td>
              </tr>
            )}
            {paginatedProducts.map((item, idx) => (
              <tr className="hover:bg-gray-100" key={item.id_product}>
                <td className="text-center border">{(page - 1) * itemsPerPage + idx + 1}</td>
                <td className="px-4 py-2 border">
                  <img
                    src={item.images}
                    alt={item.name_product}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-2 border">{item.name_product}</td>
                <td className="px-4 py-2 border">{item.detail_product}</td>
                <td className="px-4 py-2 border">{item.price} บาท</td>
                <td className="px-4 py-2 border">
                  <button
                    className="btn btn-error btn-sm mr-2"
                    onClick={() => handleDelete(item.id_product)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className="flex justify-center items-center gap-2 mt-4 text-base">
          <button
            className="btn btn-sm"
            onClick={handlePrev}
            disabled={page === 1}
          >
            ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {totalPages}
          </span>
          <button
            className="btn btn-sm"
            onClick={handleNext}
            disabled={page === totalPages || totalPages === 0}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductControllers