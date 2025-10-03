import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Heart, 
  MessageCircle, 
  Share2, 
  Camera,
  Navigation,
  Wifi,
  Car,
  Utensils
} from 'lucide-react';

function PlaceDetail() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchPlaceDetails();
    fetchComments();
  }, [id]);

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API}posts/${id}`);
      setPlace(response.data.data);
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API}post/comment_id/${id}`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      if (isLiked) {
        await axios.delete(`${import.meta.env.VITE_API}post/likes/${id}/${userId}`);
      } else {
        await axios.post(`${import.meta.env.VITE_API}post/likes/${id}`, {
          id_user: userId
        });
      }
      
      setIsLiked(!isLiked);
      fetchPlaceDetails();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      await axios.post(`${import.meta.env.VITE_API}post/comment/${id}`, {
        id_user: userId,
        comment: newComment,
        star: rating
      });

      setNewComment('');
      setRating(5);
      setShowCommentModal(false);
      fetchComments();
      fetchPlaceDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบสถานที่</h2>
          <p className="text-gray-600">สถานที่ที่คุณกำลังมองหาอาจถูกลบหรือไม่ปรากฏ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Image */}
            <div className="lg:col-span-2">
              <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden">
                {place.images ? (
                  <img
                    src={place.images}
                    alt={place.name_location}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {place.name_location}
                </h1>
                
                {place.category && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium mb-4">
                    {place.category}
                  </span>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(place.star || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium text-gray-900">
                    {place.star ? place.star.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{place.comments || 0} รีวิว</span>
                </div>

                <div className="flex gap-2 mb-6">
                  <button
                    onClick={handleLike}
                    className={`btn btn-sm ${isLiked ? 'btn-error' : 'btn-outline'}`}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                    {place.likes || 0}
                  </button>
                  <button
                    onClick={() => setShowCommentModal(true)}
                    className="btn btn-sm btn-outline"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    รีวิว
                  </button>
                  <button className="btn btn-sm btn-outline">
                    <Share2 className="w-4 h-4 mr-1" />
                    แชร์
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {place.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-5 h-5 mr-3 text-gray-500" />
                    <span>{place.phone}</span>
                  </div>
                )}
                
                {place.opening_hours && (
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3 text-gray-500" />
                    <span>{place.opening_hours}</span>
                  </div>
                )}

                {place.price_range && (
                  <div className="flex items-center text-green-600 font-medium">
                    <span className="text-lg">{place.price_range}</span>
                  </div>
                )}

                {place.latitude && place.longitude && (
                  <button className="btn btn-primary btn-sm w-full">
                    <Navigation className="w-4 h-4 mr-2" />
                    ดูบนแผนที่
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">เกี่ยวกับสถานที่</h2>
              <p className="text-gray-700 leading-relaxed">
                {place.detail_location}
              </p>
              {place.detail_att && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลเพิ่มเติม</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {place.detail_att}
                  </p>
                </div>
              )}
            </div>

            {/* Facilities */}
            {place.facilities && (
              <div className="bg-white rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h2>
                <div className="flex flex-wrap gap-4">
                  {place.facilities.split(',').map((facility, index) => (
                    <div key={index} className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                      {facility.trim().toLowerCase().includes('wifi') && <Wifi className="w-4 h-4 mr-2 text-blue-500" />}
                      {facility.trim().toLowerCase().includes('จอด') && <Car className="w-4 h-4 mr-2 text-green-500" />}
                      {facility.trim().toLowerCase().includes('อาหาร') && <Utensils className="w-4 h-4 mr-2 text-orange-500" />}
                      <span className="text-sm text-gray-700">{facility.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">รีวิวจากผู้ใช้</h2>
              
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {comment.first_name ? comment.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{comment.first_name || 'ผู้ใช้'}</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (comment.star || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        {new Date(comment.date_comment).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">ยังไม่มีรีวิว</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            {place.latitude && place.longitude && (
              <div className="bg-white rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">ตำแหน่ง</h3>
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  ละติจูด: {place.latitude}, ลองจิจูด: {place.longitude}
                </p>
              </div>
            )}

            {/* Similar Places */}
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">สถานที่ใกล้เคียง</h3>
              <p className="text-gray-500 text-sm">ฟีเจอร์นี้จะมาเร็วๆ นี้</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">เขียนรีวิว</h3>
            <form onSubmit={handleComment} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">คะแนน</span>
                </label>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      className={`w-8 h-8 ${
                        i < rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">ความคิดเห็น</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="เขียนรีวิวของคุณ..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCommentModal(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  ส่งรีวิว
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCommentModal(false)}></div>
        </div>
      )}
    </div>
  );
}

export default PlaceDetail;
