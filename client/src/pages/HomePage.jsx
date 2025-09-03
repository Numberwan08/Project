import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Mail, MessageCircle, ThumbsUp } from "lucide-react";

function HomePage() {
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios
        .get(import.meta.env.VITE_API + "post")
        .then((res) => res.data.data || [])
        .catch(() => []),
      axios
        .get(import.meta.env.VITE_API + "event")
        .then((res) => res.data.data || [])
        .catch(() => []),
      axios
        .get(import.meta.env.VITE_API + "product")
        .then((res) => res.data.data || [])
        .catch(() => []),
    ]).then(([placesData, eventsData, productsData]) => {
      setPlaces(placesData);
      setEvents(eventsData);
      setProducts(productsData);
      setLoading(false);
    });
  }, []);
   
  const topCulture = places.filter((i) => i.type == 1).slice(0, 4);

  const topEvents = events.filter((i) => i.type == 2).slice(0, 3);

  const recommendLeft = shuffle([
    ...places.filter((i) => i.type == 1),
    ...events.filter((i) => i.type == 2),
  ]).slice(0, 10);

  const recommendRight = Array.isArray(products) ? products.slice(0, 10) : [];

  function shuffle(arr) {
    let a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-600 text-lg font-medium">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 mt-20">
      <div className="container mx-auto px-4 py-8">
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              สถานที่ท่องเที่ยวเชิงวัฒนธรรมยอดนิยม
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {topCulture.map((item, idx) => (
              <div
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                key={item.id_post || idx}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.images}
                    alt={item.name_location}
                    className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4"></div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1">
                      <ThumbsUp color="#9900FF" />
                      <span>{item.likes}</span>
                    </div>
                    <div>โพสต์โดย: {item.first_name}</div>
                    <div className="flex items-center gap-1">
                      <MessageCircle color="#9900FF" />
                      <span>{item.comments}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {item.name_location}
                  </h3>
                  <Link to={`/detall_att/${item.id_post}`}>
                    <button className="w-full bg-gradient-to-r cursor-pointer from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      ดูรายละเอียด
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 shadow-2xl">
            <div className="text-center mb-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                กิจกรรมที่น่าสนใจ
              </h2>
              <div className="w-24 h-1 bg-white/50 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topEvents.map((item, idx) => (
                <div
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group"
                  key={item.id_event || idx}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={item.images}
                      alt={item.name_event}
                      className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4"></div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-1">
                        <ThumbsUp color="#4093ffff" />
                        <span>{item.likes}</span>
                      </div>
                      <div>โพสต์โดย: {item.first_name}</div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.name_event}
                    </h3>
                    <Link to={`/detall_event/${item.id_event}`}>
                      <button className="w-full bg-gradient-to-r cursor-pointer from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        ดูรายละเอียด
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              แนะนำ
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
          </div>

          {/* ใช้ flex แทน grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              {recommendLeft.map((item, idx) => (
                <div
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-400 overflow-hidden group"
                  key={item.id_post || item.id_event || idx}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 relative overflow-hidden">
                      <img
                        src={item.images}
                        alt={item.name_location || item.name_event}
                        className="h-48 md:h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="md:w-3/5 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                            {item.name_location || item.name_event}
                          </h3>
                          {item.type == 1 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full ml-2 whitespace-nowrap">
                              สถานที่
                            </span>
                          )}
                          {item.type == 2 && (
                            <span className="px-2 py-1 bg-rose-100 text-rose-600 text-xs font-semibold rounded-full ml-2 whitespace-nowrap">
                              กิจกรรม
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 line-clamp-3 mb-4">
                          {item.detail_location || item.location_event}
                        </p>
                      </div>

                      <Link
                        to={
                          item.id_post
                            ? `/detall_att/${item.id_post}`
                            : `/detall_event/${item.id_event}`
                        }
                        className="self-start"
                      >
                        <button className="bg-gradient-to-r from-purple-500 cursor-pointer to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                          ดูรายละเอียด
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-[350px] flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    สินค้าแนะนำ
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-2 rounded-full"></div>
                </div>

                <div className="space-y-6 h-secrrn overflow-y-auto custom-scrollbar">
                  {recommendRight && recommendRight.length > 0 ? (
                    recommendRight.map((item, idx) => (
                      <div
                        key={item.id_product || idx}
                        className="group border-b border-gray-100 pb-4 last:border-b-0 hover:bg-gray-50 p-3 rounded-xl transition-all duration-300"
                      >
                        <div className="relative overflow-hidden rounded-lg mb-3">
                          <img
                            src={item.images}
                            alt={item.name_product}
                            className="h-24 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = "/no-image.png";
                            }}
                          />
                          <div className="absolute top-2 right-2"></div>
                        </div>

                        <h4 className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                          {item.name_product}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {item.detail_product}
                        </p>
                        <p className="text-rose-600 font-bold mb-2">
                          ราคา: {item.price} บาท
                        </p>
                        <Link to={`/detall_product/${item.id_product}`}>
                          <button className="w-full bg-gradient-to-r from-purple-500 cursor-pointer to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                            ดูรายละเอียด
                          </button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-400 font-medium">
                        ไม่มีสินค้าแนะนำ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb #f3f4f6;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}

export default HomePage;
