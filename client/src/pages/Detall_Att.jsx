import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Heart, ThumbsUp } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useReport } from "../context/ReportContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function Detail_Att() {
  const { id } = useParams();
  const hiddenToastShownRef = useRef(false);
  const { isReportedComment, isReportedReply, refreshMySubmitted } =
    useReport();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [nearbyAtt, setNearbyAtt] = useState([]);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(0);
  const [commentImage, setCommentImage] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const COMMENTS_PER_PAGE = 100;
  const location = useLocation();
  const [highlightCommentId, setHighlightCommentId] = useState(null);
  const [highlightReplyId, setHighlightReplyId] = useState(null);
  const [highlightProductId, setHighlightProductId] = useState(null);
  // highlight target for product cards
  const [expandedReplies, setExpandedReplies] = useState({});
  const [repliesMap, setRepliesMap] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyFiles, setReplyFiles] = useState({});
  const [replyFormOpen, setReplyFormOpen] = useState({});
  const [expandedCommentText, setExpandedCommentText] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editCommentRating, setEditCommentRating] = useState(0);
  const [editCommentImage, setEditCommentImage] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [editReplyFile, setEditReplyFile] = useState(null);
  const [editReplyLoading, setEditReplyLoading] = useState(false);
  const ratingCount = useMemo(() => {
    try {
      return (comments || []).filter((c) => Number(c?.star) > 0).length;
    } catch (_) {
      return 0;
    }
  }, [comments]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

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

  const buildReplyTree = (flat = []) => {
    return (flat || []).filter((r) => r.parent_reply_id == null);
  };

  const ReplyItem = ({ rep }) => {
    const targetName = rep.parent_reply_id
      ? rep.parent_reply_user_name || "ผู้ใช้"
      : rep.target_user_name || "ผู้ใช้";
    return (
      <div
        className={`bg-purple-50 rounded-md p-3 ${
          String(highlightReplyId) === String(rep.id_reply)
            ? "ring-2 ring-red-400"
            : ""
        }`}
      >
        <div className="flex items-start gap-2">
          {rep.reply_user_image ? (
            <img
              src={rep.reply_user_image}
              alt="avatar"
              className="w-6 h-6 rounded-full object-cover mt-0.5"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-200 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="text-sm text-gray-700">
              <span className="font-semibold mr-1">
                {rep.reply_user_name || "ผู้ใช้"}
              </span>
              <span className="text-gray-500 text-xs">
                {timeAgo(rep.reply_date)}
              </span>
              {String(rep.id_user) !== String(userId) &&
                (isReportedReply && isReportedReply(rep.id_reply) ? (
                  <span className="ml-3 text-xs text-gray-400">รายงานแล้ว</span>
                ) : (
                  <button
                    className="ml-3 text-xs text-red-500 hover:text-red-700"
                    onClick={() => handleReportReply(rep)}
                  >
                    รายงาน
                  </button>
                ))}
              {String(rep.id_user) === String(userId) && (
                <span className="float-right flex gap-2">
                  {editingReplyId === rep.id_reply ? (
                    <>
                      <button
                        className="text-gray-600 hover:text-gray-800 text-xs"
                        onClick={() => cancelEditReply()}
                      >
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        onClick={() => openEditReply(rep)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 text-xs"
                        onClick={() => handleDeleteReply(rep)}
                      >
                        ลบ
                      </button>
                    </>
                  )}
                </span>
              )}
            </div>
            <div
              id={`reply-${rep.id_reply}`}
              className="text-sm text-gray-800 mt-1"
            >
              {rep.reply}
            </div>
            {rep.user_image && (
              <img
                src={rep.user_image}
                alt="reply"
                className="mt-2 rounded-md max-h-32"
              />
            )}

            {editingReplyId === rep.id_reply && (
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => handleEditReplySubmit(e, rep)}
              >
                <textarea
                  className="w-full p-2 border rounded"
                  rows={2}
                  value={editReplyText}
                  onChange={(e) => setEditReplyText(e.target.value)}
                />
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setEditReplyFile(e.target.files?.[0] || null)
                    }
                    className="file-input file-input-bordered file-input-sm"
                  />
                </div>
                {editReplyFile && (
                  <img
                    src={URL.createObjectURL(editReplyFile)}
                    alt="ภาพใหม่"
                    className="rounded-md max-h-28 border"
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
                    {editReplyLoading ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const [showProductModal, setShowProductModal] = useState(false);
  const [productData, setProductData] = useState({
    name_product: "",
    detail_product: "",
    phone: "",
    price: "",
    latitude: "",
    longitude: "",
    type: "3",
  });
  const [selectedProductFile, setSelectedProductFile] = useState(null);
  const [productPreview, setProductPreview] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const getDetailAtt = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `post_att/${id}`);
      setData(res.data.data);
      if (userId) {
        const resCheck = await axios.get(
          import.meta.env.VITE_API + `post/likes/check/${id}/${userId}`
        );
        setLiked(!!resCheck.data.liked);
      } else {
        setLiked(false);
      }
    } catch (err) {
      console.log("Error get detail : ", err);
    } finally {
      setLoading(false);
    }
  };

  const getNearbyAtt = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + `nearby/${id}`);
      console.log("Nearby data:", res.data);
      setNearbyAtt(res.data.data || []);
    } catch (err) {
      console.log("Error get nearby : ", err);
    }
  };

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
          import.meta.env.VITE_API + `post/likes/${item.id_post}/${userId}`
        );
        setLiked(false);
      } else {
        await axios.post(
          import.meta.env.VITE_API + `post/likes/${item.id_post}`,
          { userId }
        );
        setLiked(true);
      }
      getDetailAtt();
    } catch (err) {
      console.log("Error like/unlike post : ", err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    setCommentLoading(true);
    setCommentError("");
    try {
      if (!userId) {
        setCommentError("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
        setCommentLoading(false);
        return;
      }
      if (!commentText) {
        setCommentError("กรุณากรอกข้อความ");
        setCommentLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("comment", commentText);
      formData.append("star", commentRating);
      if (commentImage) formData.append("image", commentImage);
      await axios.post(
        `${import.meta.env.VITE_API}post/comment/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setShowCommentModal(false);
      setCommentText("");
      setCommentRating(0);
      setCommentImage(null);
      toast.success("โพสต์ความคิดเห็นสำเร็จ!", {
        position: "top-center",
        autoClose: 100,
        onClose: () => window.location.reload(),
      });
    } catch (err) {
      setCommentError("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReportComment = (item) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนรายงาน", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    if (isReportedComment && isReportedComment(item.id_comment)) {
      toast.info("คุณได้รายงานความคิดเห็นนี้แล้ว", {
        position: "top-center",
        autoClose: 1500,
      });
      return;
    }
    setReportTarget({ type: "comment", id_comment: item.id_comment });
    setReportReason("");
    setReportDetails("");
    setShowReportModal(true);
  };

  const handleReportReply = (rep) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนรายงาน", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    if (isReportedReply && isReportedReply(rep.id_reply)) {
      toast.info("คุณได้รายงานการตอบกลับนี้แล้ว", {
        position: "top-center",
        autoClose: 1500,
      });
      return;
    }
    setReportTarget({
      type: "reply",
      id_reply: rep.id_reply,
      id_comment: rep.id_comment,
    });
    setReportReason("");
    setReportDetails("");
    setShowReportModal(true);
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportTarget || !reportReason) return;
    try {
      setReportSubmitting(true);
      if (reportTarget.type === "comment") {
        await axios.post(`${import.meta.env.VITE_API}report/comment`, {
          id_comment: reportTarget.id_comment,
          id_post: id,
          id_user: userId,
          reason: reportReason,
          details: reportDetails,
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API}report/reply`, {
          id_reply: reportTarget.id_reply,
          id_comment: reportTarget.id_comment,
          id_post: id,
          id_user: userId,
          reason: reportReason,
          details: reportDetails,
        });
      }
      setShowReportModal(false);
      toast.success("ส่งรายงานสำเร็จ", {
        position: "top-center",
        autoClose: 1000,
      });
      if (refreshMySubmitted) refreshMySubmitted();
    } catch (err) {
      const msg = err?.response?.data?.msg;
      if (err?.response?.status === 409) {
        toast.info(msg || "คุณได้รายงานเนื้อหานี้แล้ว", {
          position: "top-center",
          autoClose: 1500,
        });
      } else {
        toast.error(msg || "ไม่สามารถส่งรายงานได้", {
          position: "top-center",
          autoClose: 1500,
        });
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  // Open modals with login guard
  const openCommentModal = () => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    setShowCommentModal(true);
  };

  const openProductModal = () => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    setShowProductModal(true);
  };

  const handleDeleteComment = async (id_comment) => {
    if (!window.confirm("คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?")) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API}delete_comment/${id_comment}`
      );
      console.log(res.data);
      toast.success("ลบความคิดเห็นสำเร็จ!", {
        position: "top-center",
        autoClose: 1000,
      });
      // รีเฟรชคอมเมนต์ใหม่
      setComments(comments.filter((c) => c.id_comment !== id_comment));
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบความคิดเห็น", {
        position: "top-center",
        autoClose: 1500,
      });
    }
  };

  const fetchReplies = async (id_comment) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API}comment/${id_comment}/replies`
      );
      setRepliesMap((prev) => ({ ...prev, [id_comment]: res.data.data || [] }));
    } catch (err) {
      console.log("Error get replies:", err);
      setRepliesMap((prev) => ({ ...prev, [id_comment]: [] }));
    }
  };

  const handleToggleReplies = async (id_comment) => {
    setExpandedReplies((prev) => {
      const next = !prev[id_comment];
      if (next) {
        // fetch latest when opening
        fetchReplies(id_comment);
      }
      return { ...prev, [id_comment]: next };
    });
  };

  const handleAddReply = async (e, id_comment, parent_reply_id = null) => {
    e.preventDefault();
    try {
      if (!userId) {
        toast.error("กรุณาเข้าสู่ระบบก่อนตอบกลับ", {
          position: "top-center",
          autoClose: 1200,
        });
        return;
      }
      const key = parent_reply_id ? `rep_${parent_reply_id}` : id_comment;
      const text = (replyInputs[key] || "").trim();
      if (!text) return;

      const form = new FormData();
      form.append("id_user", userId);
      form.append("reply", text);
      if (parent_reply_id) form.append("parent_reply_id", parent_reply_id);
      if (replyFiles[key]) form.append("image", replyFiles[key]);
      await axios.post(
        `${import.meta.env.VITE_API}comment/${id_comment}/replies`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setReplyInputs((prev) => ({ ...prev, [key]: "" }));
      setReplyFiles((prev) => ({ ...prev, [key]: null }));
      setReplyFormOpen((prev) => ({ ...prev, [key]: false }));
      await fetchReplies(id_comment);
      setExpandedReplies((prev) => ({ ...prev, [id_comment]: true }));
      setComments((prev) =>
        prev.map((c) =>
          c.id_comment === id_comment
            ? { ...c, replies_count: (c.replies_count || 0) + 1 }
            : c
        )
      );
      toast.success("ตอบกลับสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
    } catch (err) {
      console.log("Error add reply:", err);
      toast.error("เกิดข้อผิดพลาดในการตอบกลับ", {
        position: "top-center",
        autoClose: 1200,
      });
    }
  };

  const openEditComment = (item) => {
    setEditingCommentId(item.id_comment);
    setEditCommentText(item.comment || "");
    setEditCommentRating(item.star || 0);
    setEditCommentImage(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
    setEditCommentRating(0);
    setEditCommentImage(null);
  };

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

  const handleEditReplySubmit = async (e, rep) => {
    e.preventDefault();
    if (!userId) return;
    const id_comment = rep.id_comment;
    try {
      setEditReplyLoading(true);
      const form = new FormData();
      form.append("id_user", userId);
      form.append("reply", editReplyText);
      if (editReplyFile) form.append("image", editReplyFile);

      await axios.patch(
        `${import.meta.env.VITE_API}comment/${id_comment}/replies/${
          rep.id_reply
        }`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      await fetchReplies(id_comment);
      toast.success("แก้ไขการตอบกลับสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
      cancelEditReply();
    } catch (err) {
      console.log("Error edit reply:", err);
      toast.error("ไม่สามารถแก้ไขการตอบกลับได้", {
        position: "top-center",
        autoClose: 1200,
      });
    } finally {
      setEditReplyLoading(false);
    }
  };

  const handleDeleteReply = async (rep) => {
    try {
      if (!window.confirm("คุณต้องการลบการตอบกลับนี้ใช่หรือไม่?")) return;
      const id_comment = rep.id_comment;
      await axios.delete(
        `${import.meta.env.VITE_API}comment/${id_comment}/replies/${
          rep.id_reply
        }`,
        { data: { id_user: userId } }
      );
      await fetchReplies(id_comment);
      setComments((prev) =>
        prev.map((c) =>
          c.id_comment === id_comment
            ? { ...c, replies_count: Math.max(0, (c.replies_count || 0) - 1) }
            : c
        )
      );
      toast.success("ลบการตอบกลับสำเร็จ", {
        position: "top-center",
        autoClose: 800,
      });
    } catch (err) {
      console.log("Error delete reply:", err);
      toast.error("ไม่สามารถลบการตอบกลับได้", {
        position: "top-center",
        autoClose: 1200,
      });
    }
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
      if (editCommentImage) form.append("image", editCommentImage);
      const res = await axios.patch(
        `${import.meta.env.VITE_API}post/comment/${id_comment}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updated = res.data?.data;
      setComments((prev) =>
        prev.map((c) =>
          c.id_comment === id_comment
            ? {
                ...c,
                comment: updated?.comment ?? editCommentText,
                star: updated?.star ?? editCommentRating,
                images: updated?.images ?? c.images,
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
      console.log("Error edit comment:", err);
      toast.error("ไม่สามารถแก้ไขความคิดเห็นได้", {
        position: "top-center",
        autoClose: 1200,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const path = URL.createObjectURL(file);
      setSelectedProductFile(file);
      setProductPreview(path);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setProductLoading(true);
    setProductError("");

    try {
      if (!userId) {
        setProductError("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า");
        setProductLoading(false);
        return;
      }

      if (
        !productData.name_product ||
        !productData.detail_product ||
        !productData.phone ||
        !productData.price
      ) {
        setProductError("กรุณากรอกข้อมูลให้ครบถ้วน");
        setProductLoading(false);
        return;
      }

      if (!selectedProductFile) {
        setProductError("กรุณาเลือกรูปภาพสินค้า");
        setProductLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("id_user", userId);
      formData.append("id_post", id);
      formData.append("name_product", productData.name_product);
      formData.append("detail_product", productData.detail_product);
      formData.append("phone", productData.phone);
      formData.append("price", productData.price);
      formData.append("type", productData.type);
      formData.append("image", selectedProductFile);

      await axios.post(`${import.meta.env.VITE_API}product`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowProductModal(false);
      setProductData({
        name_product: "",
        detail_product: "",
        phone: "",
        price: "",
        type: "3",
      });
      setSelectedProductFile(null);
      setProductPreview(null);

      toast.success("เพิ่มสินค้าสำเร็จ!", {
        position: "top-center",
        autoClose: 500,
        onClose: () => window.location.reload(),
      });

      // Refresh related products
      fetchRelatedProducts();
    } catch (err) {
      setProductError("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
      console.error("Error adding product:", err);
    } finally {
      setProductLoading(false);
    }
  };

  const handleDeleteProduct = async (id_product) => {
    if (!window.confirm("คุณต้องการลบสินค้านี้ใช่หรือไม่?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API}product/${id_product}`);
      toast.success("ลบสินค้าสำเร็จ!", {
        position: "top-center",
        autoClose: 1000,
      });
      // รีเฟรชสินค้า
      fetchRelatedProducts();
      fetchAllProducts();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบสินค้า", {
        position: "top-center",
        autoClose: 1500,
      });
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API}random_products_by_post/${id}`
      );
      setRelatedProducts(res.data.data || []);
    } catch (err) {
      console.log("Error fetching related products:", err);
      setRelatedProducts([]);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API}products_by_post/${id}`
      );
      setAllProducts(res.data.data || []);
      setShowAllProducts(true);
    } catch (err) {
      console.log("Error fetching all products:", err);
      setAllProducts([]);
    }
  };

  useEffect(() => {
    getDetailAtt();
    getNearbyAtt();
    const sp = new URLSearchParams(location.search);
    const hC = sp.get("highlightComment");
    const hR = sp.get("highlightReply");
    const hP = sp.get("highlightProduct");
    const suppressHiddenToast = sp.get("suppressHiddenToast") === "1";
    setHighlightCommentId(hC ? String(hC) : null);
    setHighlightReplyId(hR ? String(hR) : null);
    setHighlightProductId(hP ? String(hP) : null);
    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API}post/comment_id/${id}`
        );
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(b.date_comment) - new Date(a.date_comment)
        );
        setComments(sorted);
        setCommentPage(1);
        // If user navigated with highlight param but the comment isn't visible (likely hidden)
        // check status; show toast once unless suppressed via query
        if (hC && !suppressHiddenToast && !hiddenToastShownRef.current) {
          const exists = sorted.some(
            (c) => String(c.id_comment) === String(hC)
          );
          if (!exists) {
            try {
              const st = await axios.get(
                `${import.meta.env.VITE_API}post/comment_status/${hC}`
              );
              const s = st?.data?.data?.status;
              if (String(s) === "0" && !hiddenToastShownRef.current) {
                hiddenToastShownRef.current = true;
                toast.info("คอมเมนต์นี้ถูกซ่อนแล้ว", {
                  position: "top-center",
                  autoClose: 2000,
                });
              }
            } catch (e) {
              // ignore if cannot check (possibly deleted)
            }
          }
        }
        if (hC) {
          setExpandedReplies((prev) => ({ ...prev, [hC]: true }));
          if (hR) {
            await fetchReplies(hC);
          }
          setTimeout(() => {
            const el = document.getElementById(
              hR ? `reply-${hR}` : `comment-${hC}`
            );
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      } catch (err) {
        setComments([]);
      }
    };
    fetchComments();
    fetchRelatedProducts();
  }, [id]);

  // Try to scroll to highlighted product; if not visible, load all products
  useEffect(() => {
    const hP = String(highlightProductId || "");
    if (!hP) return;
    const el = document.getElementById(`product-${hP}`);
    if (el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
      const t = setTimeout(() => setHighlightProductId(null), 2500);
      return () => clearTimeout(t);
    }
    if (!showAllProducts && (relatedProducts || []).length > 0) {
      // Product not in random list; load all
      fetchAllProducts();
    }
  }, [relatedProducts, allProducts, highlightProductId, showAllProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      {data.map((item, index) => (
        <div key={index} className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={item.images}
                  alt={item.name_location}
                  className="w-full h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedImage(item.images)}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold text-gray-800 flex-1 pr-4">
                    {item.name_location}
                  </h1>

                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                      <h4 className="text-sm font-semibold text-yellow-800 whitespace-nowrap">
                        คะแนน{" "}
                        {item.star > 0
                          ? `${item.star} (${ratingCount} คน)`
                          : "ไม่มีคะแนน"}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <ThumbsUp
                        color={liked ? "#22c55e" : "#ef4444"}
                        onClick={() => handlelike(item)}
                        className={`cursor-pointer transition-transform ${
                          liked ? "scale-110" : ""
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {item.likes}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-gray-600 text-sm mb-4 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
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
                  {item.detail_location}
                </div>

                {/* Description */}
                <div className="text-gray-700 leading-relaxed">
                  <p>{item.detail_att}</p>
                </div>
                <h3 className="font-semibold text-purple-800 mb-2">
                  ข้อมูลติดต่อ
                </h3>
                <div className="flex items-start gap-8 bg-purple-50 p-4 rounded-2xl shadow-md">
                  {/* เบอร์โทรศัพท์ */}
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-1">
                      เบอร์โทรศัพท์
                    </h3>
                    <p className="text-purple-700">{item.phone}</p>
                  </div>

                  {/* ผู้โพสต์ */}
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-1">
                      ผู้โพสต์
                    </h3>
                    <p className="text-purple-700">
                      {String(item.id_user) === String(userId) ? (
                        <span className="text-green-600 font-semibold">
                          ของฉัน
                        </span>
                      ) : (
                        item.first_name
                      )}
                    </p>
                  </div>

                  {/* วันที่โพสต์ */}
                  <div>
                    <h3 className="font-semibold text-purple-800 mb-1">
                      วันที่โพสต์
                    </h3>
                    <p className="text-purple-700">
                      {item.date &&
                        new Date(item.date).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </p>
                  </div>
                </div>
              </div>
              {/* Related Products Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    สินค้าที่เกี่ยวข้องของชุมชน
                  </h2>

                  <button
                    className="w-50 cursor-pointer bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    onClick={openProductModal}
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>เพิ่มสินค้า</span>
                  </button>
                  {relatedProducts.length > 0 && (
                    <button
                      onClick={fetchAllProducts}
                      className="text-purple-600 hover:text-purple-800 cursor-pointer font-medium text-sm transition-colors"
                    >
                      สินค้าทั้งหมด
                    </button>
                  )}
                </div>

                {!showAllProducts ? (
                  // Show random 3 products
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedProducts.length > 0 ? (
                      relatedProducts.map((product, idx) => (
                        <div
                          key={idx}
                          id={`product-${product.id_product}`}
                          className={`bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow ${
                            String(highlightProductId) ===
                            String(product.id_product)
                              ? "ring-4 ring-yellow-400 animate-pulse"
                              : ""
                          }`}
                        >
                          <div className="relative mb-3">
                            <img
                              src={product.images}
                              alt={product.name_product}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                            {product.name_product}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {product.detail_product}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-purple-600">
                              ฿{product.price}
                            </span>
                            <span className="text-xs">
                              โดย:{" "}
                              {String(product.id_user) === String(userId) ? (
                                <span className="text-green-600 font-semibold">
                                  ของฉัน
                                </span>
                              ) : (
                                <span className="text-gray-500">
                                  {product.first_name}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <a
                              href={`tel:${product.phone}`}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              📞 {product.phone}
                            </a>
                            {/* ปุ่มลบสินค้า เฉพาะเจ้าของ */}
                            {userId === String(product.id_user) && (
                              <button
                                className="text-red-500 cursor-pointer hover:text-red-700 text-xs ml-2"
                                onClick={() =>
                                  handleDeleteProduct(product.id_product)
                                }
                              >
                                ลบสินค้า
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500">
                          ยังไม่มีสินค้าที่เกี่ยวข้อง
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          เพิ่มสินค้าแรกของคุณเลย!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show all products
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg  font-semibold text-gray-700">
                        สินค้าทั้งหมด ({allProducts.length} รายการ)
                      </h3>
                      <button
                        onClick={() => setShowAllProducts(false)}
                        className="text-gray-600 hover:text-gray-800 font-medium text-sm cursor-pointer transition-colors"
                      >
                        ปิด
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {allProducts.length > 0 ? (
                        allProducts.map((product, idx) => (
                          <div
                            key={idx}
                            id={`product-${product.id_product}`}
                            className={`m-5 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow ${
                              String(highlightProductId) ===
                              String(product.id_product)
                                ? "ring-4 ring-yellow-400 animate-pulse"
                                : ""
                            }`}
                          >
                            <div className="relative mb-3">
                              <img
                                src={product.images}
                                alt={product.name_product}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                              {product.name_product}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {product.detail_product}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-purple-600">
                                ฿{product.price}
                              </span>
                              <span className="text-xs">
                                โดย:{" "}
                                {String(product.id_user) === String(userId) ? (
                                  <span className="text-green-600 font-semibold">
                                    ของฉัน
                                  </span>
                                ) : (
                                  <span className="text-gray-500">
                                    {product.first_name}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                              <a
                                href={`tel:${product.phone}`}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                📞 {product.phone}
                              </a>
                              {/* ปุ่มลบสินค้า เฉพาะเจ้าของ */}
                              {userId === String(product.id_user) && (
                                <button
                                  className="text-red-500 hover:text-red-700 text-xs ml-2"
                                  onClick={() =>
                                    handleDeleteProduct(product.id_product)
                                  }
                                >
                                  ลบสินค้า
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-gray-500">
                            ยังไม่มีสินค้าที่เกี่ยวข้อง
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Recommendation Badge */}
              <div className="bg-gradient-to-r bg-gray-100 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <h3 className="font-bold text-xl  mb-4 ">ความคิดเห็น</h3>
                  <button
                    className="w-50 cursor-pointer   bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors mb-3"
                    onClick={openCommentModal}
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
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments
                      .slice(
                        (commentPage - 1) * COMMENTS_PER_PAGE,
                        commentPage * COMMENTS_PER_PAGE
                      )
                      .map((item, idx) => (
                        <div
                          id={`comment-${item.id_comment}`}
                          key={idx}
                          className={`bg-white bg-opacity-80 rounded-lg p-4 text-left text-gray-800 shadow ${
                            String(highlightCommentId) ===
                            String(item.id_comment)
                              ? "ring-2 ring-red-400"
                              : ""
                          }`}
                        >
                          {/* ปุ่มลบคอมเมนต์ เฉพาะเจ้าของ */}
                          {userId === String(item.id_user) && (
                            <div className="ml-auto flex gap-3 mb-2">
                              <button
                                className="text-blue-600 cursor-pointer hover:text-blue-800"
                                onClick={() => openEditComment(item)}
                              >
                                แก้ไข
                              </button>
                              <button
                                className="text-red-500 cursor-pointer hover:text-red-700"
                                onClick={() =>
                                  handleDeleteComment(item.id_comment)
                                }
                              >
                                ลบ
                              </button>
                            </div>
                          )}
                          <div className="flex items-start gap-3 mb-2">
                            {item.user_image ? (
                              <img
                                src={item.user_image}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-200" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {item.first_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {timeAgo(item.date_comment)}
                                </span>
                                {String(item.id_user) !== String(userId) &&
                                  (isReportedComment &&
                                  isReportedComment(item.id_comment) ? (
                                    <span className="ml-2 text-xs text-gray-400">
                                      รายงานแล้ว
                                    </span>
                                  ) : (
                                    <button
                                      className="ml-2 text-xs text-red-500 hover:text-red-700"
                                      onClick={() => handleReportComment(item)}
                                    >
                                      รายงาน
                                    </button>
                                  ))}
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
                                    {item.star}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 text-gray-800">
                                {expandedCommentText[item.id_comment]
                                  ? item.comment
                                  : (item.comment || "").slice(0, 180)}
                                {item.comment && item.comment.length > 180 && (
                                  <button
                                    className="ml-2 text-purple-700 hover:text-purple-900 text-sm cursor-pointer"
                                    onClick={() =>
                                      setExpandedCommentText((prev) => ({
                                        ...prev,
                                        [item.id_comment]:
                                          !prev[item.id_comment],
                                      }))
                                    }
                                  >
                                    {expandedCommentText[item.id_comment]
                                      ? "ย่อข้อความ"
                                      : "ดูเพิ่มเติม"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.images && (
                            <img
                              src={item.images}
                              alt="comment"
                              className="mt-2 rounded-lg max-h-32"
                            />
                          )}
                          {/* Edit form (inline) */}
                          {editingCommentId === item.id_comment && (
                            <form
                              className="mt-3 space-y-3"
                              onSubmit={(e) =>
                                handleEditCommentSubmit(e, item.id_comment)
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
                              {/* <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  {[1,2,3,4,5].map((num)=>(
                                    <label key={num} className="flex items-center gap-1 text-sm">
                                      <input
                                        type="radio"
                                        name={`edit_star_${item.id_comment}`}
                                        checked={editCommentRating === num}
                                        onChange={()=>setEditCommentRating(num)}
                                      />
                                      {num}
                                    </label>
                                  ))}
                                </div>
                              </div> */}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setEditCommentImage(
                                    e.target.files?.[0] || null
                                  )
                                }
                                className="file-input file-input-bordered file-input-sm"
                              />
                              {editCommentImage && (
                                <img
                                  src={URL.createObjectURL(editCommentImage)}
                                  alt="ภาพใหม่"
                                  className="mt-2 rounded-lg max-h-32 border"
                                />
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
                          {/* Reply actions */}
                          <div className="mt-3">
                            <button
                              className="text-sm text-purple-700 hover:text-purple-900 font-medium cursor-pointer"
                              onClick={() =>
                                handleToggleReplies(item.id_comment)
                              }
                            >
                              {expandedReplies[item.id_comment]
                                ? "ซ่อนการตอบกลับ"
                                : `ดูการตอบกลับ (${item.replies_count || 0})`}
                            </button>
                          </div>

                          {/* Replies list */}
                          {expandedReplies[item.id_comment] && (
                            <div className="mt-3 pl-4 border-l-2 border-purple-200 space-y-3">
                              {buildReplyTree(
                                repliesMap[item.id_comment] || []
                              ).map((rep) => (
                                <ReplyItem
                                  key={rep.id_reply}
                                  rep={rep}
                                  id_comment={item.id_comment}
                                  depth={1}
                                />
                              ))}

                              {/* Add reply input */}
                              <form
                                className="flex items-center gap-2"
                                onSubmit={(e) =>
                                  handleAddReply(e, item.id_comment)
                                }
                              >
                                <input
                                  type="text"
                                  className="input input-sm input-bordered flex-1"
                                  placeholder={`ตอบกลับ ${
                                    item.first_name || ""
                                  }...`}
                                  value={replyInputs[item.id_comment] || ""}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({
                                      ...prev,
                                      [item.id_comment]: e.target.value,
                                    }))
                                  }
                                />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="file-input file-input-bordered file-input-sm"
                                  onChange={(e) =>
                                    setReplyFiles((prev) => ({
                                      ...prev,
                                      [item.id_comment]:
                                        e.target.files?.[0] || null,
                                    }))
                                  }
                                />
                                <button
                                  type="submit"
                                  className="btn btn-sm btn-primary cursor-pointer"
                                >
                                  ตอบกลับ
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      ))}
                    {/* Pagination */}
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
                      <span className="px-2 ">
                        หน้า {commentPage} /{" "}
                        {Math.ceil(comments.length / COMMENTS_PER_PAGE)}
                      </span>
                      <button
                        className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                        onClick={() =>
                          setCommentPage((p) =>
                            Math.min(
                              Math.ceil(comments.length / COMMENTS_PER_PAGE),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          commentPage ===
                          Math.ceil(comments.length / COMMENTS_PER_PAGE)
                        }
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-100 text-sm">ยังไม่มีความคิดเห็น</p>
                )}
              </div>
            </div>

            {/* ฝั่งขวา - Sidebar */}
            <div className="space-y-6">
              {/* Map Section */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-purple-100 px-4 py-3 border-b">
                  <h3 className="font-semibold text-purple-800">
                    ตำแหน่งสถานที่
                  </h3>
                </div>

                <div className="p-4">
                  {/* Map */}
                  <div className="h-64 rounded-lg overflow-hidden border">
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
                            <div className="text-center">
                              <h3 className="font-semibold">
                                {item.name_location}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {item.detail_location}
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
                        <span>ไม่มีข้อมูลตำแหน่ง</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {/* <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-4">
                  การดำเนินการ
                </h3>
                <div className="space-y-3">
                </div>
              </div> */}
              {/* Related Places Section */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  สถานที่ใกล้เคียง
                </h2>

                {nearbyAtt.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {nearbyAtt.map((place) => {
                      const desc =
                        place.detail_att || place.detail_location || "";
                      const max = 90;
                      const short =
                        desc.length > max ? desc.slice(0, max) + "…" : desc;

                      return (
                        <Link
                          key={place.id_post}
                          to={`/detall_att/${place.id_post}`}
                          className="group flex items-start gap-4 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white"
                        >
                          {/* รูปด้านซ้าย */}
                          <div className="relative flex-shrink-0 w-36 h-24 bg-gray-100 overflow-hidden rounded-lg">
                            <img
                              src={place.images}
                              alt={place.name_location}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Badge ระยะทาง */}
                            <div className="absolute bottom-1 right-1">
                              <span className="bg-white/90 text-gray-700 text-[11px] px-2 py-0.5 rounded-full shadow">
                                {place.distance.toFixed(1)} กม.
                              </span>
                            </div>
                          </div>

                          {/* ข้อมูลด้านขวา */}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {place.name_location}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {short || "—"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">ไม่พบสถานที่ใกล้เคียง</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
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
      {showCommentModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg relative ">
            {/* Close Button */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick={() => setShowCommentModal(false)}
            >
              ✕
            </button>

            {/* Header */}
            <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
              แสดงความคิดเห็น
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmitComment} className="space-y-6">
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
                      checked={commentRating === num}
                      onChange={() => setCommentRating(num)}
                    />
                  ))}
                </div>
                <label className="label">
                  <span className="label-text-alt">
                    คะแนน: {commentRating}/5
                  </span>
                </label>
              </div>

              {/* Image Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    เพิ่มรูปภาพ (ถ้ามี)
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCommentImage(e.target.files[0])}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
                {commentImage && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(commentImage)}
                      alt="ภาพตัวอย่าง"
                      className="rounded-lg max-h-48 border"
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {commentError && (
                <div className="alert alert-error">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{commentError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCommentModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${
                    commentLoading ? "loading" : ""
                  }`}
                  disabled={commentLoading}
                >
                  {commentLoading ? (
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl relative">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick={() => setShowReportModal(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
              รายงาน
              {reportTarget?.type === "reply" ? "การตอบกลับ" : "ความคิดเห็น"}
            </h2>

            <form onSubmit={submitReport} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    สาเหตุการรายงาน
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    เลือกสาเหตุ
                  </option>
                  <option value="spam">สแปม / โฆษณา</option>
                  <option value="harassment">กลั่นแกล้ง / คุกคาม</option>
                  <option value="hate">เฮทสปีช / ความรุนแรง</option>
                  <option value="nudity">รูป/ข้อความไม่เหมาะสม</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    รายละเอียดเพิ่มเติม (ถ้ามี)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-28"
                  placeholder="อธิบายเพิ่มเติมว่าเกิดอะไรขึ้น..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowReportModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`btn btn-error ${
                    reportSubmitting ? "loading" : ""
                  }`}
                  disabled={reportSubmitting || !reportReason}
                >
                  {reportSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl relative">
            {/* Close Button */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick={() => setShowProductModal(false)}
            >
              ✕
            </button>

            {/* Header */}
            <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
              🛍️ เพิ่มสินค้า
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        รูปภาพสินค้า
                      </span>
                    </label>
                    <div className="relative">
                      {productPreview ? (
                        <img
                          src={productPreview}
                          alt="preview"
                          className="w-full h-32 object-cover rounded-lg border-2 border-primary"
                        />
                      ) : (
                        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">เลือกรูปภาพ</span>
                        </div>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleProductImageChange}
                        accept="image/*"
                      />
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">ชื่อสินค้า</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered input-primary"
                      value={productData.name_product}
                      onChange={(e) =>
                        setProductData({
                          ...productData,
                          name_product: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        เบอร์โทรศัพท์
                      </span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered input-primary"
                      value={productData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, ""); // ลบทุกอย่างที่ไม่ใช่ตัวเลข
                        setProductData({
                          ...productData,
                          phone: value,
                        });
                      }}
                      maxLength={10} // จำกัดไม่เกิน 10 ตัว
                      inputMode="numeric" // บอก browser ให้แสดงแป้นตัวเลขบนมือถือ
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Product Description */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        รายละเอียดสินค้า
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered textarea-primary h-24 resize-none"
                      value={productData.detail_product}
                      onChange={(e) =>
                        setProductData({
                          ...productData,
                          detail_product: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">ราคา (บาท)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-primary"
                      value={productData.price}
                      onChange={(e) =>
                        setProductData({
                          ...productData,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {productError && (
                <div className="alert alert-error">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{productError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowProductModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${
                    productLoading ? "loading" : ""
                  }`}
                  disabled={productLoading}
                >
                  {productLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังเพิ่ม...
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      เพิ่มสินค้า
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default Detail_Att;
