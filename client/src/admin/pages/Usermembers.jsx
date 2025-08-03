import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Trash } from "lucide-react";

function Usermember() {
  const [post, setPost] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const getPost = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "member")
      setPost(res.data.rows)
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPost();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(post.length / itemsPerPage);
  const paginatedUsers = post.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>ไอดีผู้ใช้</th>
            <th>ชื่อ-นามสกุล</th>
            <th>email</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((item, index) => (
            <tr key={item.id_user}>
              <td>{(page - 1) * itemsPerPage + index + 1}</td>
              <td>{item.id_user}</td>
              <td>{item.first_name} {item.last_name}</td>
              <td>{item.Email}</td>
              <td><Trash /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2 mt-4 text-base">
        <button
          className="btn btn-sm"
          onClick={handlePrev}
          disabled={page === 1}
        >
          ก่อนหน้า
        </button>
        <span>
          หน้า {page} / {totalPages}
        </span>
        <button
          className="btn btn-sm"
          onClick={handleNext}
          disabled={page === totalPages || totalPages === 0}
        >
          ถัดไป
        </button>
      </div>
    </div>
  )
}

export default Usermember