import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ThumbsUp, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';

function Dashboard() {
  const [postCount, setPostCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API + "post")
      .then(res => {
        const data = res.data?.data || [];
        setPosts(data);
        setPostCount(data.length);
      })
      .catch(() => { setPosts([]); setPostCount(0); });

    axios.get(import.meta.env.VITE_API + "event")
      .then(res => {
        const data = res.data?.data || [];
        setEvents(data);
        setEventCount(data.length);
      })
      .catch(() => { setEvents([]); setEventCount(0); });

    axios.get(import.meta.env.VITE_API + "product")
      .then(res => {
        const data = res.data?.data || [];
        setProducts(data);
        setProductCount(data.length);
      })
      .catch(() => { setProducts([]); setProductCount(0); });

    axios.get(import.meta.env.VITE_API + "allmember")
      .then(res => {
        // NOTE: Keep original behavior; adjust mapping if backend returns a different shape
        setUserCount(res?.data?.rows?.cccccc || 0);
      })
      .catch(() => setUserCount(0));
  }, []);

  // Derived metrics for a more insightful dashboard
  const now = useMemo(() => new Date(), []);
  const eventLikesTotal = useMemo(() => {
    try { return (events || []).reduce((s, e) => s + Number(e?.likes || 0), 0); } catch { return 0; }
  }, [events]);
  const eventOngoingCount = useMemo(() => {
    try {
      return (events || []).filter((e) => {
        const s = e?.date_start ? new Date(e.date_start) : null;
        const en = e?.date_end ? new Date(e.date_end) : null;
        return s && !isNaN(s) && s <= now && (!en || isNaN(en) || now <= en);
      }).length;
    } catch { return 0; }
  }, [events, now]);
  const eventUpcomingCount = useMemo(() => {
    try {
      return (events || []).filter((e) => {
        const s = e?.date_start ? new Date(e.date_start) : null;
        return s && !isNaN(s) && s > now;
      }).length;
    } catch { return 0; }
  }, [events, now]);
  const avgProductPrice = useMemo(() => {
    try {
      if (!products?.length) return 0;
      const sum = products.reduce((s, p) => s + (parseFloat(p?.price) || 0), 0);
      return sum / products.length;
    } catch { return 0; }
  }, [products]);

  const recentEvents = useMemo(() => {
    try {
      return [...(events || [])]
        .sort((a, b) => new Date(b?.date_start || 0) - new Date(a?.date_start || 0))
        .slice(0, 5);
    } catch { return []; }
  }, [events]);

  const recentProducts = useMemo(() => {
    try {
      return [...(products || [])]
        .sort((a, b) => Number(b?.id_product || 0) - Number(a?.id_product || 0))
        .slice(0, 5);
    } catch { return []; }
  }, [products]);

  const recentPosts = useMemo(() => {
    try {
      const arr = [...(posts || [])];
      arr.sort((a, b) => {
        const da = a?.date ? new Date(a.date) : null;
        const db = b?.date ? new Date(b.date) : null;
        const va = da && !isNaN(da) ? da.getTime() : 0;
        const vb = db && !isNaN(db) ? db.getTime() : 0;
        if (vb !== va) return vb - va;
        return Number(b?.id_post || 0) - Number(a?.id_post || 0);
      });
      return arr.slice(0, 5);
    } catch { return []; }
  }, [posts]);

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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">กิจกรรมล่าสุด</h3>
          <div className="divide-y divide-gray-100">
            {recentEvents.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">ไม่มีข้อมูล</div>
            )}
            {recentEvents.map((ev) => (
              <div key={ev.id_event} className="py-3 flex items-center justify-between">
                <div className="text-gray-800 font-medium truncate mr-3">{ev.name_event || '-'}</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {ev.date_start ? new Date(ev.date_start).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">สินค้าใหม่ล่าสุด</h3>
          <div className="divide-y divide-gray-100">
            {recentProducts.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">ไม่มีข้อมูล</div>
            )}
            {recentProducts.map((pd) => (
              <div key={pd.id_product} className="py-3 flex items-center justify-between">
                <div className="text-gray-800 font-medium truncate mr-3">{pd.name_product || '-'}</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">{parseFloat(pd.price || 0).toLocaleString()} บาท</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">สถานที่ล่าสุด</h3>
            <MapPin className="w-5 h-5 text-purple-500" />
          </div>
          <div className="divide-y divide-gray-100">
            {recentPosts.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">ไม่มีข้อมูล</div>
            )}
            {recentPosts.map((ps) => (
              <div key={ps.id_post || ps.name_location} className="py-3 flex items-center justify-between">
                <div className="text-gray-800 font-medium truncate mr-3">{ps.name_location || '-'}</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {ps.date ? new Date(ps.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
