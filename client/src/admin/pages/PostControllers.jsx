import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { MapPin, Upload, Phone, Navigation, FileText, Map, Plus, X } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function PostControllers() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const pageSize = 10;

  // Form data for adding new post
  const [formdata, setFormdata] = useState({
    name_location: "",
    detail_location: "",
    phone: "",
    detail_att: "",
    latitude: "",
    longitude: "",
    type: "1",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const markerRef = useRef(null);

  // โหลดข้อมูลโพสต์ทั้งหมด
  useEffect(() => {
    fetchPosts();
  }, []);

  // Map functionality
  useEffect(() => {
    if (showMap && !map) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = () => {
        setTimeout(() => {
          const mapInstance = window.L.map('admin-map').setView([19.9105, 99.8406], 11);
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstance);

          mapInstance.on('click', function(e) {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(mapInstance);
            markerRef.current = newMarker;
            setMarker(newMarker);
            
            setFormdata(prev => ({
              ...prev,
              latitude: lat.toFixed(6),
              longitude: lng.toFixed(6)
            }));
          });

          setMap(mapInstance);
        }, 100);
      };
      document.head.appendChild(script);
    }
  }, [showMap, map]);

  const fetchPosts = () => {
    axios.get(import.meta.env.VITE_API + "post")
      .then(res => setPosts(res.data.data || []))
      .catch(() => setPosts([]));
  };

  // ฟังก์ชันลบโพสต์
  const handleDelete = async (id_post) => {
    if (window.confirm("ยืนยันการลบโพสต์นี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `post/${id_post}`);
        fetchPosts();
      } catch (err) {
        alert("ลบโพสต์ไม่สำเร็จ");
      }
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
      // Get user ID from localStorage or context
      const userData = localStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id_user : 1;
      formDataToSend.append("id_user", userId);
      
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const dateString = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
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
        type: "1",
      });
      setSelectedFile(null);
      setPreview(null);
      setShowAddForm(false);
      setShowMap(false);
      
      // Refresh posts list
      fetchPosts();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("เพิ่มโพสต์ไม่สำเร็จ", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormdata(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
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

  const resetForm = () => {
    setFormdata({
      name_location: "",
      detail_location: "",
      phone: "",
      detail_att: "",
      latitude: "",
      longitude: "",
      type: "1",
    });
    setSelectedFile(null);
    setPreview(null);
    setShowMap(false);
    setShowAddForm(false);
  };

  // filter ตามชื่อสถานที่
  const filteredPosts = posts.filter(item =>
    item.name_location
      ? item.name_location.toLowerCase().includes(search.toLowerCase())
      : false
  );

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const paginatedPosts = filteredPosts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center text-center min-h-screen p-4 text-4xl overflow-y-auto">
      <ToastContainer />
      จัดการโพสต์
      
      <div className="mt-5 flex gap-4 items-center">
        <input
          type="text"
          className="input input-bordered w-96 text-base"
          placeholder="ค้นหาชื่อสถานที่"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1); // reset page when search
          }}
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          เพิ่มโพสต์
        </button>
      </div>

      {/* Add Post Form */}
      {showAddForm && (
        <div className="w-full max-w-6xl mt-8 mb-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MapPin className="h-6 w-6" />
                เพิ่มสถานที่ท่องเที่ยวใหม่
              </h2>
              <button
                onClick={resetForm}
                className="btn btn-ghost text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-5 w-5" />
              </button>
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
                            <span className="text-white font-medium">คลิกเพื่อเปลี่ยนรูป</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 border-4 border-dashed border-purple-300 rounded-2xl flex items-center justify-center bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                          <div className="text-center">
                            <Upload className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                            <p className="text-purple-600 font-medium">อัปโหลดรูปภาพ</p>
                            <p className="text-purple-500 text-sm mt-1">คลิกเพื่อเลือกไฟล์</p>
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
                      onChange={(e) => setFormdata({ ...formdata, name_location: e.target.value })}
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
                      onChange={(e) => setFormdata({ ...formdata, detail_location: e.target.value })}
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
                      onChange={(e) => setFormdata({ ...formdata, phone: e.target.value })}
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
                      value={formdata.detail_att}
                      onChange={(e) => setFormdata({ ...formdata, detail_att: e.target.value })}
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
                        {showMap ? 'ซ่อนแผนที่' : 'แสดงแผนที่'}
                      </button>
                      
                      {showMap && (
                        <div className="mt-4">
                          <div 
                            id="admin-map" 
                            className="h-80 rounded-xl border-2 border-purple-200 shadow-inner"
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
                        onChange={(e) => setFormdata({ ...formdata, latitude: e.target.value })}
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
                        onChange={(e) => setFormdata({ ...formdata, longitude: e.target.value })}
                        name="longitude"
                      />
                    </div>
                  </div>

                  {/* Current Coordinates Display */}
                  {(formdata.latitude && formdata.longitude) && (
                    <div className="bg-gradient-to-r from-purple-100 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <h3 className="font-semibold text-purple-800 mb-2">📍 ตำแหน่งที่เลือก</h3>
                      <div className="text-sm text-purple-700 space-y-1">
                        <p><span className="font-medium">ละติจูด:</span> {formdata.latitude}</p>
                        <p><span className="font-medium">ลองจิจูด:</span> {formdata.longitude}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white py-4 px-8 rounded-xl text-xl font-bold hover:from-purple-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      เพิ่มสถานที่
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="p-4 mt-3 overflow-x-auto w-full">
        <table className="min-w-[1200px] w-full text-sm text-left text-gray-700 border border-gray-300">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="w-[8%] border text-center">ลำดับ</th>
              <th className="w-[15%] px-4 py-2 border">โปรไฟล์</th>
              <th className="w-[30%] px-4 py-2 border">ชื่อสถานที่</th>
              <th className="w-[20%] px-4 py-2 border">รายละเอียด</th>
              <th className="w-[12%] px-4 py-2 border">วันที่โพสต์</th>
              <th className="w-[15%] px-4 py-2 border">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPosts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400 text-lg">
                  ไม่พบข้อมูลโพสต์
                </td>
              </tr>
            )}
            {paginatedPosts.map((item, idx) => (
              <tr className="hover:bg-gray-100" key={item.id_post}>
                <td className="text-center border">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-2 border">
                  <img
                    src={item.images}
                    alt={item.name_location}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-2 border">{item.name_location}</td>
                <td className="px-4 py-2 border">{item.detail_location}</td>
                <td className="px-4 py-2 border">
                  {item.date ? new Date(item.date).toLocaleDateString("th-TH") : "-"}
                </td>
                <td className="px-4 py-2 border">
                  <button
                    className="btn btn-error btn-sm mr-2"
                    onClick={() => handleDelete(item.id_post)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mt-4 text-base">
          <button
            className="btn btn-sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {totalPages || 1}
          </span>
          <button
            className="btn btn-sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostControllers