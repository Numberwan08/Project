import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, ThumbsUp } from 'lucide-react';

function EventPages() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(import.meta.env.VITE_API + "event")
      .then(res => setEvents(res.data.data || []))
      .catch(() => setEvents([]));
  }, []);

  const today = new Date();

  const filteredEvents = events
    .filter(item => item.type == 2)
    .filter(item =>
      item.name_event
        ? item.name_event.toLowerCase().includes(search.toLowerCase())
        : false
    )
    .sort((a, b) => {
      // คำนวณวันจากวันนี้ถึง date_start
      const daysA = (new Date(a.date_start) - today) / (1000 * 60 * 60 * 24);
      const daysB = (new Date(b.date_start) - today) / (1000 * 60 * 60 * 24);

      // กิจกรรมที่ใกล้จะเริ่ม (0–10 วัน) มาก่อน
      if (daysA >= 0 && daysA <= 10 && !(daysB >= 0 && daysB <= 10)) return -1;
      if (daysB >= 0 && daysB <= 10 && !(daysA >= 0 && daysA <= 10)) return 1;

      // ถ้าอยู่กลุ่มเดียวกัน → เรียงวันเริ่มใกล้สุด
      return new Date(a.date_start) - new Date(b.date_start);
    });

  return (
    <div>
      <div className="m-5 gap-3 mt-25">
        {/* ค้นหากิจกรรม */}
        <form
          className="max-w-md mx-auto"
          onSubmit={e => e.preventDefault()}
        >
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="ค้นหากิจกรรม"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </form>

        <div className="text-4xl text-center mt-5 mb-3">กิจกรรม</div>

        <div className="flex flex-row flex-wrap gap-5 justify-center p-4">
          {filteredEvents.length === 0 && (
            <div className="text-gray-500 text-lg">ไม่พบข้อมูลกิจกรรม</div>
          )}
          {filteredEvents.map((item) => (
            <div className="card bg-base-100 w-64 shadow-sm" key={item.id_event}>
              <figure>
                <img
                  src={item.images}
                  alt={item.name_event}
                  className="h-40 w-full object-cover"
                />
              </figure>
              <div className="card-body">
                <p className="font-bold">{item.name_event}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {item.location_event}
                </p>

                {/* แสดงสถานะกิจกรรม */}
                <p className="text-sm font-medium text-purple-600">
                  {(() => {
                    const startDate = new Date(item.date_start);
                    const endDate = new Date(item.date_end);

                    if (today > endDate) {
                      return "กิจกรรมสิ้นสุดแล้ว";
                    } else if (today < startDate) {
                      const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
                      return `จะเริ่มในอีก ${diffDays} วัน`;
                    } else {
                      return "กำลังจัดกิจกรรม";
                    }
                  })()}
                </p>

                <div className="flex justify-between items-center w-full mt-2">
                  <div className="flex items-center gap-1">
                    <ThumbsUp color="#9900FF" />
                    <span>{item.likes}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    โพสต์โดย: {item.first_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle color="#9900FF" />
                    <span>0</span>
                  </div>
                </div>

                <Link to={`/detall_event/${item.id_event}`}>
                  <button className="btn bg-purple-600 text-base-100 w-full mt-2">
                    รายละเอียดกิจกรรม
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EventPages;
