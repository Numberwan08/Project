import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MessageCircle, ThumbsUp } from "lucide-react";

function AttractionPage() {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get(import.meta.env.VITE_API + "post")
      .then((res) => setPlaces(res.data.data || []))
      .catch(() => setPlaces([]));
  }, []);

const filteredPlaces = places
  .filter((item) => item.type == 1)
  .filter((item) =>
    item.name_location
      ? item.name_location.toLowerCase().includes(search.toLowerCase())
      : false
  )
  .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="mt-25">
      <div className="m-5 gap-3">
        <form
          className="max-w-md mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="ค้นหาสถานที่"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <div className="text-4xl text-center mt-5 mb-3">สถานที่ท่องเที่ยวเชิงวัฒนธรรม</div>

        <div className="flex flex-row flex-wrap gap-5 justify-center p-4">
          {filteredPlaces.length === 0 && (
            <div className="text-gray-500 text-lg">ไม่พบข้อมูลสถานที่</div>
          )}
          {filteredPlaces.map((item) => (
            <div className="card bg-base-100 w-64 shadow-sm" key={item.id_post}>
              <figure>
                <img
                  src={item.images}
                  alt={item.name_location}
                  className="h-40 w-full object-cover"
                />
              </figure>
              <div className="card-body">
                <p className="font-bold">{item.name_location}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {item.detail_location}
                </p>
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
                <Link to={`/detall_att/${item.id_post}`}>
                  <button className="btn bg-purple-600 text-base-100 w-full">รายละเอียดสถานที่</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AttractionPage;