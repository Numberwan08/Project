import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Upload, Phone, Navigation, FileText, Map } from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Menu_Att() {
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
          const mapInstance = window.L.map('map').setView([19.9105, 99.8406], 11);
          
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
      formDataToSend.append("id_user", localStorage.getItem("userId"));
      formDataToSend.append("name_location", formdata.name_location);
      formDataToSend.append("detail_location", formdata.detail_location);
      formDataToSend.append("phone", formdata.phone);
      formDataToSend.append("detail_att", formdata.detail_att);
      formDataToSend.append("latitude", formdata.latitude);
      formDataToSend.append("longitude", formdata.longitude);
      formDataToSend.append("type", formdata.type);
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

      toast.success("โพสต์สำเร็จแล้ว! กรุณารีหน้าเพื่อโพสต์ใหม่", {
        position: "top-center",
        autoClose: 1000,
        onClose: () => window.location.reload(),
      });
    } catch (error) {
      console.error("Error submitting form:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-cyan-50 py-8 px-4">
      <ToastContainer/>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MapPin className="h-8 w-8" />
              เพิ่มสถานที่ท่องเที่ยว จังหวัดเชียงราย
            </h1>
            <p className="text-purple-100 mt-2">กรอกข้อมูลสถานที่ท่องเที่ยวในจังหวัดเชียงราย</p>
          </div>

          <div className="p-8">
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
                      {showMap ? 'ซ่อนแผนที่' : 'แสดงแผนที่'}
                    </button>
                    
                    {showMap && (
                      <div className="mt-4">
                        <div 
                          id="map" 
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
                  <div className="bg-gradient-to-r from-purple-100 to-teal-100 p-4 rounded-xl border border-purple-200">
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
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white py-4 px-8 rounded-xl text-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    ยืนยันข้อมูล
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

export default Menu_Att;