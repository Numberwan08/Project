import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Detall_Prodact() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [nearbyProduct , setNearbyProduct] = useState([]);

  const getDetailProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `get_product/${id}`);
      console.log(res.data.data[0]);
      setData(res.data.data);
    } catch (err) {
      console.log("error get data", err);
    } finally {
      setLoading(false);
    }
  };

  const getNearbyProduct = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const res = await axios.get(import.meta.env.VITE_API + `nearby_product/${id}`);
        console.log("Nearby data:", res.data);
        setNearbyProduct(res.data.data || []);
        
      } catch (err) {
        console.log("Error get nearby : ", err); 
      }
    };

  useEffect(() => {
    getDetailProduct();
    getNearbyProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-600 text-lg font-medium">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50">
      {data.map((item, index) => (
        <div key={index} className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* ฝั่งซ้าย - รูปภาพและข้อมูลสินค้า */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Image */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative">
                  <img 
                    src={item.images} 
                    alt={item.name_product}
                    className="w-full h-80 lg:h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setSelectedImage(item.images)}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-full shadow-lg">
                      สินค้าท้องถิ่น
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    คลิกเพื่อดูขนาดใหญ่
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                    {item.name_product}
                  </h1>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-purple-600">
                      ฿{parseFloat(item.price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Product Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    รายละเอียดสินค้า
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {item.detail_product}
                  </p>
                </div>

                {/* Seller Info */}
                <div className="bg-purple-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ข้อมูลผู้ขาย
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-purple-700 font-medium">ชื่อผู้ขาย:</p>
                      <p className="text-purple-800 font-semibold">{item.first_name}</p>
                    </div>
                    <div>
                      <p className="text-purple-700 font-medium">เบอร์โทรศัพท์:</p>
                      <p className="text-purple-800 font-semibold">{item.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products */}
              <h2 className="text-2xl font-bold text-gray-800 mb-6">สินค้าใกล้เคียง</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nearbyProduct.length > 0 ? (
                    nearbyProduct.map((place, idx) => (
                    <Link to={`/detall_product/${place.id_product}`}>
                     <div key={idx} className="relative group cursor-pointer">
                        <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
                          <img
                            src={'http://localhost:3000/'+place.images}
                            alt={place.name_product}
                            className="h-28 object-cover rounded-lg"
                            style={{ maxWidth: '100%' }}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg">
                          <p className="text-white text-sm font-medium">
                            {place.name_product}
                          </p>
                          <p className="text-purple-100 text-xs">
                            {place.detail_product}
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

            {/* ฝั่งขวา - แผนที่และข้อมูลเพิ่มเติม */}
            <div className="space-y-6">
              {/* Map Section */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-purple-100 px-6 py-4 border-b">
                  <h3 className="font-semibold text-purple-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    ตำแหน่งผู้ขาย
                  </h3>
                </div>
                
                <div className="p-6">
                  {/* Map */}
                  <div className="h-64 rounded-xl overflow-hidden border-2 border-purple-100">
                    {item.latitude && item.longitude ? (
                      <MapContainer
                        center={[parseFloat(item.latitude), parseFloat(item.longitude)]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[parseFloat(item.latitude), parseFloat(item.longitude)]}>
                          <Popup>
                            <div className="text-center p-2">
                              <h3 className="font-semibold text-lg">{item.name_product}</h3>
                              <p className="text-sm text-gray-600 mt-1">ผู้ขาย: {item.first_name}</p>
                              <p className="text-purple-600 font-bold mt-2">฿{parseFloat(item.price || 0).toLocaleString()}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="h-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <p>ไม่มีข้อมูลตำแหน่ง</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Image Modal */}
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Detall_Prodact;