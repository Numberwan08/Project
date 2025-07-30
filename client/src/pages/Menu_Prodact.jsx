// Menu_Prodact.jsx
import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import {
  MapPin,
  Upload,
  Phone,
  Map as MapIcon,
  DollarSign,
  FileText,
  Navigation,
} from "lucide-react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

function Menu_Prodact() {
  const [formdata, setFormData] = useState({
    id_user: "",
    name_product: "",
    detail_product: "",
    phone: "",
    price: "",
    latitude: "",
    longitude: "",
    type: "3",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (showMap && !map) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      script.onload = () => {
        setTimeout(() => {
          const mapInstance = window.L.map("map").setView([19.9105, 99.8406], 11);
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapInstance);

          mapInstance.on("click", function (e) {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
              mapInstance.removeLayer(markerRef.current);
            }
            const newMarker = window.L.marker([lat, lng]).addTo(mapInstance);
            markerRef.current = newMarker;
            setMarker(newMarker);
            setFormData((prev) => ({
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
      formDataToSend.append("id_user", localStorage.getItem("userId"));
      formDataToSend.append("name_product", formdata.name_product);
      formDataToSend.append("detail_product", formdata.detail_product);
      formDataToSend.append("phone", formdata.phone);
      formDataToSend.append("latitude", formdata.latitude);
      formDataToSend.append("longitude", formdata.longitude);
      formDataToSend.append("price", formdata.price);
      formDataToSend.append("type", formdata.type);
      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }

      await axios.post(import.meta.env.VITE_API + "product", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("โพสต์สินค้าสำเร็จแล้ว!", {
        position: "top-center",
        autoClose: 1000,
        onClose: () => window.location.reload(),
      });
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <ToastContainer />
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
        <h1 className="text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-2">
          <MapPin className="h-7 w-7 text-emerald-600" />
          เพิ่มสินค้าในจังหวัดเชียงราย
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left */}
          <div className="space-y-6">
            {/* Image */}
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-64 object-cover rounded-xl border-2 border-emerald-200"
                />
              ) : (
                <div className="w-full h-64 border-4 border-dashed border-emerald-300 rounded-xl flex items-center justify-center">
                  <Upload className="h-12 w-12 text-emerald-400" />
                </div>
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">ชื่อสินค้า</label>
              <input
                type="text"
                className="w-full border border-emerald-300 rounded-xl p-3 focus:outline-none focus:ring focus:ring-emerald-200"
                value={formdata.name_product}
                onChange={(e) => setFormData({ ...formdata, name_product: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">รายละเอียดสินค้า</label>
              <textarea
                className="w-full border border-emerald-300 rounded-xl p-3 focus:outline-none focus:ring focus:ring-emerald-200"
                value={formdata.detail_product}
                onChange={(e) => setFormData({ ...formdata, detail_product: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                className="w-full border border-emerald-300 rounded-xl p-3 focus:outline-none focus:ring focus:ring-emerald-200"
                value={formdata.phone}
                onChange={(e) => setFormData({ ...formdata, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium mb-1">ราคา</label>
              <input
                type="number"
                className="w-full border border-emerald-300 rounded-xl p-3 focus:outline-none focus:ring focus:ring-emerald-200"
                value={formdata.price}
                onChange={(e) => setFormData({ ...formdata, price: e.target.value })}
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="block font-medium text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-emerald-600" /> ตำแหน่งบนแผนที่
              </label>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600"
              >
                {showMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
              </button>
            </div>

            {showMap && (
              <div className="mt-2">
                <div id="map" className="h-72 w-full rounded-xl border-2 border-emerald-200"></div>
                <p className="text-sm text-center text-emerald-600 mt-1">คลิกบนแผนที่เพื่อเลือกตำแหน่งสินค้า</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">ละติจูด</label>
                <input
                  type="number"
                  value={formdata.latitude}
                  onChange={(e) => setFormData({ ...formdata, latitude: e.target.value })}
                  className="w-full border border-emerald-300 rounded-xl p-3 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">ลองจิจูด</label>
                <input
                  type="number"
                  value={formdata.longitude}
                  onChange={(e) => setFormData({ ...formdata, longitude: e.target.value })}
                  className="w-full border border-emerald-300 rounded-xl p-3 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all"
            >
              ยืนยันการโพสต์สินค้า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Menu_Prodact;
