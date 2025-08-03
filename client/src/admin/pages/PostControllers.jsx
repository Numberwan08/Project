import React, { useEffect, useState } from 'react'
import axios from 'axios'

function PostControllers() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // โหลดข้อมูลโพสต์ทั้งหมด
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    axios.get(import.meta.env.VITE_API + "post")
      .then(res => setPosts(res.data.data || []))
      .catch(() => setPosts([]));
  };

  // ฟังก์ชันลบโพสต์
  const handleDelete = async (id_post) => {
    if (window.confirm("ยืนยันการลบโพสต์นี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `post/${id_post}`);
        fetchPosts();
      } catch (err) {
        alert("ลบโพสต์ไม่สำเร็จ");
      }
    }
  };

  // filter ตามชื่อสถานที่
  const filteredPosts = posts.filter(item =>
    item.name_location
      ? item.name_location.toLowerCase().includes(search.toLowerCase())
      : false
  );

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const paginatedPosts = filteredPosts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center text-center min-h-screen p-4 text-4xl overflow-y-auto">
      จัดการโพสต์
      
      <div className="mt-5">
        <input
          type="text"
          className="input input-bordered w-96 text-base"
          placeholder="ค้นหาชื่อสถานที่"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1); // reset page when search
          }}
        />
      </div>
      
      <div className="p-4 mt-3 overflow-x-auto w-full">
        <table className="min-w-[1200px] w-full text-sm text-left text-gray-700 border border-gray-300">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="w-[8%] border text-center">ลำดับ</th>
              <th className="w-[15%] px-4 py-2 border">โปรไฟล์</th>
              <th className="w-[30%] px-4 py-2 border">ชื่อสถานที่</th>
              <th className="w-[20%] px-4 py-2 border">รายละเอียด</th>
              <th className="w-[12%] px-4 py-2 border">วันที่โพสต์</th>
              <th className="w-[15%] px-4 py-2 border">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPosts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400 text-lg">
                  ไม่พบข้อมูลโพสต์
                </td>
              </tr>
            )}
            {paginatedPosts.map((item, idx) => (
              <tr className="hover:bg-gray-100" key={item.id_post}>
                <td className="text-center border">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-2 border">
                  <img
                    src={item.images}
                    alt={item.name_location}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-2 border">{item.name_location}</td>
                <td className="px-4 py-2 border">{item.detail_location}</td>
                <td className="px-4 py-2 border">
                  {item.date ? new Date(item.date).toLocaleDateString("th-TH") : "-"}
                </td>
                <td className="px-4 py-2 border">
                  <button
                    className="btn btn-error btn-sm mr-2"
                    onClick={() => handleDelete(item.id_post)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mt-4 text-base">
          <button
            className="btn btn-sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {totalPages || 1}
          </span>
          <button
            className="btn btn-sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostControllers