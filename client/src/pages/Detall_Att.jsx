import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Star, 
  Heart, 
  Share2, 
  Camera, 
  User, 
  Calendar,
  Navigation,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Mountain,
  Users
} from 'lucide-react';

function Detail_Att() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const images = [
    "https://images.unsplash.com/photo-1563492065-c9a1bb45e8c2?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1570655569213-c9d90e3c3aa4?w=800&h=400&fit=crop"
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const galleryImages = [
    "https://images.unsplash.com/photo-1563492065-c9a1bb45e8c2?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1570655569213-c9d90e3c3aa4?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1563492065-c9a1bb45e8c2?w=150&h=100&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=100&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Main Image Slider */}
            <div className="relative mb-6">
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt="Attraction"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                
                {/* Navigation Buttons */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2 rounded-full transition-all ${
                      isLiked ? 'bg-red-500 text-white' : 'bg-white bg-opacity-80 text-gray-800'
                    }`}
                  >
                    <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  <button className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all">
                    <Share2 className="h-5 w-5 text-gray-800" />
                  </button>
                  <button className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all">
                    <Camera className="h-5 w-5 text-gray-800" />
                  </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>
            </div>

            {/* Title and Rating */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">วัดห้วยปลากั้ง เชียงราย</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.8 (2,345 รีวิว)</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">เยี่ยมชมแล้ว 15,432 คน</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">รายละเอียด</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  วัดห้วยปลากั้ง เป็นวัดที่มีความสวยงามและเป็นที่รู้จักในจังหวัดเชียงราย ด้วยสถาปัตยกรรมที่งดงามและมีเอกลักษณ์เฉพาะตัว 
                  ตั้งอยู่ท่ามกลางธรรมชาติที่สวยงาม เป็นสถานที่ท่องเที่ยวที่น่าสนใจสำหรับนักท่องเที่ยวที่ชื่นชอบศิลปะและวัฒนธรรม
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  ภายในวัดมีจุดเด่นหลายจุด ทั้งพระอุโบสถที่มีลวดลายประณีตสวยงาม และมีพระพุทธรูปที่น่าเคารพสักการะ 
                  นอกจากนี้ยังมีบรรยากาศที่เงียบสงบ เหมาะสำหรับการมาทำบุญและขอพร
                </p>
                <p className="text-gray-700 leading-relaxed">
                  การเดินทางมาที่วัดห้วยปลากั้งสะดวก มีที่จอดรถเพียงพอ และมีสิ่งอำนวยความสะดวกต่างๆ ครบครัน 
                  เป็นสถานที่ที่เหมาะสำหรับการมาเยี่ยมชมทั้งครอบครัวและกลุ่มเพื่อน
                </p>
              </div>
            </div>

            {/* Gallery */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">แกลเลอรี่</h3>
              <div className="grid grid-cols-3 gap-4">
                {galleryImages.map((image, index) => (
                  <div key={index} className="relative h-24 rounded-lg overflow-hidden hover:opacity-75 transition-opacity cursor-pointer">
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">ข้อมูลเพิ่มเติม</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">เปิด: 06:00 - 18:00 น.</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">เปิดทุกวัน</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">053-123-456</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">ติดตามเรา</h4>
                <div className="flex space-x-4">
                  <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Facebook className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                    <Twitter className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                    <Instagram className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Youtube className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            {/* User Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">สมาชิกใหม่</h4>
                  <p className="text-sm text-gray-600">เข้าร่วมเมื่อ มกราคม 2024</p>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                ดูโปรไฟล์
              </button>
            </div>

            {/* Map Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">ตำแหน่งที่ตั้ง</h4>
                <button className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                  <Navigation className="h-4 w-4" />
                </button>
              </div>
              <div className="h-48 bg-gray-200 rounded-lg mb-4 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=200&fit=crop"
                  alt="Map"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <MapPin className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">วัดห้วยปลากั้ง</p>
                  <p className="text-xs text-gray-600">ตำบลห้วยปลากั้ง อำเภอเมืองเชียงราย จังหวัดเชียงราย</p>
                </div>
              </div>
            </div>

            {/* Related Attractions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">สถานที่ใกล้เคียง</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center space-x-3">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={`https://images.unsplash.com/photo-157${item}019613454-1cb2f99b2d8b?w=100&h=60&fit=crop`}
                        alt={`Related ${item}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">วัดโรงขุ่น</h5>
                      <p className="text-xs text-gray-600">ระยะทาง 2.5 กม.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Detail_Att;