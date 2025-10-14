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
  const [commentPage, setCommentPage] = useState(1);
  const COMMENTS_PER_PAGE = 20;
  const [commentModal, setCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentStar, setCommentStar] = useState(0);
  const [commentImages, setCommentImages] = useState([]);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({}); // id_comment -> boolean
  const [repliesMap, setRepliesMap] = useState({}); // id_comment -> replies[]
  const [replyInputs, setReplyInputs] = useState({}); // id_comment -> text
  const [replyFiles, setReplyFiles] = useState({}); // id_comment -> File

  const location = useLocation();
  const [highlightCommentId, setHighlightCommentId] = useState(null);
  const [highlightReplyId, setHighlightReplyId] = useState(null);
  // Inline edit (event comments)
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editCommentRating, setEditCommentRating] = useState(0);
  const [editCommentImages, setEditCommentImages] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Rating summary (from loaded comments)
  const ratingCount = useMemo(() => {
    try {
      return (comments || []).filter((c) => Number(c?.star) > 0).length;
    } catch (_) {
      return 0;
    }
  }, [comments]);
  const avgRating = useMemo(() => {
    try {
      const arr = (comments || [])
        .map((c) => Number(c?.star) || 0)
        .filter((n) => n > 0);
      if (!arr.length) return 0;
      const sum = arr.reduce((a, b) => a + b, 0);
      return Math.round((sum / arr.length) * 10) / 10;
    } catch (_) {
      return 0;
    }
  }, [comments]);

  // Edit/Delete reply (event)
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [editReplyFile, setEditReplyFile] = useState(null);
  const [editReplyLoading, setEditReplyLoading] = useState(false);
  const [galleryModal, setGalleryModal] = useState({ open: false, images: [] });
  const [selectedFromGallery, setSelectedFromGallery] = useState(false);

  const userId = localStorage.getItem("userId");
  const { isReportedEventComment, isReportedEventReply, refreshMySubmitted } =
    useReport();

  // Normalize image path for nearby events to use http://localhost:3000 when backend returns relative paths
  const normalizeEventImage = (img) => {
    try {
      if (!img) return "";
      return /^https?:\/\//i.test(img) ? img : `http://localhost:3000/${img}`;
    } catch {
      return img || "";
    }
  };

  // Status badge helper for nearby events
  const getNearbyStatus = (start, end) => {
    try {
      const now = new Date();
      const s = start ? new Date(start) : null;
      const e = end ? new Date(end) : null;
      if (s && e && now >= s && now <= e) {
        return { text: "กำลังจัด", color: "bg-green-100 text-green-700" };
      }
      if (s && now < s) {
        const diffDays = Math.ceil((s - now) / (1000 * 60 * 60 * 24));
        return {
          text: `เริ่มในอีก ${diffDays} วัน`,
          color: "bg-orange-100 text-orange-700",
        };
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  const getNearbyEvent = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API + `nearby_event/${id}`
      );
      const base = res?.data?.data || [];
      // Enrich with date_start/date_end so we can filter out ended events
      const detailed = await Promise.all(
        base.map(async (p) => {
          try {
            const det = await axios.get(
              import.meta.env.VITE_API + `get_event/${p.id_event}`
            );
            const info = (det?.data?.data && det.data.data[0]) || {};
            return {
              ...p,
              date_start: info.date_start,
              date_end: info.date_end,
              // if nearby returns relative image but detail has absolute, keep nearby image to preserve thumbnail, normalize at render
            };
          } catch (_) {
            return { ...p };
          }
        })
      );

      const now = new Date();
      const isOngoingOrUpcoming = (s, e) => {
        try {
          const start = s ? new Date(s) : null;
          const end = e ? new Date(e) : null;
          if (end && !isNaN(end.getTime())) {
            return end >= now; // not ended yet
          }
          // if end unknown, keep it
          return true;
        } catch {
          return true;
        }
      };

      const filtered = (detailed || []).filter((ev) =>
        isOngoingOrUpcoming(ev.date_start, ev.date_end)
      );
      setNerabyEvent(filtered);
    } catch (err) {
      console.log("error get nearby event", err);
      setNerabyEvent([]);
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
        const res = await axios.get(
          `${import.meta.env.VITE_API}event/comment_id/${id}`
        );
        setComments(res.data?.data || []);
        // parse highlight from query
        const params = new URLSearchParams(location.search);
        const hC = params.get("highlightComment");
        const hR = params.get("highlightReply");
        if (hC) {
          setHighlightCommentId(hC);
          setExpandedReplies((prev) => ({ ...prev, [hC]: true }));
          if (hR) await fetchReplies(hC);
          setTimeout(() => {
            const el = document.getElementById(
              hR ? `reply-${hR}` : `comment-${hC}`
            );
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      } catch (e) {
        setComments([]);
      }
    };
    fetchComments();
    // eslint-disable-next-line
  }, [id]);

  // Relative time formatter
  const timeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "เมื่อสักครู่";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชม. ที่แล้ว`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} วันก่อน`;
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Edit/Delete event comment
  const openEditComment = (item) => {
    setEditingCommentId(item.id_comment);
    setEditCommentText(item.comment || "");
    setEditCommentRating(Number(item.star) || 0);
    setEditCommentImages([]);
  };

  const handleCloseSelectedImage = () => {
    setSelectedImage(null);
    if (selectedFromGallery) {
      setGalleryModal((prev) => ({ ...prev, open: true }));
    }
    setSelectedFromGallery(false);
  };

  // Edit reply
  const openEditReply = (rep) => {
    setEditingReplyId(rep.id_reply);
    setEditReplyText(rep.reply || "");
    setEditReplyFile(null);
  };
  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyText("");
    setEditReplyFile(null);
  };
  const handleEditReplySubmit = async (e, id_comment, id_reply) => {
    e.preventDefault();
    if (!userId) return;
    try {
      setEditReplyLoading(true);
      const form = new FormData();
      form.append("id_user", userId);
      form.append("reply", editReplyText);
      if (editReplyFile) form.append("image", editReplyFile);
      await axios.patch(
        `${
          import.meta.env.VITE_API
        }event/comment/${id_comment}/replies/${id_reply}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      await fetchReplies(id_comment);
      cancelEditReply();
      toast.success("แก้ไขการตอบกลับสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
    } catch (err) {
      console.log("Error edit event reply:", err);
      toast.error("ไม่สามารถแก้ไขการตอบกลับได้", {
        position: "top-center",
        autoClose: 1200,
      });
    } finally {
      setEditReplyLoading(false);
    }
  };
  const handleDeleteReply = async (id_comment, id_reply) => {
    try {
      if (!window.confirm("คุณต้องการลบการตอบกลับนี้ใช่หรือไม่?")) return;
      await axios.delete(
        `${
          import.meta.env.VITE_API
        }event/comment/${id_comment}/replies/${id_reply}`,
        { data: { id_user: userId } }
      );
      await fetchReplies(id_comment);
      toast.success("ลบการตอบกลับสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
    } catch (err) {
      console.log("Error delete event reply:", err);
      toast.error("ไม่สามารถลบการตอบกลับได้", {
        position: "top-center",
        autoClose: 1200,
      });
    }
  };
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
    setEditCommentRating(0);
    setEditCommentImages([]);
  };
  const handleEditCommentSubmit = async (e, id_comment) => {
    e.preventDefault();
    if (!userId) return;
    if (!editCommentText) {
      toast.error("กรุณากรอกข้อความ", {
        position: "top-center",
        autoClose: 1000,
      });
      return;
    }
    try {
      setEditLoading(true);
      const form = new FormData();
      form.append("id_user", userId);
      form.append("comment", editCommentText);
      form.append("star", editCommentRating);
      if (editCommentImages && editCommentImages.length > 0) {
        for (const f of editCommentImages) form.append("images", f);
      }
      const res = await axios.patch(
        `${import.meta.env.VITE_API}event/comment/${id_comment}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updated = res.data?.data;
      setComments((prev) =>
        (prev || []).map((c) =>
          c.id_comment === id_comment
            ? {
                ...c,
                comment: updated?.comment ?? editCommentText,
                star: updated?.star ?? editCommentRating,
                images: updated?.images ?? c.images,
                images_list: updated?.images_list ?? c.images_list,
              }
            : c
        )
      );
      toast.success("แก้ไขความคิดเห็นสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
      cancelEditComment();
    } catch (err) {
      console.log("Error edit event comment:", err);
      toast.error("ไม่สามารถแก้ไขความคิดเห็นได้", {
        position: "top-center",
        autoClose: 1200,
      });
    } finally {
      setEditLoading(false);
    }
  };
  const handleDeleteComment = async (id_comment) => {
    if (!window.confirm("คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API}event/delete_comment/${id_comment}`
      );
      setComments((prev) =>
        (prev || []).filter((c) => c.id_comment !== id_comment)
      );
      toast.success("ลบความคิดเห็นสำเร็จ", {
        position: "top-center",
        autoClose: 900,
      });
    } catch (err) {
      console.log("Error delete event comment:", err);
      toast.error("เกิดข้อผิดพลาดในการลบความคิดเห็น", {
        position: "top-center",
        autoClose: 1200,
      });
    }
  };

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
      const res = await axios.get(
        `${import.meta.env.VITE_API}event/comment/${id_comment}/replies`
      );
      setRepliesMap((prev) => ({
        ...prev,
        [id_comment]: res.data?.data || [],
      }));
    } catch (e) {
      setRepliesMap((prev) => ({ ...prev, [id_comment]: [] }));
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนคอมเมนต์", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    try {
      setCommentSubmitting(true);
      const fd = new FormData();
      fd.append("userId", userId);
      fd.append("star", commentStar || 0);
      fd.append("comment", commentText || "");
      if (commentImages && commentImages.length > 0) {
        for (const f of commentImages) fd.append("images", f);
      }
      await axios.post(`${import.meta.env.VITE_API}event/comment/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("คอมเมนต์สำเร็จ", {
        position: "top-center",
        autoClose: 1000,
      });
      setCommentModal(false);
      setCommentText("");
      setCommentStar(0);
      setCommentImages([]);
      const res = await axios.get(
        `${import.meta.env.VITE_API}event/comment_id/${id}`
      );
      setComments(res.data?.data || []);
    } catch (err) {
      toast.error("ไม่สามารถคอมเมนต์ได้", {
        position: "top-center",
        autoClose: 1200,
      });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const submitReply = async (id_comment) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนตอบกลับ", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    const text = replyInputs[id_comment]?.trim();
    if (!text) return;
    try {
      const fd = new FormData();
      fd.append("id_user", userId);
      fd.append("reply", text);
      const f = replyFiles[id_comment];
      if (f) fd.append("image", f);
      await axios.post(
        `${import.meta.env.VITE_API}event/comment/${id_comment}/replies`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setReplyInputs((p) => ({ ...p, [id_comment]: "" }));
      setReplyFiles((p) => ({ ...p, [id_comment]: null }));
      await fetchReplies(id_comment);
    } catch (e) {
      toast.error("ไม่สามารถตอบกลับได้", {
        position: "top-center",
        autoClose: 1200,
      });
    }
  };

  // Report
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { type: 'comment'|'reply', id_comment, id_reply }
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const openReport = (payload) => {
    setReportTarget(payload);
    setReportReason("");
    setReportDetails("");
    setShowReport(true);
  };
  const submitReport = async (e) => {
    e.preventDefault();
    if (!userId || !reportTarget) return;
    try {
      setReportSubmitting(true);
      if (reportTarget.type === "comment") {
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
      toast.success("ส่งรายงานสำเร็จ", {
        position: "top-center",
        autoClose: 1000,
      });
      setShowReport(false);
      await refreshMySubmitted();
    } catch (err) {
      toast.error("ส่งรายงานไม่สำเร็จ", {
        position: "top-center",
        autoClose: 1200,
      });
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
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                          <h4 className="text-sm font-semibold text-yellow-800 whitespace-nowrap">
                            คะแนน{" "}
                            {avgRating > 0
                              ? `${avgRating} (${ratingCount} คน)`
                              : "ไม่มีคะแนน"}
                          </h4>
                        </div>
                        {/* <ThumbsUp
                          color={liked ? "#22c55e" : "#ef4444"}
                          onClick={() => handlelike(item)}
                          className={`cursor-pointer ${
                            liked ? "scale-110" : ""
                          }`}
                        />
                        {item.likes} */}
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
                </div>
                <div className="bg-gradient-to-r bg-gray-100 rounded-lg p-4">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <h3 className="font-bold text-xl mb-4">ความคิดเห็น</h3>

                    <button
                      onClick={() => setCommentModal(true)}
                      className="w-50 cursor-pointer bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors mb-3"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>แสดงความคิดเห็น</span>
                    </button>
                  </div>

                  {/* List */}
                  {comments?.length > 0 ? (
                    <div className="space-y-4">
                      {(comments || [])
                        .slice(
                          (commentPage - 1) * COMMENTS_PER_PAGE,
                          commentPage * COMMENTS_PER_PAGE
                        )
                        .map((c) => (
                          <div
                            key={c.id_comment}
                            id={`comment-${c.id_comment}`}
                            className={`bg-white bg-opacity-80 rounded-lg p-4 text-left text-gray-800 shadow ${
                              String(highlightCommentId) ===
                              String(c.id_comment)
                                ? "ring-2 ring-red-400"
                                : ""
                            }`}
                          >
                            {/* ปุ่มแก้ไข/ลบ ของเจ้าของคอมเมนต์ */}
                            {String(c.id_user) === String(userId) && (
                              <div className="ml-auto flex gap-3 mb-2">
                                <button
                                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                                  onClick={() => openEditComment(c)}
                                >
                                  แก้ไข
                                </button>
                                <button
                                  className="text-red-500 cursor-pointer hover:text-red-700"
                                  onClick={() =>
                                    handleDeleteComment(c.id_comment)
                                  }
                                >
                                  ลบ
                                </button>
                              </div>
                            )}

                            {/* แถวหัวคอมเมนต์ */}
                            <div className="flex items-start gap-3 mb-2">
                              {c.user_image ? (
                                <img
                                  src={c.user_image}
                                  alt="avatar"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-200" />
                              )}

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {c.first_name || "ผู้ใช้"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {timeAgo(c.date_comment)}
                                  </span>

                                  {/* ปุ่มรายงาน (เฉพาะไม่ใช่เจ้าของ และยังไม่เคยรายงาน) */}
                                  {String(c.id_user) !== String(userId) &&
                                    !isReportedEventComment?.(c.id_comment) && (
                                      <button
                                        className="ml-2 text-xs text-red-500 hover:text-red-700"
                                        onClick={() =>
                                          openReport({
                                            type: "comment",
                                            id_comment: c.id_comment,
                                          })
                                        }
                                      >
                                        รายงาน
                                      </button>
                                    )}

                                  {/* คะแนน */}
                                  <div className="flex items-center space-x-1 ml-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      className="w-4 h-4 text-yellow-400"
                                    >
                                      <path d="M12 .587l3.668 7.568L24 9.75l-6 5.85 1.416 8.4L12 19.771l-7.416 4.229L6 15.6 0 9.75l8.332-1.595z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">
                                      {c.star}
                                    </span>
                                  </div>
                                </div>

                                {/* เนื้อความคอมเมนต์ */}
                                <div className="mt-1 text-gray-800">
                                  {c.comment}
                                </div>
                              </div>
                            </div>

                            {/* รูปภาพคอมเมนต์ */}
                            {Array.isArray(c.images_list) &&
                            c.images_list.length > 0
                              ? (() => {
                                  const imgs = c.images_list;
                                  const display = imgs.slice(0, 4);
                                  const extra = Math.max(0, imgs.length - 4);
                                  return (
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {display.map((url, idx) => (
                                        <div key={idx} className="relative">
                                          <img
                                            src={url}
                                            alt={`comment ${idx + 1}`}
                                            className="rounded-lg h-28 md:h-32 lg:h-36 object-cover w-full cursor-pointer"
                                            onClick={() =>
                                              setSelectedImage(url)
                                            }
                                          />
                                          {idx === display.length - 1 &&
                                            extra > 0 && (
                                              <button
                                                type="button"
                                                className="absolute inset-0 bg-black/50 text-white font-semibold text-sm md:text-base rounded-lg flex items-center justify-center"
                                                onClick={() => {
                                                  setSelectedFromGallery(false);
                                                  setGalleryModal({
                                                    open: true,
                                                    images: imgs,
                                                  });
                                                }}
                                              >
                                                ดูทั้งหมด ({imgs.length})
                                              </button>
                                            )}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()
                              : c.images && (
                                  <img
                                    src={c.images}
                                    alt="comment"
                                    className="mt-2 rounded-lg max-h-32 cursor-pointer"
                                    onClick={() => setSelectedImage(c.images)}
                                  />
                                )}

                            {/* ฟอร์มแก้ไขคอมเมนต์ (inline) */}
                            {editingCommentId === c.id_comment && (
                              <form
                                className="mt-3 space-y-3"
                                onSubmit={(e) =>
                                  handleEditCommentSubmit(e, c.id_comment)
                                }
                              >
                                <textarea
                                  className="w-full p-2 border rounded-lg"
                                  rows={3}
                                  value={editCommentText}
                                  onChange={(e) =>
                                    setEditCommentText(e.target.value)
                                  }
                                  placeholder="แก้ไขความคิดเห็นของคุณ"
                                />
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(
                                      e.target.files || []
                                    );
                                    setEditCommentImages(files);
                                  }}
                                  className="file-input file-input-bordered file-input-sm"
                                />
                                {editCommentImages &&
                                  editCommentImages.length > 0 && (
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                      {editCommentImages.map((f, i) => (
                                        <img
                                          key={i}
                                          src={URL.createObjectURL(f)}
                                          alt={`ภาพใหม่ ${i + 1}`}
                                          className="rounded-lg max-h-28 border object-cover w-full"
                                        />
                                      ))}
                                    </div>
                                  )}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                    onClick={cancelEditComment}
                                    disabled={editLoading}
                                  >
                                    ยกเลิก
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                                    disabled={editLoading}
                                  >
                                    {editLoading ? "กำลังบันทึก..." : "บันทึก"}
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* ปุ่มเปิด/ปิดการตอบกลับ */}
                            <div className="mt-3">
                              <button
                                className="text-sm text-purple-700 hover:text-purple-900 font-medium cursor-pointer"
                                onClick={async () => {
                                  const next = !expandedReplies[c.id_comment];
                                  setExpandedReplies((p) => ({
                                    ...p,
                                    [c.id_comment]: next,
                                  }));
                                  if (next) await fetchReplies(c.id_comment);
                                }}
                              >
                                {expandedReplies[c.id_comment]
                                  ? "ซ่อนการตอบกลับ"
                                  : "ดูการตอบกลับ"}
                              </button>
                              {(repliesMap[c.id_comment] || []).length > 0 && (
                                <span className="ml-2 text-xs text-purple-500">
                                  ({(repliesMap[c.id_comment] || []).length})
                                </span>
                              )}
                            </div>

                            {/* รายการตอบกลับ */}
                            {expandedReplies[c.id_comment] && (
                              <div className="mt-3 pl-4 border-l-2 border-purple-200 space-y-3">
                                {(repliesMap[c.id_comment] || []).map((r) => (
                                  <div
                                    key={r.id_reply}
                                    id={`reply-${r.id_reply}`}
                                    className={`bg-purple-50 rounded-md p-3 ${
                                      String(r.id_reply) ===
                                      String(highlightReplyId)
                                        ? "ring-1 ring-red-400"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        {r.reply_user_image ? (
                                          <img
                                            src={r.reply_user_image}
                                            className="w-7 h-7 rounded-full"
                                          />
                                        ) : (
                                          <div className="w-7 h-7 rounded-full bg-purple-200" />
                                        )}
                                        <div>
                                          <div className="text-sm font-medium">
                                            {r.reply_user_name || "ผู้ใช้"}{" "}
                                            <a className="text-xs text-gray-500">
                                              {" "}
                                              {timeAgo(r.reply_date)}
                                            </a>
                                          </div>
                                        </div>
                                      </div>

                                      {String(r.id_user) === String(userId) ? (
                                        <div className="text-xs">
                                          {editingReplyId === r.id_reply ? (
                                            <button
                                              className="text-gray-500"
                                              onClick={cancelEditReply}
                                              type="button"
                                            >
                                              ยกเลิก
                                            </button>
                                          ) : (
                                            <>
                                              <button
                                                className="text-blue-600 mr-2"
                                                onClick={() => openEditReply(r)}
                                                type="button"
                                              >
                                                แก้ไข
                                              </button>
                                              <button
                                                className="text-red-600"
                                                onClick={() =>
                                                  handleDeleteReply(
                                                    c.id_comment,
                                                    r.id_reply
                                                  )
                                                }
                                                type="button"
                                              >
                                                ลบ
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-xs">
                                          {!isReportedEventReply?.(
                                            r.id_reply
                                          ) && (
                                            <button
                                              className="text-red-600"
                                              onClick={() =>
                                                openReport({
                                                  type: "reply",
                                                  id_comment: c.id_comment,
                                                  id_reply: r.id_reply,
                                                })
                                              }
                                              type="button"
                                            >
                                              รายงาน
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* เนื้อหา / ฟอร์มแก้ไขตอบกลับ */}
                                    {editingReplyId === r.id_reply ? (
                                      <form
                                        className="mt-2 space-y-3"
                                        onSubmit={(e) =>
                                          handleEditReplySubmit(
                                            e,
                                            c.id_comment,
                                            r.id_reply
                                          )
                                        }
                                      >
                                        <textarea
                                          className="w-full p-2 border rounded-lg text-sm"
                                          rows={3}
                                          value={editReplyText}
                                          onChange={(e) =>
                                            setEditReplyText(e.target.value)
                                          }
                                          placeholder="แก้ไขการตอบกลับของคุณ"
                                          required
                                        />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="file-input file-input-bordered file-input-sm"
                                          onChange={(e) =>
                                            setEditReplyFile(
                                              e.target.files?.[0] || null
                                            )
                                          }
                                        />
                                        {editReplyFile && (
                                          <img
                                            src={URL.createObjectURL(
                                              editReplyFile
                                            )}
                                            alt="ภาพตัวอย่าง"
                                            className="mt-2 rounded-lg max-h-32 border"
                                          />
                                        )}
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                                            onClick={cancelEditReply}
                                            disabled={editReplyLoading}
                                          >
                                            ยกเลิก
                                          </button>
                                          <button
                                            type="submit"
                                            className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                                            disabled={editReplyLoading}
                                          >
                                            {editReplyLoading
                                              ? "กำลังบันทึก..."
                                              : "บันทึก"}
                                          </button>
                                        </div>
                                      </form>
                                    ) : (
                                      <>
                                        <div className="text-sm mt-1">
                                          {r.reply}
                                        </div>
                                        {r.user_image && (
                                          <img
                                            src={r.user_image}
                                            className="mt-2 rounded-md max-h-32"
                                          />
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}

                                {/* กล่องตอบกลับใหม่ */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    className="input input-sm input-bordered flex-1"
                                    placeholder="ตอบกลับ..."
                                    value={replyInputs[c.id_comment] || ""}
                                    onChange={(e) =>
                                      setReplyInputs((p) => ({
                                        ...p,
                                        [c.id_comment]: e.target.value,
                                      }))
                                    }
                                  />
                                  <input
                                    type="file"
                                    className="file-input file-input-bordered file-input-sm"
                                    accept="image/*"
                                    onChange={(e) =>
                                      setReplyFiles((p) => ({
                                        ...p,
                                        [c.id_comment]:
                                          e.target.files?.[0] || null,
                                      }))
                                    }
                                  />
                                  <button
                                    className="btn btn-sm btn-primary cursor-pointer"
                                    onClick={() => submitReply(c.id_comment)}
                                  >
                                    ตอบกลับ
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                      {/* Pagination (จัดวางกึ่งกลางแบบตัวอย่าง) */}
                      <div className="flex justify-center mt-4 space-x-2">
                        <button
                          className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                          onClick={() =>
                            setCommentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={commentPage === 1}
                        >
                          ก่อนหน้า
                        </button>

                        <span className="px-2">
                          หน้า {commentPage} /{" "}
                          {Math.ceil(
                            (comments || []).length / COMMENTS_PER_PAGE
                          )}
                        </span>

                        <button
                          className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                          onClick={() =>
                            setCommentPage((p) =>
                              Math.min(
                                Math.ceil(
                                  (comments || []).length / COMMENTS_PER_PAGE
                                ),
                                p + 1
                              )
                            )
                          }
                          disabled={
                            commentPage ===
                            Math.ceil(
                              (comments || []).length / COMMENTS_PER_PAGE
                            )
                          }
                        >
                          ถัดไป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-purple-100 text-sm">
                      ยังไม่มีความคิดเห็น
                    </p>
                  )}
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

                {/* Related Events */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    กิจกรรมใกล้เคียง
                  </h2>

                  {nearbyEvent.length > 0 ? (
                    <div className="flex flex-col gap-5">
                      {nearbyEvent.map((place) => {
                        const desc =
                          place.detail_event || place.detail_location || "";
                        const max = 90;
                        const short =
                          desc.length > max ? desc.slice(0, max) + "…" : desc;

                        const st = getNearbyStatus(
                          place.date_start,
                          place.date_end
                        );
                        return (
                          <Link
                            key={place.id_event}
                            to={`/detall_event/${place.id_event}`}
                            className="group flex items-start gap-4 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white"
                          >
                            {/* รูปด้านซ้าย */}
                            <div className="relative flex-shrink-0 w-36 h-24 bg-gray-100 overflow-hidden rounded-lg">
                              <img
                                src={normalizeEventImage(place.images)}
                                alt={place.name_event}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {/* Badge ระยะทาง */}
                              <div className="absolute bottom-1 right-1">
                                <span className="bg-white/90 text-gray-700 text-[11px] px-2 py-0.5 rounded-full shadow">
                                  {Number(place.distance || 0).toFixed(1)} กม.
                                </span>
                              </div>
                            </div>

                            {/* ข้อมูลด้านขวา */}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {place.name_event}
                              </p>
                              {st && (
                                <span
                                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] ${st.color}`}
                                >
                                  {st.text}
                                </span>
                              )}
                              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                {short || "—"}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">ไม่พบกิจกรรมใกล้เคียง</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Image Modal */}
      {selectedImage && (
        <dialog open className="modal" onClose={handleCloseSelectedImage}>
          <div
            className="modal-box max-w-2xl p-3"
            onClick={(e) => e.stopPropagation()} // ป้องกันคลิกในรูปแล้วปิด
          >
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                aria-label="ปิด"
                title="ปิด"
                onClick={handleCloseSelectedImage}
              >
                ✕
              </button>
            </form>

            <img
              src={selectedImage}
              alt="รูปขนาดใหญ่"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>

          <form
            method="dialog"
            className="modal-backdrop bg-white/60 backdrop-blur-sm"
            onClick={handleCloseSelectedImage}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
      {galleryModal.open && (
        <dialog
          open
          className="modal"
          onClose={() => setGalleryModal({ open: false, images: [] })}
        >
          {/* กล่องโมดอล */}
          <div
            className="modal-box max-w-4xl p-4"
            onClick={(e) => e.stopPropagation()} // กันคลิกในกล่องแล้วปิด
            role="dialog"
            aria-modal="true"
            aria-label="รูปภาพทั้งหมด"
          >
            <button
              onClick={() => setGalleryModal({ open: false, images: [] })}
              className="btn btn-sm btn-ghost absolute right-3 top-3"
              aria-label="ปิด"
              title="ปิด"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-3">รูปภาพทั้งหมด</h3>

            {Array.isArray(galleryModal.images) &&
            galleryModal.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[70vh] overflow-auto">
                {galleryModal.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`all-${i}`}
                    className="rounded-lg object-cover w-full h-40 cursor-pointer"
                    onClick={() => {
                      setSelectedImage(url);
                      setSelectedFromGallery(true);
                      setGalleryModal((prev) => ({ ...prev, open: false }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">ไม่พบรูปภาพ</p>
            )}
          </div>

          {/* พื้นหลัง (กดเพื่อปิด) */}
          <form
            method="dialog"
            className="modal-backdrop bg-white/60 backdrop-blur-sm"
            onClick={() => setGalleryModal({ open: false, images: [] })}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {commentModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg relative ">
            {/* Close Button */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick={() => setCommentModal(false)}
            >
              ✕
            </button>

            {/* Header */}
            <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
              แสดงความคิดเห็น
            </h2>

            {/* Form */}
            <form onSubmit={submitComment} className="space-y-6">
              {/* Comment Text Area */}
              <div className="form-control">
                <label className="label flex mb-2">
                  <span className="label-text font-medium">
                    ความคิดเห็นของคุณ
                  </span>
                </label>
                <textarea
                  className="textarea w-full textarea-bordered textarea-primary h-24 resize-none focus:textarea-primary"
                  placeholder="เขียนความคิดเห็นของคุณ..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
              </div>

              {/* Rating Section */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">ให้คะแนน</span>
                </label>
                <div className="rating rating-lg">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <input
                      key={num}
                      type="radio"
                      name="rating"
                      className="mask mask-star-2 bg-orange-400"
                      checked={Number(commentStar) === num}
                      onChange={() => setCommentStar(num)}
                    />
                  ))}
                </div>
                <label className="label">
                  <span className="label-text-alt">
                    คะแนน: {commentStar || 0}/5
                  </span>
                </label>
              </div>

              {/* Image Upload (Multiple) */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    เพิ่มรูปภาพ (เลือกได้หลายรูป)
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setCommentImages(files);
                  }}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
                {commentImages && commentImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {commentImages.map((f, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(f)}
                        alt={`ภาพตัวอย่าง ${idx + 1}`}
                        className="rounded-lg max-h-32 border object-cover w-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCommentModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${
                    commentSubmitting ? "loading" : ""
                  }`}
                  disabled={commentSubmitting}
                >
                  {commentSubmitting ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      ส่งความคิดเห็น
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {false && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="px-5 py-4 border-b font-semibold">
              เพิ่มความคิดเห็น
            </div>
            <form onSubmit={submitComment} className="p-5 space-y-3">
              <div>
                <label className="block text-sm mb-1">ข้อความ</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">ให้คะแนน (0-5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={commentStar}
                  onChange={(e) => setCommentStar(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">รูปภาพ (ถ้ามี)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-sm"
                  multiple
                  onChange={(e) =>
                    setCommentImages(Array.from(e.target.files || []))
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border text-sm"
                  onClick={() => setCommentModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
                >
                  {commentSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="px-5 py-4 border-b font-semibold">
              รายงาน
              {reportTarget?.type === "reply" ? "การตอบกลับ" : "ความคิดเห็น"}
            </div>
            <form onSubmit={submitReport} className="p-5 space-y-3">
              <div>
                <label className="block text-sm mb-1">เหตุผล</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                >
                  <option value="">-- เลือกเหตุผล --</option>
                  <option value="spam">สแปม / โฆษณา</option>
                  <option value="harassment">กลั่นแกล้ง / คุกคาม</option>
                  <option value="hate">เฮทสปีช / ความรุนแรง</option>
                  <option value="nudity">รูป/ข้อความไม่เหมาะสม</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border text-sm"
                  onClick={() => setShowReport(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
                >
                  {reportSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Detall_Event;
