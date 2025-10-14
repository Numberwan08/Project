import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MapPin,
  Upload,
  Phone,
  Navigation,
  FileText,
  Map,
  Plus,
  X,
  Edit,
  ChartArea,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ManagePlaces() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const pageSize = 10;

  // Form data for adding new post
  const [formdata, setFormdata] = useState({
    name_location: "",
    detail_location: "",
    phone: "",
    detail_att: "",
    latitude: "",
    longitude: "",
    id_type: "",
    type: "1",
  });

  // Form data for editing post
  const [editFormdata, setEditFormdata] = useState({
    name_location: "",
    detail_location: "",
    phone: "",
    detail_att: "",
    latitude: "",
    longitude: "",
    id_type: "",
    type: "1",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showEditMap, setShowEditMap] = useState(false);
  const [map, setMap] = useState(null);
  const [editMap, setEditMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [editMarker, setEditMarker] = useState(null);
  const markerRef = useRef(null);
  const editMarkerRef = useRef(null);

  // New state for types and type modal
  const [types, setTypes] = useState([]);

  // โหลดข้อมูลโพสต์ทั้งหมด
  useEffect(() => {
    fetchPosts();
    fetchTypes(); // fetch types on mount
  }, []);

  // Map functionality for add form
  useEffect(() => {
    if (showMap && !map) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      script.onload = () => {
        setTimeout(() => {
          const mapInstance = window.L.map("admin-map").setView(
            [19.9105, 99.8406],
            11
          );

          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          ).addTo(mapInstance);

          mapInstance.on("click", function (e) {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(mapInstance);
            markerRef.current = newMarker;
            setMarker(newMarker);

            setFormdata((prev) => ({
              ...prev,
              latitude: lat.toFixed(6),
              longitude: lng.toFixed(6),
            }));
          });

          setMap(mapInstance);
        }, 100);
      };
      document.head.appendChild(script);
    }
  }, [showMap, map]);

  // Map functionality for edit form
  useEffect(() => {
    if (showEditMap && !editMap) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      script.onload = () => {
        setTimeout(() => {
          const editMapInstance = window.L.map("admin-edit-map").setView(
            [19.9105, 99.8406],
            11
          );

          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          ).addTo(editMapInstance);

          editMapInstance.on("click", function (e) {
            const { lat, lng } = e.latlng;
            if (editMarkerRef.current) {
              editMapInstance.removeLayer(editMarkerRef.current);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(
              editMapInstance
            );
            editMarkerRef.current = newMarker;
            setEditMarker(newMarker);

            setEditFormdata((prev) => ({
              ...prev,
              latitude: lat.toFixed(6),
              longitude: lng.toFixed(6),
            }));
          });

          // If there are existing coordinates, show them on the map
          if (editFormdata.latitude && editFormdata.longitude) {
            const lat = parseFloat(editFormdata.latitude);
            const lng = parseFloat(editFormdata.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              editMapInstance.setView([lat, lng], 15);
              const existingMarker = window.L.marker([lat, lng]).addTo(
                editMapInstance
              );
              editMarkerRef.current = existingMarker;
              setEditMarker(existingMarker);
            }
          }

          setEditMap(editMapInstance);
        }, 100);
      };
      document.head.appendChild(script);
    }
  }, [showEditMap, editMap, editFormdata.latitude, editFormdata.longitude]);

  const fetchPosts = () => {
    axios
      .get(import.meta.env.VITE_API + "post")
      .then((res) => setPosts(res.data.data || []))
      .catch(() => setPosts([]));
  };

  // ฟังก์ชันลบโพสต์
  const handleDelete = async (id_post) => {
    if (window.confirm("ยืนยันการลบโพสต์นี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `post/${id_post}`);
        toast.success("ลบโพสต์สำเร็จ!", {
          position: "top-center",
          autoClose: 2000,
        });
        fetchPosts();
      } catch (err) {
        toast.error("ลบโพสต์ไม่สำเร็จ", {
          position: "top-center",
          autoClose: 2000,
        });
      }
    }
  };

  // ฟังก์ชันเปิด modal แก้ไข
  const handleEdit = async (post) => {
    try {
      // ดึงข้อมูลโพสต์เฉพาะ
      const response = await axios.get(
        import.meta.env.VITE_API + `post/single/${post.id_post}`
      );
      const postData = response.data.data;

      setEditingPost(postData);
      setEditFormdata({
        name_location: postData.name_location || "",
        detail_location: postData.detail_location || "",
        phone: postData.phone || "",
        detail_att: postData.detail_att || "",
        latitude: postData.latitude || "",
        longitude: postData.longitude || "",
        id_type: postData.id_type || "",
        type: postData.type || "1",
      });
      setEditPreview(postData.images);
      setShowEditForm(true);
    } catch (err) {
      toast.error("ไม่สามารถดึงข้อมูลโพสต์ได้", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // Fetch types
  const fetchTypes = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "post/types");
      setTypes(res.data.data || []);
    } catch (err) {
      setTypes([]);
    }
  };

  // Form handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const path = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreview(path);
    }
  };

  // Edit form handlers
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const path = URL.createObjectURL(file);
      setEditSelectedFile(file);
      setEditPreview(path);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name_location", formdata.name_location);
      formDataToSend.append("detail_location", formdata.detail_location);
      formDataToSend.append("phone", formdata.phone);
      formDataToSend.append("detail_att", formdata.detail_att);
      formDataToSend.append("latitude", formdata.latitude);
      formDataToSend.append("longitude", formdata.longitude);
      formDataToSend.append("type", formdata.type);
      formDataToSend.append("id_type", formdata.id_type);
      const userData = localStorage.getItem("userData");
      const userId = userData ? JSON.parse(userData).id_user : 1;
      formDataToSend.append("id_user", userId);

      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const dateString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
        now.getSeconds()
      )}`;
      formDataToSend.append("date", dateString);

      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }

      const res = await axios.post(
        import.meta.env.VITE_API + "post",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("เพิ่มโพสต์สำเร็จ!", {
        position: "top-center",
        autoClose: 2000,
      });

      // Reset form
      setFormdata({
        name_location: "",
        detail_location: "",
        phone: "",
        detail_att: "",
        latitude: "",
        longitude: "",
        id_type: "",
        type: "1",
      });
      setSelectedFile(null);
      setPreview(null);
      setShowAddForm(false);
      setShowMap(false);
      fetchPosts();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("เพิ่มโพสต์ไม่สำเร็จ", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // ฟังก์ชันส่งข้อมูลแก้ไข
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name_location", editFormdata.name_location);
      formDataToSend.append("detail_location", editFormdata.detail_location);
      formDataToSend.append("phone", editFormdata.phone);
      formDataToSend.append("detail_att", editFormdata.detail_att);
      formDataToSend.append("latitude", editFormdata.latitude);
      formDataToSend.append("longitude", editFormdata.longitude);
      formDataToSend.append("id_type", editFormdata.id_type);

      if (editSelectedFile) {
        formDataToSend.append("image", editSelectedFile);
      }

      const res = await axios.patch(
        import.meta.env.VITE_API + `post/${editingPost.id_post}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("แก้ไขโพสต์สำเร็จ!", {
        position: "top-center",
        autoClose: 500,
      });

      // Reset edit form
      resetEditForm();

      // Refresh posts list
      fetchPosts();
    } catch (error) {
      console.error("Error editing post:", error);
      toast.error("แก้ไขโพสต์ไม่สำเร็จ", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const toggleEditMap = () => {
    setShowEditMap(!showEditMap);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormdata((prev) => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));

          if (map) {
            map.setView([lat, lng], 15);
            if (marker) {
              map.removeLayer(marker);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(map);
            setMarker(newMarker);
          }
        },
        (error) => {
          alert("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้");
        }
      );
    }
  };

  const getEditCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setEditFormdata((prev) => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));

          if (editMap) {
            editMap.setView([lat, lng], 15);
            if (editMarker) {
              editMap.removeLayer(editMarker);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(editMap);
            setEditMarker(newMarker);
          }
        },
        (error) => {
          alert("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้");
        }
      );
    }
  };

  const resetForm = () => {
    setFormdata({
      name_location: "",
      detail_location: "",
      phone: "",
      detail_att: "",
      latitude: "",
      longitude: "",
      id_type: "",
      type: "1",
    });
    setSelectedFile(null);
    setPreview(null);
    setShowMap(false);
    setShowAddForm(false);
    if (map && marker) {
      map.removeLayer(marker);
      setMarker(null);
    }
  };

  const resetEditForm = () => {
    setEditFormdata({
      name_location: "",
      detail_location: "",
      phone: "",
      detail_att: "",
      latitude: "",
      longitude: "",
      id_type: "",
      type: "1",
    });
    setEditSelectedFile(null);
    setEditPreview(null);
    setShowEditMap(false);
    setShowEditForm(false);
    setEditingPost(null);
    if (editMap && editMarker) {
      editMap.removeLayer(editMarker);
      setEditMarker(null);
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        if (showAddForm) {
          resetForm();
        }
        if (showEditForm) {
          resetEditForm();
        }
      }
    };

    if (showAddForm || showEditForm) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset"; // Restore scrolling
    };
  }, [showAddForm, showEditForm, map, marker, editMap, editMarker]);

  // filter ตามชื่อสถานที่
  const filteredPosts = posts.filter((item) =>
    item.name_location
      ? item.name_location.toLowerCase().includes(search.toLowerCase())
      : false
  );

  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const paginatedPosts = filteredPosts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center text-center min-h-screen p-4 text-4xl overflow-y-auto">
      <ToastContainer />
      {/* Add Post Form Modal */}
      {showAddForm && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-full max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
            <div className="">
              <div
                className="absolute inset-0 bg-black/30 z-0"
                onClick={resetForm}
              ></div>
              <div
                className="relative z-10 bg-white  shadow-2xl overflow-hidden border border-purple-100 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 px-8 py-6 flex justify-between items-center sticky top-0 z-20">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <MapPin className="h-6 w-6" />
                    เพิ่มสถานที่ท่องเที่ยวใหม่
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Image Upload */}
                      <div className="space-y-4">
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <Upload className="h-5 w-5 text-purple-600" />
                          รูปภาพสถานที่
                        </label>
                        <div className="relative">
                          {preview ? (
                            <div className="relative group">
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-2xl border-4 border-purple-200 shadow-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium">
                                  คลิกเพื่อเปลี่ยนรูป
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-64 border-4 border-dashed border-purple-300 rounded-2xl flex items-center justify-center bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                              <div className="text-center">
                                <Upload className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                                <p className="text-purple-600 font-medium">
                                  อัปโหลดรูปภาพ
                                </p>
                                <p className="text-purple-500 text-sm mt-1">
                                  คลิกเพื่อเลือกไฟล์
                                </p>
                              </div>
                            </div>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageChange}
                            accept="image/*"
                            name="image"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <ChartArea className="h-5 w-5 text-purple-600" />
                          ประเภทสถานที่
                        </label>

                        <div className="flex gap-2">
                          <select
                            value={formdata.id_type || ""}
                            onChange={(e) =>
                              setFormdata({
                                ...formdata,
                                id_type: e.target.value,
                              })
                            }
                            className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                          >
                            <option value="">เลือกประเภท</option>
                            {types.map((t) => (
                              <option key={t.id_type} value={t.id_type}>
                                {t.name_type}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* Location Name */}
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          ชื่อสถานที่
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                          placeholder="เช่น วัดร่องขุ่น, ดอยตุง, แม่สายโกลเด้นไตรแองเกิล"
                          value={formdata.name_location}
                          onChange={(e) =>
                            setFormdata({
                              ...formdata,
                              name_location: e.target.value,
                            })
                          }
                          name="name_location"
                          required
                        />
                      </div>

                      {/* Location Detail */}
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <Navigation className="h-5 w-5 text-purple-600" />
                          รายละเอียดที่ตั้ง
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                          placeholder="เช่น ตำบลป่าอ้อดอนชัย อำเภอเมืองเชียงราย"
                          value={formdata.detail_location}
                          onChange={(e) =>
                            setFormdata({
                              ...formdata,
                              detail_location: e.target.value,
                            })
                          }
                          name="detail_location"
                          required
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <Phone className="h-5 w-5 text-purple-600" />
                          เบอร์โทรศัพท์
                        </label>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                          placeholder="08X-XXX-XXXX"
                          value={formdata.phone}
                          onChange={(e) => {
                            const onlyNums = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            ); // กรองให้เหลือเฉพาะตัวเลข
                            setFormdata({ ...formdata, phone: onlyNums });
                          }}
                          name="phone"
                          inputMode="numeric" // แสดงคีย์บอร์ดตัวเลขบนมือถือ
                          maxLength={10} // จำกัดความยาวไม่เกิน 10 หลัก
                        />
                      </div>

                      {/* Detail Description */}
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          รายละเอียดสถานที่
                        </label>
                        <textarea
                          name="detail_att"
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg h-32 resize-none"
                          placeholder="อธิบายเกี่ยวกับสถานที่ท่องเที่ยวนี้ เช่น ความสวยงาม กิจกรรมที่น่าสนใจ เวลาเปิด-ปิด ค่าเข้าชม"
                          value={formdata.detail_att}
                          onChange={(e) =>
                            setFormdata({
                              ...formdata,
                              detail_att: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Map Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Map className="h-5 w-5 text-purple-600" />
                            เลือกตำแหน่งบนแผนที่
                          </label>
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            className="px-4 py-2 bg-purple-500 text-white cursor-pointer rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                          >
                            ตำแหน่งปัจจุบัน
                          </button>
                        </div>

                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                          <button
                            type="button"
                            onClick={toggleMap}
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Map className="h-5 w-5" />
                            {showMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                          </button>

                          {showMap && (
                            <div className="mt-4">
                              <div
                                id="admin-map"
                                className="h-80 rounded-xl border-2 border-purple-200 shadow-inner relative z-0"
                              ></div>
                              <p className="text-sm text-purple-600 mt-2 text-center">
                                คลิกบนแผนที่เพื่อเลือกตำแหน่งที่ต้องการ
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coordinates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-lg font-semibold text-gray-700">
                            ละติจูด (Latitude)
                          </label>
                          <input
                            type="number"
                            step="any"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                            placeholder="XX.XXXXXX"
                            value={formdata.latitude}
                            onChange={(e) =>
                              setFormdata({
                                ...formdata,
                                latitude: e.target.value,
                              })
                            }
                            name="latitude"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-lg font-semibold text-gray-700">
                            ลองจิจูด (Longitude)
                          </label>
                          <input
                            type="number"
                            step="any"
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                            placeholder="XX.XXXXXX"
                            value={formdata.longitude}
                            onChange={(e) =>
                              setFormdata({
                                ...formdata,
                                longitude: e.target.value,
                              })
                            }
                            name="longitude"
                          />
                        </div>
                      </div>

                      {/* Current Coordinates Display */}
                      {formdata.latitude && formdata.longitude && (
                        <div className="bg-gradient-to-r from-purple-100 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <h3 className="font-semibold text-purple-800 mb-2">
                            📍 ตำแหน่งที่เลือก
                          </h3>
                          <div className="text-sm text-purple-700 space-y-1">
                            <p>
                              <span className="font-medium">ละติจูด:</span>{" "}
                              {formdata.latitude}
                            </p>
                            <p>
                              <span className="font-medium">ลองจิจูด:</span>{" "}
                              {formdata.longitude}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 cursor-pointer rounded-lg border text-sm "
                          type="button"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="w-40 bg-gradient-to-r cursor-pointer from-purple-500 to-purple-400 text-white py-4 px-8 rounded-xl text-xl font-bold hover:from-purple-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          เพิ่มสถานที่
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </dialog>
      )}
      {/* Edit Post Form Modal */}
      {showEditForm && editingPost && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-full max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl relative">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 z-0"
              onClick={resetEditForm}
            ></div>

            {/* Modal Content */}
            <div
              className="relative z-10 bg-white  shadow-2xl overflow-hidden border border-purple-100 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form Header */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 px-8 py-6 flex justify-between items-center sticky top-0 z-20">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Edit className="h-6 w-6" />
                  แก้ไขสถานที่ท่องเที่ยว
                </h2>
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditSubmit} className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-purple-600" />
                        รูปภาพสถานที่
                      </label>
                      <div className="relative">
                        {editPreview ? (
                          <div className="relative group">
                            <img
                              src={editPreview}
                              alt="Preview"
                              className="w-full h-64 object-cover rounded-2xl border-4 border-purple-200 shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-medium">
                                คลิกเพื่อเปลี่ยนรูป
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-64 border-4 border-dashed border-purple-300 rounded-2xl flex items-center justify-center bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                            <div className="text-center">
                              <Upload className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                              <p className="text-purple-600 font-medium">
                                อัปโหลดรูปภาพ
                              </p>
                              <p className="text-purple-500 text-sm mt-1">
                                คลิกเพื่อเลือกไฟล์
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleEditImageChange}
                          accept="image/*"
                          name="image"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        ประเภทสถานที่
                      </label>

                      <div className="flex gap-2">
                        <select
                          value={editFormdata.id_type || ""}
                          onChange={(e) =>
                            setEditFormdata({
                              ...editFormdata,
                              id_type: e.target.value,
                            })
                          }
                          className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                        >
                          <option value="">เลือกประเภท</option>
                          {types.map((t) => (
                            <option key={t.id_type} value={t.id_type}>
                              {t.name_type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Location Name */}
                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        ชื่อสถานที่
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                        placeholder="เช่น วัดร่องขุ่น, ดอยตุง, แม่สายโกลเด้นไตรแองเกิล"
                        value={editFormdata.name_location}
                        onChange={(e) =>
                          setEditFormdata({
                            ...editFormdata,
                            name_location: e.target.value,
                          })
                        }
                        name="name_location"
                        required
                      />
                    </div>

                    {/* Location Detail */}
                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-purple-600" />
                        รายละเอียดที่ตั้ง
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                        placeholder="เช่น ตำบลป่าอ้อดอนชัย อำเภอเมืองเชียงราย"
                        value={editFormdata.detail_location}
                        onChange={(e) =>
                          setEditFormdata({
                            ...editFormdata,
                            detail_location: e.target.value,
                          })
                        }
                        name="detail_location"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Phone className="h-5 w-5 text-purple-600" />
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                        placeholder="08X-XXX-XXXX"
                        value={editFormdata.phone}
                        onChange={(e) =>
                          setEditFormdata({
                            ...editFormdata,
                            phone: e.target.value,
                          })
                        }
                        name="phone"
                      />
                    </div>

                    {/* Detail Description */}
                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        รายละเอียดสถานที่
                      </label>
                      <textarea
                        name="detail_att"
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg h-32 resize-none"
                        placeholder="อธิบายเกี่ยวกับสถานที่ท่องเที่ยวนี้ เช่น ความสวยงาม กิจกรรมที่น่าสนใจ เวลาเปิด-ปิด ค่าเข้าชม"
                        value={editFormdata.detail_att}
                        onChange={(e) =>
                          setEditFormdata({
                            ...editFormdata,
                            detail_att: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Map Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                          <Map className="h-5 w-5 text-purple-600" />
                          เลือกตำแหน่งบนแผนที่
                        </label>
                        <button
                          type="button"
                          onClick={getEditCurrentLocation}
                          className="px-4 py-2 bg-purple-500 text-white cursor-pointer rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                        >
                          ตำแหน่งปัจจุบัน
                        </button>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                        <button
                          type="button"
                          onClick={toggleEditMap}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Map className="h-5 w-5" />
                          {showEditMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                        </button>

                        {showEditMap && (
                          <div className="mt-4">
                            <div
                              id="admin-edit-map"
                              className="h-80 rounded-xl border-2 border-purple-200 shadow-inner relative z-0"
                            ></div>
                            <p className="text-sm text-purple-600 mt-2 text-center">
                              คลิกบนแผนที่เพื่อเลือกตำแหน่งที่ต้องการ
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700">
                          ละติจูด (Latitude)
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                          placeholder="XX.XXXXXX"
                          value={editFormdata.latitude}
                          onChange={(e) =>
                            setEditFormdata({
                              ...editFormdata,
                              latitude: e.target.value,
                            })
                          }
                          name="latitude"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700">
                          ลองจิจูด (Longitude)
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                          placeholder="XX.XXXXXX"
                          value={editFormdata.longitude}
                          onChange={(e) =>
                            setEditFormdata({
                              ...editFormdata,
                              longitude: e.target.value,
                            })
                          }
                          name="longitude"
                        />
                      </div>
                    </div>

                    {/* Current Coordinates Display */}
                    {editFormdata.latitude && editFormdata.longitude && (
                      <div className="bg-gradient-to-r from-purple-100 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <h3 className="font-semibold text-purple-800 mb-2">
                          📍 ตำแหน่งที่เลือก
                        </h3>
                        <div className="text-sm text-purple-700 space-y-1">
                          <p>
                            <span className="font-medium">ละติจูด:</span>{" "}
                            {editFormdata.latitude}
                          </p>
                          <p>
                            <span className="font-medium">ลองจิจูด:</span>{" "}
                            {editFormdata.longitude}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={resetEditForm}
                        className="px-4 py-2 cursor-pointer rounded-lg border text-sm "
                        type="button"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="w-50 bg-gradient-to-r cursor-pointer from-purple-500 to-purple-400 text-white py-4 px-8 rounded-xl text-xl font-bold hover:from-purple-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        บันทึกการแก้ไข
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}

      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className=" flex justify-start items-start ">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                จัดการสถานที่ท่องเที่ยว
              </h1>
            </div>
            <div className="flex justify-start items-start mb-5">
              <h2 className="text-sm text-gray-600">
                รายการสถานที่ทั้งหมดของคุณ
              </h2>
            </div>
            <div className=" flex gap-4 ">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-100 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="ค้นหาชื่อกิจกรรม..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary mt-2 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                เพิ่มสถานที่
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <th className="w-[8%] px-4 py-3 text-center font-medium text-sm">
                      ลำดับ
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left font-medium text-sm">
                      โปรไฟล์
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left font-medium text-sm">
                      ประเภท
                    </th>
                    <th className="w-[25%] px-4 py-3 text-left font-medium text-sm">
                      ชื่อสถานที่
                    </th>
                    <th className="w-[20%] px-4 py-3 text-left font-medium text-sm">
                      คอมเมนต์/คะแนน
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left font-medium text-sm">
                      วันที่โพสต์
                    </th>
                    <th className="w-[15%] px-4 py-3 text-center font-medium text-sm">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg
                            className="w-12 h-12 mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <p className="text-sm font-medium">
                            ไม่พบข้อมูลโพสต์
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPosts.map((item, idx) => (
                      <tr
                        key={item.id_post}
                        className="hover:bg-purple-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-center text-gray-700 font-medium text-sm">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <img
                            src={item.images}
                            alt={item.name_location}
                            className="w-16 h-16 object-cover rounded-lg shadow-md border-2 border-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {item.name_type || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {item.name_location}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          <div className="space-y-1">
                            <div>
                              คอมเมนต์:
                              <span className="ml-1 font-semibold">{item.comments || 0}</span>
                              <span className="ml-1 text-gray-500">รายการ</span>
                            </div>
                            <div>
                              คะแนนเฉลี่ย:
                              <span className="ml-1 font-semibold">{Number(item.star || 0).toFixed(1)}</span>
                              <span className="ml-1 text-gray-500">/ 5</span>
                            </div>
                            <div>
                              สินค้า:
                              <span className="ml-1 font-semibold">{item.products || 0}</span>
                              <span className="ml-1 text-gray-500">รายการ</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {item.date
                            ? new Date(item.date).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <a
                              href={`/detall_att/${item.id_post}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              ดูโพสต์
                            </a>
                            <button
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_post)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  แสดงรายการที่ {(page - 1) * pageSize + 1} -{" "}
                  {Math.min(page * pageSize, paginatedPosts.length)} จากทั้งหมด{" "}
                  {paginatedPosts.length} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    ก่อนหน้า
                  </button>
                  <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium shadow-sm text-xs">
                    {page} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages || totalPages === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                  >
                    ถัดไป
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagePlaces;
