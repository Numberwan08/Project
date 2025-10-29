import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ThumbsUp, Search, Calendar, MapPin, Clock, User, MessageSquare } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";

function EventPages() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [commentCounts, setCommentCounts] = useState({}); // id_event -> count
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  const [viewFilter, setViewFilter] = useState("active");
  const [filterStart, setFilterStart] = useState(""); // YYYY-MM-DD
  const [filterEnd, setFilterEnd] = useState("");   // YYYY-MM-DD

  // Helpers: work with date-only (ignore time)
  const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const parseDateOnly = (s) => {
    try {
      if (!s) return null;
      const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "event");
      const eventsData = res.data.data || [];
      setEvents(eventsData);

      if (userId) {
        checkLikeStatus(eventsData);
      }
      // Fetch comment counts per event
      fetchCommentCounts(eventsData);
    } catch (error) {
      setEvents([]);
    }
  };

  const fetchCommentCounts = async (eventsData) => {
    try {
      const pairs = await Promise.all(
        (eventsData || []).map(async (ev) => {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_API}event/comment_id/${ev.id_event}`
            );
            const arr = res?.data?.data || [];
            return [ev.id_event, arr.length];
          } catch (_) {
            return [ev.id_event, 0];
          }
        })
      );
      const obj = {};
      for (const [id, count] of pairs) obj[id] = count;
      setCommentCounts(obj);
    } catch (_) {
      setCommentCounts({});
    }
  };

  const checkLikeStatus = async (eventsData) => {
    const likedSet = new Set();

    for (const event of eventsData) {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API}event/likes/check/${
            event.id_event
          }/${userId}`
        );
        if (res.data.liked) {
          likedSet.add(event.id_event);
        }
      } catch (error) {
        console.log("Error checking event like status:", error);
      }
    }

    setLikedEvents(likedSet);
  };

  const handleLikeEvent = async (item) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนกดไลค์!", {
        position: "top-center",
        autoClose: 1500,
      });
      return;
    }

    try {
      const isLiked = likedEvents.has(item.id_event);

      if (isLiked) {
        await axios.delete(
          `${import.meta.env.VITE_API}event/likes/${item.id_event}/${userId}`
        );
        setLikedEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id_event);
          return newSet;
        });

        setEvents((prev) =>
          prev.map((event) =>
            event.id_event === item.id_event
              ? { ...event, likes: event.likes - 1 }
              : event
          )
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API}event/likes/${item.id_event}`,
          { userId }
        );
        setLikedEvents((prev) => new Set([...prev, item.id_event]));

        setEvents((prev) =>
          prev.map((event) =>
            event.id_event === item.id_event
              ? { ...event, likes: event.likes + 1 }
              : event
          )
        );
      }
    } catch (error) {
      console.log("Error toggling event like:", error);
      toast.error("เกิดข้อผิดพลาดในการกดไลค์", {
        position: "top-center",
        autoClose: 1500,
      });
    }
  };

  const today = (() => {
    const t = new Date();
    return toDateOnly(t);
  })();
  const isActiveOrUpcoming = (startDate, endDate) => {
    const start = toDateOnly(new Date(startDate));
    const end = toDateOnly(new Date(endDate));
    return today <= end;
  };
  const isEnded = (endDate) => {
    const end = toDateOnly(new Date(endDate));
    return today > end;
  };

  const getEventStatus = (startDate, endDate) => {
    const start = toDateOnly(new Date(startDate));
    const end = toDateOnly(new Date(endDate));

    if (today > end) {
      return {
        text: "กิจกรรมสิ้นสุดแล้ว",
        color: "bg-gray-100 text-gray-600",
        icon: "ended",
      };
    } else if (today < start) {
      const diffDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        return {
          text: `เริ่มในอีก ${diffDays} วัน`,
          color: "bg-orange-100 text-orange-600",
          icon: "soon",
        };
      }
      return {
        text: `เริ่มในอีก ${diffDays} วัน`,
        color: "bg-blue-100 text-blue-600",
        icon: "upcoming",
      };
    } else {
      return {
        text: "กำลังจัดกิจกรรม",
        color: "bg-green-100 text-green-600",
        icon: "active",
      };
    }
  };

  const q = (search || "").toLowerCase();

const filteredEvents = events
  .filter(item => item.type == 2)
  .filter(item => {
    if (!q) return true; 
    const name = (item.name_event || "").toLowerCase();
    const detailLoc = (item.location_event || "").toLowerCase();
    return name.includes(q) || detailLoc.includes(q);
  })
  .sort((a, b) => {
    const dateA = toDateOnly(new Date(a.date_end));
    const dateB = toDateOnly(new Date(b.date_end));
    const endDateA = toDateOnly(new Date(a.date_start));
    const endDateB = toDateOnly(new Date(b.date_start));

    const isActiveA = today >= dateA && today <= endDateA;
    const isActiveB = today >= dateB && today <= endDateB;
    const isUpcomingA = today < dateA;
    const isUpcomingB = today < dateB;
    const isEndedA = today > endDateA;
    const isEndedB = today > endDateB;

    if (isActiveA && !isActiveB) return -1;
    if (isActiveB && !isActiveA) return 1;

    if (isUpcomingA && !isUpcomingB) return -1;
    if (isUpcomingB && !isUpcomingA) return 1;
    if (isUpcomingA && isUpcomingB) {
      return dateA - dateB; // เรียงจากใกล้ไกล
    }
    if (isEndedA && isEndedB) {
      return endDateB - endDateA; 
    }

    return dateA - dateB;
  });


  const viewFilteredEvents = filteredEvents
    .filter((item) => {
      if (viewFilter === "active") {
        return isActiveOrUpcoming(item.date_start, item.date_end);
      }
      if (viewFilter === "ended") {
        return isEnded(item.date_end);
      }
      return true;
    })
    .filter((item) => {
      // Date range filter (overlap with [filterStart, filterEnd]) using date-only comparisons
      if (!filterStart && !filterEnd) return true;
      const evStart = toDateOnly(new Date(item.date_start));
      const evEnd = toDateOnly(new Date(item.date_end));

      if (filterStart && !filterEnd) {
        const fs = parseDateOnly(filterStart);
        if (!fs) return true;
        return evEnd >= fs;
      }
      if (!filterStart && filterEnd) {
        const fe = parseDateOnly(filterEnd);
        if (!fe) return true;
        return evStart <= fe;
      }
      const fs2 = parseDateOnly(filterStart);
      const fe2 = parseDateOnly(filterEnd);
      if (!fs2 || !fe2) return true;
      return evStart <= fe2 && evEnd >= fs2;
    });

  const totalPages = Math.ceil(viewFilteredEvents.length / itemsPerPage);
  const paginatedEvents = viewFilteredEvents.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ฟอร์มค้นหา */}
        <form
          className="max-w-md mx-auto mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1); // รีเซ็ตหน้าเมื่อค้นหาใหม่
          }}
        >
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div className="relative flex">
            <input
              type="search"
              id="default-search"
              className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="ค้นหากิจกรรม"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
            >
              <Search className="w-4 h-4" />
              ค้นหา
            </button>
          </div>
        </form>

        {/* Toggle filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="inline-flex bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setViewFilter("active");
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                viewFilter === "active"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              กำลังจัด / เริ่มในอีก
            </button>
            <button
              type="button"
              onClick={() => {
                setViewFilter("ended");
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 transition-all ${
                viewFilter === "ended"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              สิ้นสุดแล้ว
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">ตั้งแต่</label>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => {
                  setFilterStart(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                max={filterEnd || undefined}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">ถึง</label>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => {
                  setFilterEnd(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                min={filterStart || undefined}
              />
            </div>
            {(filterStart || filterEnd) && (
              <button
                type="button"
                onClick={() => {
                  setFilterStart("");
                  setFilterEnd("");
                  setPage(1);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedEvents.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ไม่พบข้อมูลกิจกรรม</p>
            </div>
          )}

          {paginatedEvents.map((item) => {
            const status = getEventStatus(item.date_start, item.date_end);

            return (
              <div
                key={item.id_event}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                {/* Image */}
                <div className="relative overflow-hidden h-48">
                  <img
                    src={item.images}
                    alt={item.name_event}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div
                    className={`absolute top-3 right-3 ${status.color} backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                  >
                    <Clock className="w-3 h-3" />
                    {status.text}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">
                    {item.name_event}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.location_event}
                    </p>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="truncate">
                      {new Date(item.date_start).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" "}-{" "}
                      {new Date(item.date_end).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Stats & Author */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    {/* <button
                      onClick={() => handleLikeEvent(item)}
                      className="flex items-center cursor-pointer gap-1.5 group/like"
                    >
                      <ThumbsUp
                        className={`w-5 h-5 transition-all group-hover/like:scale-110 ${
                          likedEvents.has(item.id_event)
                            ? "fill-green-500 text-green-500"
                            : "text-purple-600"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.likes}
                      </span>
                    </button> */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {commentCounts[item.id_event] ?? 0}
                      </span>
                    </div>
{/* 
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span
                        className={`truncate max-w-[100px] ${
                          String(item.id_user) === String(userId)
                            ? "text-green-600 font-bold"
                            : ""
                        }`}
                        title={item.first_name}
                      >
                        {String(item.id_user) === String(userId)
                          ? "ของฉัน"
                          : item.first_name}
                      </span>
                    </div> */}
                  </div>

                  {/* Button */}
                  <Link to={`/detall_event/${item.id_event}`}>
                    <button className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all">
                      ดูรายละเอียด
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

export default EventPages;
