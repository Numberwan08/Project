import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Mountain,
  Leaf,
  User,
  Calendar,
  UserCheck,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [data, setData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleInput = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (data.password !== data.confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    try {
      // Uncomment these lines for actual implementation:
      const res = await axios.post(import.meta.env.VITE_API + "register", data);
      toast.success(res.data.msg, {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      // Show error toast
      toast.error(err.response?.data?.msg || "เกิดข้อผิดพลาดในการสมัคร", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      console.log("เกิดข้อผิดพลาดในการสมัคร", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-purple-200 opacity-30">
          <Mountain size={120} />
        </div>
        <div className="absolute bottom-20 right-20 text-violet-200 opacity-30">
          <Leaf size={100} />
        </div>
        <div className="absolute top-1/2 left-1/4 text-indigo-200 opacity-20">
          <Mountain size={80} />
        </div>
        <div className="absolute top-1/3 right-1/3 text-purple-200 opacity-20">
          <Leaf size={60} />
        </div>
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full mb-4 shadow-lg">
              <UserCheck className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              สมัครสมาชิก
            </h2>
            <p className="text-gray-600">เข้าร่วมระบบจังหวัดเชียงราย</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 placeholder-gray-400"
                  placeholder="กรอกอีเมลของคุณ"
                  name="email"
                  onChange={handleInput}
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 placeholder-gray-400"
                    placeholder="รหัสผ่าน"
                    name="password"
                    onChange={handleInput}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 placeholder-gray-400"
                    placeholder="ยืนยันรหัสผ่าน"
                    name="confirmPassword"
                    onChange={handleInput}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 placeholder-gray-400"
                    placeholder="ชื่อ"
                    name="first_name"
                    onChange={handleInput}
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นามสกุล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 placeholder-gray-400"
                    placeholder="นามสกุล"
                    name="last_name"
                    onChange={handleInput}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเกิด
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50"
                  name="dob"
                  onChange={handleInput}
                  required
                />
              </div>
            </div>

            {/* Gender */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                เพศ
              </label>
              <div className="flex space-x-6 ">
                <div className="flex items-center ">
                  <input
                    type="radio"
                    name="sex"
                    value="M"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    onChange={handleInput}
                  />
                  <label className="ml-2 block text-sm  text-gray-700">
                    ชาย
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="sex"
                    value="F"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    onChange={handleInput}
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    หญิง
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-purple-500 to-violet-500 cursor-pointer text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              ยืนยันการสมัคร
            </button>
            <Link to="/">
              <button className="w-full cursor-pointer text-white py-3 px-4 rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 btn btn-error focus:ring-offset-2">
                กลับหน้าหลัก
              </button>
            </Link>
          </div>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">หรือ</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/login">
                <button className="text-purple-600 hover:text-purple-800 cursor-pointer font-semibold transition-colors">
                  เข้าสู่ระบบ
                </button>
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm flex items-center justify-center">
            <Mountain className="w-4 h-4 mr-1" />
            ระบบจังหวัดเชียงราย - ดินแดนแห่งความงาม
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

export default Register;
