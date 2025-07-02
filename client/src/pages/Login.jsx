import React from 'react';
import { Link } from 'react-router-dom';

function Login() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">เข้าสู่ระบบ</h2>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="อีเมล"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200">
            เข้าสู่ระบบ
          </button>
        </form>
        <button
          className="w-full mt-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition duration-200"
          onClick={() => window.location.href = '/'}
        >
          กลับหน้าหลัก
        </button>
        <p className="text-center text-sm text-gray-600 mt-4">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
