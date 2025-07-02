import React from 'react';
import { Link } from 'react-router-dom';

const menuItems = [
  {
    label: "หน้าแรก",
    path: "/",
  },
  {
    label: "ท่องเที่ยว",
    path: "/attraction",
  },
  {
    label: "กิจกรรม",
    path: "/event",
  },
  {
    label: "สินค้า",
    path: "/product",
  },
];
const Navbar = ({ isOpen = true }) => {
  if (!isOpen) return null;

  return (
    <nav className="bg-white shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">MyWebsite</div>
        <ul className=" flex justify-between space-x-6">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className="text-gray-700 hover:text-blue-500 transition duration-200 font-medium"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
            <button>
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-500 transition duration-200 font-medium"
              >
                เข้าสู่ระบบ
              </Link>
              
            </button>
            <button>
               <Link
                to="/register"
                className="text-gray-700 hover:text-blue-500 transition duration-200 font-medium"
              >
                สมัครสมาชิก
              </Link>
            </button>
          </div>
      </div>
    </nav>
  );
};
export default Navbar;
