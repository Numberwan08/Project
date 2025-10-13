import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [postCount, setPostCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API + "post")
      .then(res => setPostCount(res.data.data ? res.data.data.length : 0))
      .catch(() => setPostCount(0));
    axios.get(import.meta.env.VITE_API + "event")
      .then(res => setEventCount(res.data.data ? res.data.data.length : 0))
      .catch(() => setEventCount(0));
    axios.get(import.meta.env.VITE_API + "product")
      .then(res => setProductCount(res.data.data ? res.data.data.length : 0))
      .catch(() => setProductCount(0));
    axios.get(import.meta.env.VITE_API + "allmember")
      .then(res =>{
         setUserCount(res.data.rows.cccccc)
      }
      )
      .catch(() => setUserCount(0));

      
  }, []);

  return (
    <div className="flex flex-col items-center text-center min-h-screen p-4">
      <div className="text-4xl font-bold mb-8">Dashboard</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-5xl mb-10">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border border-emerald-200">
          <div className="text-emerald-600 text-5xl font-bold">{postCount}</div>
          <div className="mt-2 text-lg font-semibold">โพสต์ทั้งหมด</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border border-blue-200">
          <div className="text-blue-600 text-5xl font-bold">{eventCount}</div>
          <div className="mt-2 text-lg font-semibold">กิจกรรมทั้งหมด</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border border-pink-200">
          <div className="text-pink-600 text-5xl font-bold">{productCount}</div>
          <div className="mt-2 text-lg font-semibold">สินค้าทั้งหมด</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border border-gray-200">
          <div className="text-gray-700 text-5xl font-bold">{userCount}</div>
          <div className="mt-2 text-lg font-semibold">ผู้ใช้งานทั้งหมด</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;