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

  // Product Modal States
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

  // Related Products States
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
      } catch (err) {
        setComments([]);
      }
    };
    fetchComments();
    fetchRelatedProducts();
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
                        คะแนน {item.star > 0 ? item.star : "ไม่มีคะแนน"}
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
                          className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                            className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
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
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-4">
                  การดำเนินการ
                </h3>
                <div className="space-y-3">
                  <button
                    className="w-full cursor-pointer   bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors mb-3"
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

                  <button
                    className="w-full cursor-pointer bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    onClick={() => setShowProductModal(true)}
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
                              className="text-red-500 cursor-pointer hover:text-red-700 float-right mb-2"
                              onClick={() =>
                                handleDeleteComment(item.id_comment)
                              }
                            >
                              ลบ
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
                            <div className="flex items-center space-x-1 ml-4">
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
              💬 แสดงความคิดเห็น
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
