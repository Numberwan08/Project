import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Adminlogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        import.meta.env.VITE_API + "admin/login",
        form
      );
      toast.success("เข้าสู่ระบบสำเร็จ", { autoClose: 1200 });
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.msg || "เข้าสู่ระบบไม่สำเร็จ",
        { autoClose: 2000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <ToastContainer />
      <form
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Admin Login</h2>
        <div className="mb-4">
          <label className="block mb-1 text-gray-600">Username</label>
          <input
            type="text"
            name="username"
            className="input input-bordered w-full"
            value={form.username}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-gray-600">Password</label>
          <input
            type="password"
            name="password"
            className="input input-bordered w-full"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}

export default Adminlogin;