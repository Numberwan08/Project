import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ThumbsUp } from 'lucide-react';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Detall_Event() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [nearbyEvent, setNerabyEvent] = useState([]);


  const userId = localStorage.getItem("userId");

  const getNearbyEvent = async () => {
    try{
      const res = await axios.get(import.meta.env.VITE_API + `nearby_event/${id}`);
      console.log("nearby event",res.data);
      setNerabyEvent(res.data.data || []);

    }catch(err){
      console.log("error get nearby event",err);
    }
  }
  const getEvent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `get_event/${id}`);
      setData(res.data.data);
      // ตรวจสอบสถานะไลค์
      if (userId) {
        const resCheck = await axios.get(
          import.meta.env.VITE_API + `event/likes/check/${id}/${userId}`
        );
        setLiked(!!resCheck.data.liked);
      } else {
        setLiked(false);
      }
    } catch (err) {
      console.log("error get data", err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันไลค์/อันไลค์
  const handlelike = async (item) => {
    if (!userId) {
      alert("กรุณาเข้าสู่ระบบก่อนกดไลค์");
      return;
    }

    try {
      if (liked) {
        await axios.delete(
          import.meta.env.VITE_API + `event/likes/${item.id_event}/${userId}`
        );
        setLiked(false);
      } else {
          await axios.post(
          import.meta.env.VITE_API + `event/likes/${item.id_event}`,
          { userId }
        );
        
        setLiked(true);
      }
      getEvent();
    } catch (err) {
      console.log("Error like/unlike event : ", err);
    }
  };

  useEffect(() => {
    getEvent();
    getNearbyEvent();
    // eslint-disable-next-line
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilEvent = (startDate) => {
    if (!startDate) return null;
    const today = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 text-lg font-medium">กำลังโหลดข้อมูลกิจกรรม...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {data.map((item, index) => {
        const daysUntil = getDaysUntilEvent(item.date_start);
        const isUpcoming = daysUntil > 0;
        const isToday = daysUntil === 0;
        const isPast = daysUntil < 0;

        return (
          <div key={index} className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* ฝั่งซ้าย - รูปภาพและข้อมูลกิจกรรม */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Image */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="relative">
                    <img 
                      src={item.images} 
                      alt={item.name_event}
                      className="w-full h-80 lg:h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setSelectedImage(item.images)}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full shadow-lg">
                        กิจกรรม
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      {isUpcoming && (
                        <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg">
                          เหลืออีก {daysUntil} วัน
                        </span>
                      )}
                      {isToday && (
                        <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-lg animate-pulse">
                          วันนี้!
                        </span>
                      )}
                      {isPast && (
                        <span className="px-3 py-1 bg-gray-500 text-white text-sm font-semibold rounded-full shadow-lg">
                          สิ้นสุดแล้ว
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      คลิกเพื่อดูขนาดใหญ่
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="mb-6">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                      {item.name_event}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <ThumbsUp
                        color={liked ? "#22c55e" : "#ef4444"}
                        onClick={() => handlelike(item)}
                        className={`cursor-pointer ${liked ? "scale-110" : ""}`}
                      />
                      {item.likes}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {isUpcoming && `เหลืออีก ${daysUntil} วัน`}
                          {isToday && 'วันนี้!'}
                          {isPast && 'สิ้นสุดแล้ว'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Description */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      รายละเอียดกิจกรรม
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {item.detail_event}
                    </p>
                  </div>

                  {/* Event Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Location */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        สถานที่
                      </h3>
                      <p className="text-blue-700 font-medium">{item.location_event}</p>
                    </div>

                    {/* Contact */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        ติดต่อ
                      </h3>
                      <p className="text-green-700 font-medium">{item.phone}</p>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      วันที่และเวลา
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-purple-700 font-medium mb-1">วันที่เริ่ม:</p>
                        <p className="text-purple-800 font-semibold">{formatDate(item.date_start)}</p>
                        <p className="text-purple-600 text-sm">เวลา {formatTime(item.date_start)}</p>
                      </div>
                      <div>
                        <p className="text-purple-700 font-medium mb-1">วันที่สิ้นสุด:</p>
                        <p className="text-purple-800 font-semibold">{formatDate(item.date_end)}</p>
                        <p className="text-purple-600 text-sm">เวลา {formatTime(item.date_end)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Events */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">กิจกรรมที่เกี่ยวข้อง</h2>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nearbyEvent.length > 0 ? (
                    nearbyEvent.map((place, idx) => (
                     <Link to={`/detall_event/${place.id_event}` } key={idx}>
                       <div  className="relative group cursor-pointer">
                        <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center">
                          <img
                            src={'http://localhost:3000/'+place.images}
                            alt={place.name_event}
                            className="h-28 object-cover rounded-lg"
                            style={{ maxWidth: '100%' }}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg">
                          <p className="text-white text-sm font-medium">
                            {place.name_event}
                          </p>
                          <p className="text-purple-100 text-xs">
                            {place.detail_event}
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

              {/* ฝั่งขวา - แผนที่และข้อมูลเพิ่มเติม */}
              <div className="space-y-6">
                {/* Map Section */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-blue-100 px-6 py-4 border-b">
                    <h3 className="font-semibold text-blue-800 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ตำแหน่งกิจกรรม
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    {/* Map */}
                    <div className="h-64 rounded-xl overflow-hidden border-2 border-blue-100">
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
                                <h3 className="font-semibold text-lg">{item.name_event}</h3>
                                <p className="text-sm text-gray-600 mt-1">{item.location_event}</p>
                                <p className="text-blue-600 font-medium mt-2">
                                  {formatDate(item.date_start)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatTime(item.date_start)}
                                </p>
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
        );
      })}

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

export default Detall_Event;