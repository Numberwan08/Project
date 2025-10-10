import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ThumbsUp } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useReport } from "../context/ReportContext";

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function Detall_Event() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [nearbyEvent, setNerabyEvent] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentModal, setCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentStar, setCommentStar] = useState(0);
  const [commentFile, setCommentFile] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({}); // id_comment -> boolean
  const [repliesMap, setRepliesMap] = useState({}); // id_comment -> replies[]
  const [replyInputs, setReplyInputs] = useState({}); // id_comment -> text
  const [replyFiles, setReplyFiles] = useState({}); // id_comment -> File
  const location = useLocation();
  const [highlightCommentId, setHighlightCommentId] = useState(null);
  const [highlightReplyId, setHighlightReplyId] = useState(null);

  const userId = localStorage.getItem("userId");
  const { isReportedEventComment, isReportedEventReply, refreshMySubmitted } = useReport();

  const getNearbyEvent = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API + `nearby_event/${id}`
      );
      console.log("nearby event", res.data);
      setNerabyEvent(res.data.data || []);
    } catch (err) {
      console.log("error get nearby event", err);
    }
  };
  const getEvent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `get_event/${id}`);
      setData(res.data.data);
      // ตรวจสอบสถานะไลค์
      if (userId) {
        const resCheck = await axios.get(
          import.meta.env.VITE_API + `event/likes/check/${id}/${userId}`
        );
        setLiked(!!resCheck.data.liked);
      } else {
        setLiked(false);
      }
    } catch (err) {
      console.log("error get data", err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันไลค์/อันไลค์
  const handlelike = async (item) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนกดไลค์!", {
        position: "top-center",
        autoClose: 1500,
      });
      return;
    }

    try {
      if (liked) {
        await axios.delete(
          import.meta.env.VITE_API + `event/likes/${item.id_event}/${userId}`
        );
        setLiked(false);
      } else {
        await axios.post(
          import.meta.env.VITE_API + `event/likes/${item.id_event}`,
          { userId }
        );

        setLiked(true);
      }
      getEvent();
    } catch (err) {
      console.log("Error like/unlike event : ", err);
    }
  };

  useEffect(() => {
    getEvent();
    getNearbyEvent();
    // Fetch comments
    const fetchComments = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API}event/comment_id/${id}`);
        setComments(res.data?.data || []);
        // parse highlight from query
        const params = new URLSearchParams(location.search);
        const hC = params.get('highlightComment');
        const hR = params.get('highlightReply');
        if (hC) {
          setHighlightCommentId(hC);
          setExpandedReplies((prev) => ({ ...prev, [hC]: true }));
          if (hR) await fetchReplies(hC);
          setTimeout(() => {
            const el = document.getElementById(hR ? `reply-${hR}` : `comment-${hC}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      } catch (e) {
        setComments([]);
      }
    };
    fetchComments();
    // eslint-disable-next-line
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilEvent = (startDate) => {
    if (!startDate) return null;
    const today = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchReplies = async (id_comment) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API}event/comment/${id_comment}/replies`);
      setRepliesMap((prev) => ({ ...prev, [id_comment]: res.data?.data || [] }));
    } catch (e) {
      setRepliesMap((prev) => ({ ...prev, [id_comment]: [] }));
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนคอมเมนต์", { position: "top-center", autoClose: 1200 });
      return;
    }
    try {
      setCommentSubmitting(true);
      const fd = new FormData();
      fd.append('userId', userId);
      fd.append('star', commentStar || 0);
      fd.append('comment', commentText || '');
      if (commentFile) fd.append('image', commentFile);
      await axios.post(`${import.meta.env.VITE_API}event/comment/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('คอมเมนต์สำเร็จ', { position: 'top-center', autoClose: 1000 });
      setCommentModal(false);
      setCommentText(''); setCommentStar(0); setCommentFile(null);
      const res = await axios.get(`${import.meta.env.VITE_API}event/comment_id/${id}`);
      setComments(res.data?.data || []);
    } catch (err) {
      toast.error('ไม่สามารถคอมเมนต์ได้', { position: 'top-center', autoClose: 1200 });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const submitReply = async (id_comment) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนตอบกลับ", { position: "top-center", autoClose: 1200 });
      return;
    }
    const text = replyInputs[id_comment]?.trim();
    if (!text) return;
    try {
      const fd = new FormData();
      fd.append('id_user', userId);
      fd.append('reply', text);
      const f = replyFiles[id_comment];
      if (f) fd.append('image', f);
      await axios.post(`${import.meta.env.VITE_API}event/comment/${id_comment}/replies`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReplyInputs((p) => ({ ...p, [id_comment]: '' }));
      setReplyFiles((p) => ({ ...p, [id_comment]: null }));
      await fetchReplies(id_comment);
    } catch (e) {
      toast.error('ไม่สามารถตอบกลับได้', { position: 'top-center', autoClose: 1200 });
    }
  };

  // Report
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: 'comment'|'reply', id_comment, id_reply }
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const openReport = (payload) => { setReportTarget(payload); setReportReason(''); setReportDetails(''); setShowReport(true); };
  const submitReport = async (e) => {
    e.preventDefault();
    if (!userId || !reportTarget) return;
    try {
      setReportSubmitting(true);
      if (reportTarget.type === 'comment') {
        await axios.post(`${import.meta.env.VITE_API}report/event-comment`, {
          id_event_comment: reportTarget.id_comment,
          id_event: id,
          id_user: userId,
          reason: reportReason,
          details: reportDetails,
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API}report/event-reply`, {
          id_event_reply: reportTarget.id_reply,
          id_event_comment: reportTarget.id_comment,
          id_event: id,
          id_user: userId,
          reason: reportReason,
          details: reportDetails,
        });
      }
      toast.success('ส่งรายงานสำเร็จ', { position: 'top-center', autoClose: 1000 });
      setShowReport(false);
      await refreshMySubmitted();
    } catch (err) {
      toast.error('ส่งรายงานไม่สำเร็จ', { position: 'top-center', autoClose: 1200 });
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 text-lg font-medium">
            กำลังโหลดข้อมูลกิจกรรม...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {data.map((item, index) => {
        const daysUntil = getDaysUntilEvent(item.date_start);
        const isUpcoming = daysUntil > 0;
        const isToday = daysUntil === 0;
        const isPast = daysUntil < 0;

        return (
          <div key={index} className="max-w-7xl mx-auto px-4 py-8">
            <ToastContainer />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ฝั่งซ้าย - รูปภาพและข้อมูลกิจกรรม */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Image */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={item.images}
                      alt={item.name_event}
                      className="w-full h-80 lg:h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setSelectedImage(item.images)}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full shadow-lg">
                        กิจกรรม
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      {isUpcoming && (
                        <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg">
                          เหลืออีก {daysUntil} วัน
                        </span>
                      )}
                      {isToday && (
                        <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-lg animate-pulse">
                          วันนี้!
                        </span>
                      )}
                      {isPast && (
                        <span className="px-3 py-1 bg-gray-500 text-white text-sm font-semibold rounded-full shadow-lg">
                          สิ้นสุดแล้ว
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      คลิกเพื่อดูขนาดใหญ่
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">
                        {item.name_event}
                      </h1>
                      <div className="flex items-center space-x-2">
                        <ThumbsUp
                          color={liked ? "#22c55e" : "#ef4444"}
                          onClick={() => handlelike(item)}
                          className={`cursor-pointer ${
                            liked ? "scale-110" : ""
                          }`}
                        />
                        {item.likes}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {isUpcoming && `เหลืออีก ${daysUntil} วัน`}
                          {isToday && "วันนี้!"}
                          {isPast && "สิ้นสุดแล้ว"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Description */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      รายละเอียดกิจกรรม
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {item.detail_event}
                    </p>
                  </div>

                  {/* Event Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Location */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        สถานที่
                      </h3>
                      <p className="text-blue-700 font-medium">
                        {item.location_event}
                      </p>
                    </div>

                    {/* Contact */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        ติดต่อ
                      </h3>
                      <p className="text-green-700 font-medium">{item.phone}</p>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      วันที่และเวลา
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-purple-700 font-medium mb-1">
                          วันที่เริ่ม:
                        </p>
                        <p className="text-purple-800 font-semibold">
                          {formatDate(item.date_start)}
                        </p>
                        <p className="text-purple-600 text-sm">
                          เวลา {formatTime(item.date_start)}
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-700 font-medium mb-1">
                          วันที่สิ้นสุด:
                        </p>
                        <p className="text-purple-800 font-semibold">
                          {formatDate(item.date_end)}
                        </p>
                        <p className="text-purple-600 text-sm">
                          เวลา {formatTime(item.date_end)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-800">ความคิดเห็น</h3>
                      <button
                        onClick={() => setCommentModal(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                      >เพิ่มความคิดเห็น</button>
                    </div>
                    <div className="space-y-4">
                      {(comments || []).map((c) => (
                        <div key={c.id_comment} id={`comment-${c.id_comment}`} className={`border rounded-lg p-4 ${String(c.id_comment)===String(highlightCommentId)?'ring-2 ring-blue-400':''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {c.user_image && <img src={c.user_image} alt="user" className="w-8 h-8 rounded-full" />}
                              <div>
                                <div className="font-medium">{c.first_name || 'ผู้ใช้'}</div>
                                <div className="text-xs text-gray-500">{new Date(c.date_comment).toLocaleString('th-TH')}</div>
                              </div>
                            </div>
                            <div className="text-xs flex gap-3">
                              {String(c.id_user)!==String(userId) && !isReportedEventComment?.(c.id_comment) && (
                                <button className="text-red-600" onClick={() => openReport({ type:'comment', id_comment: c.id_comment })}>รายงาน</button>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-gray-800">{c.comment}</div>
                          {c.images && <img src={c.images} alt="comment" className="mt-2 rounded-md max-h-40" />}
                          <div className="mt-3">
                            <button
                              className="text-sm text-blue-700"
                              onClick={async () => { const next = !expandedReplies[c.id_comment]; setExpandedReplies((p)=>({ ...p, [c.id_comment]: next })); if (next) await fetchReplies(c.id_comment); }}
                            >{expandedReplies[c.id_comment] ? 'ซ่อนการตอบกลับ' : 'ดูการตอบกลับ'}</button>
                          </div>
                          {expandedReplies[c.id_comment] && (
                            <div className="mt-3 space-y-3">
                              <div className="space-y-2">
                                {(repliesMap[c.id_comment] || []).map((r) => (
                                  <div key={r.id_reply} id={`reply-${r.id_reply}`} className={`pl-4 border-l ${String(r.id_reply)===String(highlightReplyId)?'ring-1 ring-blue-400':''}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        {r.reply_user_image && <img src={r.reply_user_image} className="w-7 h-7 rounded-full" />}
                                        <div>
                                          <div className="text-sm font-medium">{r.reply_user_name || 'ผู้ใช้'}</div>
                                          <div className="text-xs text-gray-500">{new Date(r.reply_date).toLocaleString('th-TH')}</div>
                                        </div>
                                      </div>
                                      <div className="text-xs">
                                        {String(r.id_user)!==String(userId) && !isReportedEventReply?.(r.id_reply) && (
                                          <button className="text-red-600" onClick={() => openReport({ type:'reply', id_comment: c.id_comment, id_reply: r.id_reply })}>รายงาน</button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-sm mt-1">{r.reply}</div>
                                    {r.user_image && <img src={r.user_image} className="mt-2 rounded-md max-h-32" />}
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                                  placeholder="ตอบกลับ..."
                                  value={replyInputs[c.id_comment] || ''}
                                  onChange={(e)=> setReplyInputs((p)=>({ ...p, [c.id_comment]: e.target.value }))}
                                />
                                <input type="file" accept="image/*" onChange={(e)=> setReplyFiles((p)=>({ ...p, [c.id_comment]: e.target.files?.[0] || null }))} />
                                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm" onClick={()=> submitReply(c.id_comment)}>ส่ง</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-sm text-gray-500">ยังไม่มีความคิดเห็น</div>
                      )}
                    </div>
                  </div>
                  {/* End Comments */}
                </div>

                {/* Related Events */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    กิจกรรมใกล้เคียง
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {nearbyEvent.length > 0 ? (
                      nearbyEvent.map((place, idx) => (
                        <Link to={`/detall_event/${place.id_event}`} key={idx}>
                          <div className="relative group cursor-pointer">
                            <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
                              <img
                                src={place.images}
                                alt={place.name_event}
                                className="h-28 object-cover rounded-lg"
                                style={{ maxWidth: "100%" }}
                              />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg">
                              <p className="text-white text-sm font-medium">
                                {place.name_event}
                              </p>
                              <p className="text-purple-100 text-xs">
                                {place.detail_event}
                              </p>
                              <p className="text-purple-200 text-xs">
                                ระยะทาง {place.distance.toFixed(2)} กม.
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-gray-500">ไม่พบสถานที่ใกล้เคียง</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ฝั่งขวา - แผนที่และข้อมูลเพิ่มเติม */}
              <div className="space-y-6">
                {/* Map Section */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-blue-100 px-6 py-4 border-b">
                    <h3 className="font-semibold text-blue-800 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      ตำแหน่งกิจกรรม
                    </h3>
                  </div>

                  <div className="p-6">
                    {/* Map */}
                    <div className="h-64 rounded-xl overflow-hidden border-2 border-blue-100">
                      {item.latitude && item.longitude ? (
                        <MapContainer
                          center={[
                            parseFloat(item.latitude),
                            parseFloat(item.longitude),
                          ]}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                          className="z-0"
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            position={[
                              parseFloat(item.latitude),
                              parseFloat(item.longitude),
                            ]}
                          >
                            <Popup>
                              <div className="text-center p-2">
                                <h3 className="font-semibold text-lg">
                                  {item.name_event}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.location_event}
                                </p>
                                <p className="text-blue-600 font-medium mt-2">
                                  {formatDate(item.date_start)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatTime(item.date_start)}
                                </p>
                                 <p
                                onClick={() => {
                                  window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
                                    "_blank"
                                  );
                                }}
                                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer hover:underline"
                              >
                                 เปิด Google Maps
                              </p>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      ) : (
                        <div className="h-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <svg
                              className="w-12 h-12 mx-auto mb-2 opacity-50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            <p>ไม่มีข้อมูลตำแหน่ง</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="รูปขนาดใหญ่"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="px-5 py-4 border-b font-semibold">เพิ่มความคิดเห็น</div>
            <form onSubmit={submitComment} className="p-5 space-y-3">
              <div>
                <label className="block text-sm mb-1">ข้อความ</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={commentText} onChange={(e)=> setCommentText(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">ให้คะแนน (0-5)</label>
                <input type="number" min={0} max={5} className="w-full border rounded-lg px-3 py-2 text-sm" value={commentStar} onChange={(e)=> setCommentStar(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">รูปภาพ (ถ้ามี)</label>
                <input type="file" accept="image/*" onChange={(e)=> setCommentFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-lg border text-sm" onClick={()=> setCommentModal(false)}>ยกเลิก</button>
                <button type="submit" disabled={commentSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{commentSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="px-5 py-4 border-b font-semibold">รายงาน{reportTarget?.type==='reply'?'การตอบกลับ':'ความคิดเห็น'}</div>
            <form onSubmit={submitReport} className="p-5 space-y-3">
              <div>
                <label className="block text-sm mb-1">เหตุผล</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={reportReason} onChange={(e)=> setReportReason(e.target.value)} required>
                  <option value="">-- เลือกเหตุผล --</option>
                  <option value="spam">สแปม / โฆษณา</option>
                  <option value="harassment">กลั่นแกล้ง / คุกคาม</option>
                  <option value="hate">เฮทสปีช / ความรุนแรง</option>
                  <option value="nudity">รูป/ข้อความไม่เหมาะสม</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={reportDetails} onChange={(e)=> setReportDetails(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-lg border text-sm" onClick={()=> setShowReport(false)}>ยกเลิก</button>
                <button type="submit" disabled={reportSubmitting} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50">{reportSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Detall_Event;
