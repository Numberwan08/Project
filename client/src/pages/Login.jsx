import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Mountain, Leaf } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, setName, setUserId } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      email,
      password,
    };
    try {
      // Uncomment these lines for actual implementation:
      const res = await axios.post(import.meta.env.VITE_API + "login", payload);
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
      login();
      setTimeout(() => {
        navigate("/");
      }, 1000);
      setName(res.data.data.first_name);
      setUserId(res.data.data.id_user)
    } catch (error) {
      // Show error toast
      toast.error(
        error.response?.data?.msg || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        }
      );
      console.error("Login error:", error);
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
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full mb-4 shadow-lg">
              <Mountain className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              เข้าสู่ระบบ
            </h2>
            <p className="text-gray-600">ยินดีต้อนรับสู่ระบบจังหวัดเชียงราย</p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  required
                />
              </div>
            </div>

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
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
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

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r cursor-pointer from-purple-500 to-violet-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-violet-600 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              เข้าสู่ระบบ
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

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600">
              ยังไม่มีบัญชี?{" "}
              <Link to="/register">
                <button className="text-purple-600 hover:text-purple-800 cursor-pointer font-semibold transition-colors">
                  สมัครสมาชิก
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

export default Login;
