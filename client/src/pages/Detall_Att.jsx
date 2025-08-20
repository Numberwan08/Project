import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

  const getDetailAtt = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `post_att/${id}`);
      // console.log(res.data);
      setData(res.data.data);
    } catch (err) {
      console.log("Error get detail : ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetailAtt();
  }, []);

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
                  <h1 className="text-3xl font-bold text-gray-800">
                    {item.name_location}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 transition-colors">
                      <span className="font-medium"></span>
                    </button>
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
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    ข้อมูลติดต่อ
                  </h3>
                  <p className="text-purple-700">เบอร์โทรศัพท์: {item.phone}</p>
                  <h3 className="font-semibold text-purple-800 mt-2 mb-2">
                    ผู้โพสต์
                  </h3>
                  <p className="text-purple-700">โดย {item.first_name}</p>
                  <h3 className="font-semibold text-purple-800 mt-2 mb-2">
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

              {/* Related Places Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  สถานที่ใกล้เคียง
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Placeholder for related places */}
                  {[1, 2, 3].map((placeholder) => (
                    <div
                      key={placeholder}
                      className="relative group cursor-pointer"
                    >
                      <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">รูปภาพ</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg">
                        <p className="text-white text-sm font-medium">
                          สถานที่แนะนำ {placeholder}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
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
                    <span>เพิ่มรูปภาพ</span>
                  </button>

                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
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
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <span>เพิ่มการรีวิว</span>
                  </button>
                </div>
              </div>

              {/* Recommendation Badge */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold">สถานที่แนะนำ</span>
                </div>
                <p className="text-purple-100 text-sm">
                  สถานที่ยอดนิยมที่ควรไปเยือน
                </p>
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
    </div>
  );
}

export default Detail_Att;
