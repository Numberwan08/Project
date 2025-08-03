import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Upload,
  Phone,
  Navigation,
  FileText,
  Map,
  Clock,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

function Menu_Event() {
  const [formdata, setFormdata] = useState({
    name_event: "",
    location_event: "",
    phone: "",
    detail_event: "",
    date_start: "",
    date_end: "",
    latitude: "",
    longitude: "",
    type: "2",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);
  const markerRef = useRef(null); // ใช้ useRef เก็บ marker

  // Initialize map when showMap becomes true
  useEffect(() => {
    if (showMap && !map) {
      // Load Leaflet CSS and JS
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
          // Initialize map centered on Chiang Rai
          const mapInstance = window.L.map("map").setView(
            [19.9105, 99.8406],
            11
          );

          window.L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              attribution: "© OpenStreetMap contributors",
            }
          ).addTo(mapInstance);

          // Add click event to map
          mapInstance.on("click", function (e) {
            const { lat, lng } = e.latlng;

            // Remove existing marker
            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
            }

            // Add new marker
            const newMarker = window.L.marker([lat, lng]).addTo(mapInstance);
            markerRef.current = newMarker;

            // Update form data
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
      formDataToSend.append("id_user", localStorage.getItem("userId")); // สมมติว่า userId อยู่ใน localStorage
      formDataToSend.append("name_event", formdata.name_event);
      formDataToSend.append("location_event", formdata.location_event);
      formDataToSend.append("phone", formdata.phone);
      formDataToSend.append("detail_event", formdata.detail_event);
      formDataToSend.append("date_start", formdata.date_start);
      formDataToSend.append("date_end", formdata.date_end);
      formDataToSend.append("longitude", formdata.longitude);
      formDataToSend.append("latitude", formdata.latitude);
      formDataToSend.append("type", formdata.type);
      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }

      // เรียก API จริง
      const res = await axios.post(
        import.meta.env.VITE_API + "event",
        formDataToSend,
        {
          headers: {
            "content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("โพสต์สำเร็จ", {
        position: "top-center",
        autoClose: 1000,
        onClose: () => window.location.reload(),
      });
    } catch (error) {
      console.error("Error submit form", error);
      toast.error("เกิดข้อผิดพลาดในการโพสต์กิจกรรม");
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
          setFormdata((prev) => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));

          if (map) {
            map.setView([lat, lng], 15);
            if (markerRef.current) {
              map.removeLayer(markerRef.current);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(map);
            markerRef.current = newMarker;
          }
        },
        (error) => {
          alert("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้");
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 py-8 px-4">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-800 via-purple-600 to-fuchsia-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              เพิ่มกิจกรรม จังหวัดเชียงราย
            </h1>
            <p className="text-purple-50 mt-2">
              กรอกข้อมูลกิจกรรมและเหตุการณ์ในจังหวัดเชียงราย
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
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
                        <div className="absolute inset-0 bg-purple-600 bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-medium">
                            คลิกเพื่อเปลี่ยนรูป
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 border-4 border-dashed border-fuchsia-400 rounded-2xl flex items-center justify-center bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors cursor-pointer">
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

                {/* Event Name */}
                <div className="space-y-2">
                  <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    ชื่อกิจกรรม
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                    placeholder="เช่น เทศกาลดอกไม้เชียงราย, งานวัฒนธรรมไทยใหญ่"
                    value={formdata.name_event}
                    onChange={(e) =>
                      setFormdata({ ...formdata, name_event: e.target.value })
                    }
                    name="name_event"
                  />
                </div>

                {/* Event Location */}
                <div className="space-y-2">
                  <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-purple-600" />
                    สถานที่จัดงาน
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                    placeholder="เช่น สวนสาธารณะ, วัดหรือศาลา, ลานใหญ่"
                    value={formdata.location_event}
                    onChange={(e) =>
                      setFormdata({
                        ...formdata,
                        location_event: e.target.value,
                      })
                    }
                    name="location_event"
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
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg tabular-nums"
                    placeholder="08X-XXX-XXXX"
                    value={formdata.phone}
                    onChange={(e) =>
                      setFormdata({ ...formdata, phone: e.target.value })
                    }
                    name="phone"
                  />
                </div>

                {/* Event Detail */}
                <div className="space-y-2">
                  <label className="block text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    รายละเอียดกิจกรรม
                  </label>
                  <textarea
                    name="detail_event"
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg h-32 resize-none"
                    placeholder="อธิบายเกี่ยวกับกิจกรรมนี้ เช่น กิจกรรมต่างๆ ค่าใช้จ่าย การเตรียมตัว สิ่งที่ควรทราบ"
                    value={formdata.detail_event}
                    onChange={(e) =>
                      setFormdata({ ...formdata, detail_event: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Date and Time Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    วันและเวลาจัดกิจกรรม
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="block font-medium text-gray-600">
                        🕐 วันที่เริ่มกิจกรรม
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                        value={formdata.date_start}
                        onChange={(e) =>
                          setFormdata({
                            ...formdata,
                            date_start: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-medium text-gray-600">
                        🕕 วันที่จบกิจกรรม
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg"
                        value={formdata.date_end}
                        onChange={(e) =>
                          setFormdata({ ...formdata, date_end: e.target.value })
                        }
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
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
                    >
                      ตำแหน่งปัจจุบัน
                    </button>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <button
                      type="button"
                      onClick={toggleMap}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-teal-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Map className="h-5 w-5" />
                      {showMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                    </button>

                    {showMap && (
                      <div className="mt-4">
                        <div
                          id="map"
                          className="h-80 rounded-xl border-2 border-purple-200 shadow-inner"
                        ></div>
                        <p className="text-sm text-purple-600 mt-2 text-center">
                          🗺️ คลิกบนแผนที่เพื่อเลือกตำแหน่งที่ต้องการ
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
                      placeholder="19.910500"
                      value={formdata.latitude}
                      onChange={(e) =>
                        setFormdata({ ...formdata, latitude: e.target.value })
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
                      placeholder="99.840600"
                      value={formdata.longitude}
                      onChange={(e) =>
                        setFormdata({ ...formdata, longitude: e.target.value })
                      }
                      name="longitude"
                    />
                  </div>
                </div>

                {/* Current Coordinates Display */}
                {formdata.latitude && formdata.longitude && (
                  <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-4 rounded-xl border border-purple-200">
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

                {/* Event Duration Display */}
                {formdata.date_start && formdata.date_end && (
                  <div className="bg-gradient-to-r from-cyan-100 to-teal-100 p-4 rounded-xl border border-cyan-200">
                    <h3 className="font-semibold text-cyan-800 mb-2">
                      ⏰ ระยะเวลากิจกรรม
                    </h3>
                    <div className="text-sm text-cyan-700 space-y-1">
                      <p>
                        <span className="font-medium">เริ่ม:</span>{" "}
                        {new Date(formdata.date_start).toLocaleString("th-TH")}
                      </p>
                      <p>
                        <span className="font-medium">จบ:</span>{" "}
                        {new Date(formdata.date_end).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-500 text-white py-4 px-8 rounded-xl text-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    โพสต์กิจกรรม
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

export default Menu_Event;
