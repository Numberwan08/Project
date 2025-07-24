import React from "react";
import { Link } from "react-router-dom";

function AttractionPage() {
  return (
    <div>
      <div className="m-5 gap-3">
        <form class="max-w-md mx-auto">
          <label
            for="default-search"
            class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg
                class="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="ค้นหาสถานที่"
              required
            />
            <button
              type="submit"
              class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Search
            </button>
          </div>
        </form>

        <div className="text-4xl text-center mt-5 mb-3">สถานที่ท่องเที่ยว</div>

        <div className="flex flex-row flex-wrap gap-5 justify-center p-4">
          <div className="card bg-base-100 w-64 shadow-sm">
            <figure>
              <img src="https://s.isanook.com/tr/0/ud/282/1412087/41463628_295061174416770_4443_1.jpg?ip/crop/w670h402/q80/jpg" />
            </figure>
            <div className="card-body">
              <div className="flex justify-end">
                <div className="badge bg-purple-600 text-base-100">
                  เชิงวัฒนธรรม
                </div>
              </div>
              <p>วิ่งขึ้นดอยสุเทพ</p>
              <Link to="/detall_att"><button className="btn btn-error">รายละเอียดสถานที่</button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttractionPage;
