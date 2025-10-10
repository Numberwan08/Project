import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Upload,
  Navigation,
  Phone,
  FileText,
  Map,
  Clock,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function Show_Event() {
  const [selectedPost, setSelectedPost] = useState({});
  const [postData, setPostData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [editImage, setEditImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [editMap, setEditMap] = useState(null);
  const editMarkerRef = useRef(null);
  const id_user = localStorage.getItem("userId");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const getPostMe = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API + `event/${id_user}`
      );
      setPostData(res.data.data);
    } catch (err) {
      console.log("error get post me", err);
    }
  };

  useEffect(() => {
    getPostMe();
  }, []);

  // Reset/clamp page when data changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((postData?.length || 0) / ITEMS_PER_PAGE));
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [postData]);

  const handleViewDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await axios.delete(
        import.meta.env.VITE_API + `event/${selectedPost.id_event}`
      );
      toast.success(res.data.msg, {
        autoClose: 1000,
      });
      getPostMe();
      setIsDelete(false);
      setSelectedPost({});
    } catch (err) {
      console.log("error delete post", err);
      toast.error("ไม่สามารถลบโพสต์ได้");
    }
  };

  const handleClose = () => {
    setSelectedPost({});
    setIsDelete(false);
    setIsEdit(false);
    setEditData({});
    setEditImage(null);
    setPreview(null);
    // cleanup map if any
    if (editMap) {
      editMap.remove();
      setEditMap(null);
      editMarkerRef.current = null;
      setShowMap(false);
    }
  };

  const handleEdit = (item) => {
    setEditData({
      ...item,
      name_event: item.name_event || "",
      location_event: item.location_event || "",
      phone: item.phone || "",
      detail_event: item.detail_event || "",
      date_start: item.date_start.slice(0,16) ,
      date_end: item.date_end.slice(0,16),
      latitude: item.latitude || "",
      longitude: item.longitude || "",
      type: item.type || "",
    });
    setEditImage(null);
    setPreview(item.images || null);
    setIsEdit(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name_event", editData.name_event);
    formData.append("location_event", editData.location_event);
    formData.append("phone", editData.phone);
    formData.append("detail_event", editData.detail_event);
    formData.append("date_start", editData.date_start);
    formData.append("date_end", editData.date_end);
    formData.append("latitude", editData.latitude);
    formData.append("longitude", editData.longitude);
    formData.append("type", editData.type);
    if (editImage) {
      formData.append("image", editImage);
    }
    try {
      await axios.patch(
        import.meta.env.VITE_API + `event/${editData.id_event}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("แก้ไขข้อมูลสำเร็จ", { autoClose: 1000 });
      setIsEdit(false);
      setEditData({});
      setEditImage(null);
      setPreview(null);
      getPostMe();
      // cleanup map
      if (editMap) {
        editMap.remove();
        setEditMap(null);
        editMarkerRef.current = null;
        setShowMap(false);
      }
    } catch (err) {
      toast.error("ไม่สามารถแก้ไขข้อมูลได้");
    }
  };

  // Toggle map display in edit modal
  const toggleMap = () => {
    setShowMap((s) => !s);
  };

  // Get current location and set marker/inputs
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setEditData((prev) => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));

          if (editMap) {
            editMap.setView([lat, lng], 15);
            if (editMarkerRef.current) {
              editMap.removeLayer(editMarkerRef.current);
            }
            editMarkerRef.current = L.marker([lat, lng]).addTo(editMap);
          } else {
            // if map not initialized, show & let effect init it
            setShowMap(true);
          }
        },
        () => {
          toast.error("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้");
        }
      );
    } else {
      toast.error("Geolocation ไม่รองรับในเบราว์เซอร์นี้");
    }
  };

  // initialize Leaflet map when showMap toggled on
  useEffect(() => {
    if (showMap && !editMap && typeof window !== "undefined") {
      // create map
      const lat = editData.latitude ? Number(editData.latitude) : 19.9105;
      const lng = editData.longitude ? Number(editData.longitude) : 99.8406;
      const zoom = editData.latitude && editData.longitude ? 15 : 11;
      const mapInstance = L.map("edit-map", {
        attributionControl: false,
      }).setView([lat, lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        mapInstance
      );

      if (editData.latitude && editData.longitude) {
        editMarkerRef.current = L.marker([
          Number(editData.latitude),
          Number(editData.longitude),
        ]).addTo(mapInstance);
      }

      mapInstance.on("click", function (e) {
        const { lat: clickedLat, lng: clickedLng } = e.latlng;
        if (editMarkerRef.current) {
          mapInstance.removeLayer(editMarkerRef.current);
        }
        editMarkerRef.current = L.marker([clickedLat, clickedLng]).addTo(
          mapInstance
        );
        setEditData((prev) => ({
          ...prev,
          latitude: clickedLat.toFixed(6),
          longitude: clickedLng.toFixed(6),
        }));
      });

      setEditMap(mapInstance);
    }
    // cleanup when hiding map
    if (!showMap && editMap) {
      editMap.remove();
      setEditMap(null);
      editMarkerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  // sync marker when lat/lng changed manually
  useEffect(() => {
    if (editMap && editData.latitude && editData.longitude) {
      const lat = Number(editData.latitude);
      const lng = Number(editData.longitude);
      editMap.setView([lat, lng], 15);
      if (editMarkerRef.current) {
        editMap.removeLayer(editMarkerRef.current);
      }
      editMarkerRef.current = L.marker([lat, lng]).addTo(editMap);
    }
  }, [editData.latitude, editData.longitude, editMap]);

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer position="top-right" />

      {/* Modal ลบ */}
      {isDelete && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-xl mb-2">ยืนยันการลบ</h3>
            <p className="py-4 text-gray-600">
              คุณต้องการลบกิจกรรม "{selectedPost?.name_event}" ใช่หรือไม่?
            </p>
            <div className="modal-action">
              <button
                className="btn btn-error text-white"
                onClick={handleDelete}
              >
                ลบ
              </button>
              <button className="btn btn-ghost" onClick={handleClose}>
                ยกเลิก
              </button>
            </div>
          </div>
        </dialog>
      )}

      {isEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-6 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Calendar className="h-7 w-7" />
                แก้ไขกิจกรรม
              </h3>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <form
              onSubmit={handleEditSubmit}
              className="overflow-y-auto p-8 space-y-8 flex-1"
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Upload className="h-5 w-5 text-purple-600" />
                      รูปภาพกิจกรรม
                    </label>
                    <div className="relative">
                      {preview ? (
                        <div className="relative group">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-64 object-cover rounded-2xl border-4 border-purple-200 shadow-lg"
                          />
                          <div className="absolute inset-0 bg-purple-600 bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <span className="text-white font-medium">
                              คลิกเพื่อเปลี่ยนรูป
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 border-4 border-dashed border-fuchsia-400 rounded-2xl flex flex-col items-center justify-center bg-fuchsia-50 hover:bg-fuchsia-100 cursor-pointer transition">
                          <Upload className="h-12 w-12 text-purple-400 mb-3" />
                          <p className="text-purple-600 font-medium">
                            อัปโหลดรูปภาพ
                          </p>
                          <p className="text-purple-500 text-sm mt-1">
                            คลิกเพื่อเลือกไฟล์
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleEditImageChange}
                        accept="image/*"
                        name="image"
                      />
                    </div>
                  </div>

                  {/* Event Name */}
                  <div className="space-y-2">
                    <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      ชื่อกิจกรรม
                    </label>
                    <input
                      type="text"
                      name="name_event"
                      value={editData.name_event}
                      onChange={handleEditChange}
                      placeholder="เช่น เทศกาลดอกไม้เชียงราย"
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-purple-600" />
                      สถานที่จัดงาน
                    </label>
                    <input
                      type="text"
                      name="location_event"
                      value={editData.location_event}
                      onChange={handleEditChange}
                      placeholder="เช่น สวนสาธารณะ"
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-purple-600" />
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editData.phone}
                      onChange={handleEditChange}
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                    />
                  </div>

                  {/* Detail */}
                  <div className="space-y-2">
                    <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      รายละเอียดกิจกรรม
                    </label>
                    <textarea
                      name="detail_event"
                      value={editData.detail_event}
                      onChange={handleEditChange}
                      placeholder="อธิบายกิจกรรม"
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none h-32 resize-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Date & Time */}
                  <div className="space-y-4">
                    {/* <pre>{JSON.stringify(editData,null,2)}</pre> */}
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      วันและเวลาจัดกิจกรรม
                    </h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="block font-medium text-gray-600">
                           เริ่ม
                        </label>
                        <input
                          type="datetime-local"
                          name="date_start"
                          value={editData.date_start}
                          onChange={handleEditChange}
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-medium text-gray-600">
                           สิ้นสุด
                        </label>
                        <input
                          type="datetime-local"
                          name="date_end"
                          value={editData.date_end}
                          onChange={handleEditChange}
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>

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
                        className="px-4 py-2 bg-purple-500 cursor-pointer text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition"
                      >
                        ตำแหน่งปัจจุบัน
                      </button>
                    </div>

                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <button
                        type="button"
                        onClick={toggleMap}
                        className="w-full bg-gradient-to-r cursor-pointer from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-fuchsia-600 transition transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Map className="h-5 w-5" />
                        {showMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                      </button>

                      {showMap && (
                        <div className="mt-4">
                          <div
                            id="edit-map"
                            className="h-80 rounded-xl border-2 border-purple-200 shadow-inner"
                          />
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
                        ละติจูด
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={editData.latitude}
                        onChange={handleEditChange}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-lg font-semibold text-gray-700">
                        ลองจิจูด
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={editData.longitude}
                        onChange={handleEditChange}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-lg outline-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r cursor-pointer from-green-500 to-emerald-600 text-white py-4 rounded-xl text-xl font-bold hover:from-green-600 hover:to-emerald-700 transition transform hover:scale-105 shadow-lg"
                    >
                       บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full bg-gradient-to-r cursor-pointer from-gray-400 to-gray-500 text-white py-4 rounded-xl text-xl font-bold hover:from-gray-500 hover:to-gray-600 transition transform hover:scale-105 shadow-lg"
                    >
                       ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ดูรายละเอียด */}
      {isModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-2xl mb-6 text-primary">
              รายละเอียดกิจกรรม
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      ชื่อกิจกรรม
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={selectedPost.name_event || ""}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">สถานที่</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={selectedPost.location_event || ""}
                    readOnly
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">เบอร์โทร</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={selectedPost.phone || ""}
                  readOnly
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    รายละเอียดกิจกรรม
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24 bg-base-200"
                  value={selectedPost.detail_event || ""}
                  readOnly
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      วันที่เริ่ม
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={
                      selectedPost.date_start
                        ? new Date(selectedPost.date_start).toLocaleDateString(
                            "th-TH"
                          )
                        : ""
                    }
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      วันที่สิ้นสุด
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={
                      selectedPost.date_end
                        ? new Date(selectedPost.date_end).toLocaleDateString(
                            "th-TH"
                          )
                        : ""
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">พิกัด</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={
                    selectedPost.latitude && selectedPost.longitude
                      ? `ละติจูด ${selectedPost.latitude}, ลองจิจูด ${selectedPost.longitude}`
                      : ""
                  }
                  readOnly
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">ประเภท</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={selectedPost.type || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">รูปภาพ</span>
                </label>
                <div className="flex justify-center">
                  <img
                    src={selectedPost.images}
                    alt="รูปภาพกิจกรรม"
                    className="w-full max-w-md h-64 object-cover border-2 rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPost({});
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </dialog>
      )}

      <div className="bg-base-100 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-primary">กิจกรรมของฉัน</h2>
          <div className="badge badge-primary badge-lg">
            {postData.length} กิจกรรม
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="text-center">#</th>
                <th>ชื่อกิจกรรม</th>
                <th>สถานที่</th>
                <th className="text-center">รูป</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {postData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    ไม่มีข้อมูลกิจกรรม
                  </td>
                </tr>
              ) : (
                // slice for pagination
                postData
                  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                  .map((item, index) => (
                  <tr key={index} className="hover">
                    <td className="text-center font-semibold">{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="font-medium">{item.name_event}</td>
                    <td className="text-gray-600">{item.location_event}</td>
                    <td className="text-center">
                      <div className="flex justify-center">
                        <img
                          src={item.images}
                          alt={item.name_event}
                          className="w-24 h-16 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-3 justify-center">
                        <button
                          className="btn btn-sm btn-info btn-circle"
                          onClick={() => handleViewDetail(item)}
                          title="ดูรายละเอียด"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="btn btn-sm btn-warning btn-circle"
                          onClick={() => handleEdit(item)}
                          title="แก้ไข"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="btn btn-sm btn-error btn-circle"
                          onClick={() => {
                            setIsDelete(true);
                            setSelectedPost(item);
                          }}
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        {postData.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              className="px-3 py-1 rounded cursor-pointer bg-base-200 hover:bg-base-300 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ก่อนหน้า
            </button>
            <span className="px-2">
              หน้า {page} / {Math.max(1, Math.ceil(postData.length / ITEMS_PER_PAGE))}
            </span>
            <button
              className="px-3  py-1 rounded cursor-pointer bg-primary text-white disabled:opacity-50"
              onClick={() =>
                setPage((p) =>
                  Math.min(Math.ceil(postData.length / ITEMS_PER_PAGE) || 1, p + 1)
                )
              }
              disabled={page === Math.ceil(postData.length / ITEMS_PER_PAGE) || postData.length === 0}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Show_Event;
