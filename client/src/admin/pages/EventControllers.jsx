import React, { useEffect, useState } from 'react'
import axios from 'axios'

function EventControllers() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // โหลดข้อมูลกิจกรรมทั้งหมด
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    axios.get(import.meta.env.VITE_API + "event")
      .then(res => setEvents(res.data.data || []))
      .catch(() => setEvents([]));
  };

  // ฟังก์ชันลบกิจกรรม
  const handleDelete = async (id_event) => {
    if (window.confirm("ยืนยันการลบกิจกรรมนี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `event/${id_event}`);
        fetchEvents();
      } catch (err) {
        alert("ลบกิจกรรมไม่สำเร็จ");
      }
    }
  };

  // filter ตามชื่อกิจกรรม
  const filteredEvents = events.filter(item =>
    item.name_event
      ? item.name_event.toLowerCase().includes(search.toLowerCase())
      : false
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="flex flex-col items-center text-center min-h-screen p-4 text-4xl">
      จัดการกิจกรรม

      <div className="mt-5">
        <input
          type="text"
          className="input input-bordered w-96 text-base"
          placeholder="ค้นหาชื่อกิจกรรม"
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
              <th className="w-[30%] px-4 py-2 border">ชื่อกิจกรรม</th>
              <th className="w-[20%] px-4 py-2 border">สถานที่</th>
              <th className="w-[12%] px-4 py-2 border">วันที่เริ่ม</th>
              <th className="w-[12%] px-4 py-2 border">วันที่สิ้นสุด</th>
              <th className="w-[15%] px-4 py-2 border">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400 text-lg">
                  ไม่พบข้อมูลกิจกรรม
                </td>
              </tr>
            )}
            {paginatedEvents.map((item, idx) => (
              <tr className="hover:bg-gray-100" key={item.id_event}>
                <td className="text-center border">{(page - 1) * itemsPerPage + idx + 1}</td>
                <td className="px-4 py-2 border">
                  <img
                    src={item.images}
                    alt={item.name_event}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-2 border">{item.name_event}</td>
                <td className="px-4 py-2 border">{item.location_event}</td>
                <td className="px-4 py-2 border">
                  {item.date_start ? new Date(item.date_start).toLocaleDateString("th-TH") : "-"}
                </td>
                <td className="px-4 py-2 border">
                  {item.date_end ? new Date(item.date_end).toLocaleDateString("th-TH") : "-"}
                </td>
                <td className="px-4 py-2 border">
                  <button
                    className="btn btn-error btn-sm mr-2"
                    onClick={() => handleDelete(item.id_event)}
                  >
                    ลบ
                  </button>
                  {/* เพิ่มปุ่มดูรายละเอียด/บล็อคได้ตามต้องการ */}
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

export default EventControllers