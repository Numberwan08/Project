import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  MessageCircle,
  ThumbsUp,
  Search,
  MapPin,
  Filter,
  Package,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../components/Pagination";

function AttractionPage() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [typeNames, setTypeNames] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchPosts();
    fetchnTypeNames();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "post");
      const postsData = res.data.data || [];
      setPlaces(postsData);

      if (userId) {
        checkLikeStatus(postsData);
      }
    } catch (error) {
      setPlaces([]);
    }
  };

  const fetchnTypeNames = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "type_name");
      setTypeNames(res.data.data || []);
    } catch (error) {
      console.log("Error fetching type names:", error);
    }
  };

  const checkLikeStatus = async (posts) => {
    const likedSet = new Set();

    for (const post of posts) {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API}post/likes/check/${
            post.id_post
          }/${userId}`
        );
        if (res.data.liked) {
          likedSet.add(post.id_post);
        }
      } catch (error) {
        console.log("Error checking like status:", error);
      }
    }

    setLikedPosts(likedSet);
  };

  const handleLike = async (item) => {
    if (!userId) {
      toast.error("กรุณาเข้าสู่ระบบก่อนกดไลค์!", {
        position: "top-center",
        autoClose: 1500,
      });
      return;
    }

    try {
      const isLiked = likedPosts.has(item.id_post);

      if (isLiked) {
        await axios.delete(
          `${import.meta.env.VITE_API}post/likes/${item.id_post}/${userId}`
        );
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id_post);
          return newSet;
        });

        setPlaces((prev) =>
          prev.map((place) =>
            place.id_post === item.id_post
              ? { ...place, likes: place.likes - 1 }
              : place
          )
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API}post/likes/${item.id_post}`,
          { userId }
        );
        setLikedPosts((prev) => new Set([...prev, item.id_post]));

        setPlaces((prev) =>
          prev.map((place) =>
            place.id_post === item.id_post
              ? { ...place, likes: place.likes + 1 }
              : place
          )
        );
      }
    } catch (error) {
      console.log("Error toggling like:", error);
      toast.error("เกิดข้อผิดพลาดในการกดไลค์", {
        position: "top-center",
        autoClose: 1500,
      });
    }
  };

  const filteredPlaces = places
    .filter((item) => item.type == 1)
    .filter((item) =>
      item.name_location
        ? item.name_location.toLowerCase().includes(search.toLowerCase())
        : false
    )
    .filter((item) =>
      selectedTypes.length === 0 ? true : selectedTypes.includes(item.name_type)
    )
    .sort((a, b) => b.likes - a.likes);

  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  const paginatedPlaces = filteredPlaces.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleTypeChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* {JSON.stringify(filteredPlaces)}
        {JSON.stringify(selectedTypes)} */}
        <div className="mt-5">
          {/* ฟอร์มค้นหา */}
          <form
            className="max-w-md mx-auto mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1); // รีเซ็ตหน้าเมื่อค้นหาใหม่
            }}
          >
            <label
              htmlFor="default-search"
              className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
            >
              Search
            </label>
            <div className="relative flex">
              <input
                type="search"
                id="default-search"
                className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="ค้นหาสถานที่"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
              >
                <Search className="w-4 h-4" />
                ค้นหา
              </button>
            </div>
          </form>
        </div>
        {/* Filter Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all mb-4"
          >
            <Filter className="w-5 h-5 text-purple-600" />
            <span className="font-medium  text-gray-700">
              ตัวกรอง {selectedTypes.length > 0 && `(${selectedTypes.length})`}
            </span>
          </button>

          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-fadeIn">
              <h3 className="font-semibold text-gray-700 mb-4">
                ประเภทสถานที่
              </h3>
              <div className="flex flex-wrap gap-3">
                {typeNames.map((type) => (
                  <label
                    key={type.name_type}
                    className={`px-4 py-2 rounded-full cursor-pointer transition-all ${
                      selectedTypes.includes(type.name_type)
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.name_type)}
                      onChange={() => handleTypeChange(type.name_type)}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">
                      {type.name_type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedPlaces.length === 0 && (
            <div className="col-span-full text-center py-16">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ไม่พบข้อมูลสถานที่</p>
            </div>
          )}

          {paginatedPlaces.map((item) => (
            <div
              key={item.id_post}
              className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={item.images}
                  alt={item.name_location}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-purple-600">
                  {item.name_type}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">
                  {item.name_location}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                  {item.detail_location}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                  <button
                    onClick={() => handleLike(item)}
                    className="flex items-center gap-1.5 cursor-pointer group/like"
                  >
                    <ThumbsUp
                      className={`w-5 h-5 transition-all group-hover/like:scale-110 ${
                        likedPosts.has(item.id_post)
                          ? "fill-green-500 text-green-500"
                          : "text-purple-600"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {item.likes}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {item.comments}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {item.products}
                    </span>
                  </div>
                </div>

                {/* Button */}
                <Link to={`/detall_att/${item.id_post}`}>
                  <button className="w-full cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all">
                    ดูรายละเอียด
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

export default AttractionPage;
