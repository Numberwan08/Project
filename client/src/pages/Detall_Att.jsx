import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Heart, ThumbsUp } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const COMMENTS_PER_PAGE = 3;

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

  useEffect(() => {
    getDetailAtt();
    getNearbyAtt();
    // ดึงคอมเมนต์
    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API}post/comment_id/${id}`
        );
        // เรียงจาก date_comment ล่าสุดขึ้นก่อน
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(b.date_comment) - new Date(a.date_comment)
        );
        setComments(sorted);
        setCommentPage(1); // reset page เมื่อ id เปลี่ยน
      } catch (err) {
        setComments([]);
      }
    };
    fetchComments();
  }, [id]);

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
            {/* ฝั่งซ้าย - เนื้อหาหลัก */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Image */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={item.images}
                  alt={item.name_location}
                  className="w-full h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setSelectedImage(item.images)}
                />
              </div>

              {/* Title and Like Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  {/* Left side - Location name */}
                  <h1 className="text-3xl font-bold text-gray-800 flex-1 pr-4">
                    {item.name_location}
                  </h1>

                  {/* Right side - Rating and Like button */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    {/* Rating */}
                    <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                      <h4 className="text-sm font-semibold text-yellow-800 whitespace-nowrap">
                        คะแนน {item.star && item.star !== 0 ? item.star : 'ไม่มีคะแนน'}
                      </h4>
                    </div>

                    {/* Like button */}
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
                    <p className="text-purple-700">{item.first_name}</p>
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

              {/* Related Places Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  สถานที่ใกล้เคียง
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nearbyAtt.length > 0 ? (
                    nearbyAtt.map((place, idx) => (
                      <Link to={`/detall_att/${place.id_post}`} key={idx}>
                        <div className="relative group cursor-pointer">
                          <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
                            <img
                              src={"http://localhost:3000/" + place.images}
                              alt={place.name_location}
                              className="h-28 object-cover rounded-lg"
                              style={{ maxWidth: "100%" }}
                            />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg">
                            <p className="text-white text-sm font-medium">
                              {place.name_location}
                            </p>
                            <p className="text-purple-100 text-xs">
                              {place.detail_location}
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

            {/* ฝั่งขวา - Sidebar */}
            <div className="space-y-6">
              {/* Map Section */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-purple-100 px-4 py-3 border-b">
                  <h3 className="font-semibold text-purple-800">
                    แผนที่และตำแหน่ง
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
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-4">
                  การดำเนินการ
                </h3>
                <div className="space-y-3">
                  <button
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    onClick={() => setShowCommentModal(true)}
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
              </div>

              {/* Recommendation Badge */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
                <h3 className="font-bold text-xl mb-4 text-white">
                  ความคิดเห็น
                </h3>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments
                      .slice(
                        (commentPage - 1) * COMMENTS_PER_PAGE,
                        commentPage * COMMENTS_PER_PAGE
                      )
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white bg-opacity-80 rounded-lg p-4 text-left text-gray-800 shadow"
                        >
                          {/* ปุ่มลบคอมเมนต์ เฉพาะเจ้าของ */}
                          {userId === String(item.id_user) && (
                            <button
                              className="text-red-500 hover:text-red-700 float-right mb-2"
                              onClick={() =>
                                handleDeleteComment(item.id_comment)
                              }
                            >
                              ลบความคิดเห็น
                            </button>
                          )}
                          <div className="flex items-center mb-2">
                            <span className="font-semibold mr-2">
                              {item.first_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.date_comment &&
                                new Date(item.date_comment).toLocaleDateString(
                                  "th-TH",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="ml-2 text-gray-600">
                              {item.comment}
                            </span>
                          </div>
                          {item.images && (
                            <img
                              src={item.images}
                              alt="comment"
                              className="mt-2 rounded-lg max-h-32"
                            />
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
                      <span className="px-2 text-white">
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
    <div className="modal-box max-w-lg relative">
      {/* Close Button */}
      <button
        className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
        onClick={() => setShowCommentModal(false)}
      >
        ✕
      </button>

      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
        💬 แสดงความคิดเห็น
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmitComment} className="space-y-6">
        {/* Comment Text Area */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">ความคิดเห็นของคุณ</span>
          </label>
          <textarea
            className="textarea textarea-bordered textarea-primary h-24 resize-none focus:textarea-primary"
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
            <span className="label-text-alt">คะแนน: {commentRating}/5</span>
          </label>
        </div>

        {/* Image Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">เพิ่มรูปภาพ (ถ้ามี)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCommentImage(e.target.files[0])}
            className="file-input file-input-bordered file-input-primary w-full"
          />
        </div>

        {/* Error Message */}
        {commentError && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            className={`btn btn-primary ${commentLoading ? 'loading' : ''}`}
            disabled={commentLoading}
          >
            {commentLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                กำลังส่ง...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
      <ToastContainer />
    </div>
  );
}

export default Detail_Att;
