import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function EventPages() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(import.meta.env.VITE_API + "event")
      .then(res => setEvents(res.data.data || []))
      .catch(() => setEvents([]));
  }, []);

  const filteredEvents = events
    .filter(item => item.type == 2)
    .filter(item =>
      item.name_event
        ? item.name_event.toLowerCase().includes(search.toLowerCase())
        : false
    );

  return (
    <div>
      <div className="m-5 gap-3">
        <form
          className="max-w-md mx-auto"
          onSubmit={e => e.preventDefault()}
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
              placeholder="ค้นหากิจกรรม"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Search
            </button>
          </div>
        </form>

        <div className="text-4xl text-center mt-5 mb-3">กิจกรรม</div>

        <div className="flex flex-row flex-wrap gap-5 justify-center p-4">
          {filteredEvents.length === 0 && (
            <div className="text-gray-500 text-lg">ไม่พบข้อมูลกิจกรรม</div>
          )}
          {filteredEvents.map((item) => (
            <div className="card bg-base-100 w-64 shadow-sm" key={item.id_event}>
              <figure>
                <img
                  src={item.images}
                  alt={item.name_event}
                  className="h-40 w-full object-cover"
                />
              </figure>
              <div className="card-body">
                <div className="flex justify-end">
                  <div className="badge bg-rose-600 text-base-100">
                    กิจกรรม
                  </div>
                </div>
                <p className="font-bold">{item.name_event}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {item.location_event}
                </p>
                <Link to={`/detall_event/${item.id_event}`}>
                  <button className="btn btn-error w-full">รายละเอียดกิจกรรม</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EventPages