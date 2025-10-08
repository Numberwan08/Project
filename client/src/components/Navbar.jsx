import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  // {
  //   label: "สินค้า",
  //   path: "/product",
  // },
];

const Navbar = () => {
  const { isLogin, logout, name } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white shadow-md py-4 px-6 fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Chiang Rai</div>
        <ul className=" flex justify-between space-x-6">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`text-gray-700 hover:text-purple-500 transition duration-200 font-medium ${
  location.pathname === item.path
    ? "text-purple-800 font-bold bg-purple-100 px-3 py-1 rounded"
    : ""
}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {isLogin ? (
            <>
              <h3>สวัสดี :{name}</h3>
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn m-1">
                  เมนูสมาชิก
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                  {/* <li>
                    <a href="/menu/menu_att">เพิ่มสถานที่</a>
                  </li> */}
                  <li>
                    <a href="/menu/menu_event">เพิ่มกิจกรรม</a>
                  </li>
                  {/* <li>
                    <a href="/menu/menu_prodact">เพิ่มสินค้า</a>
                  </li> */}
                  <li>
                    <a href="/menu/Show_Event">ข้อมูลกิจกรรม</a>
                  </li>
                  <li>
                    <a href="/menu/show_product">ข้อมูลสินค้า</a>
                  </li>
                  <li>
                    <a href="/menu/profile">แก้ไขโปรไฟล์</a>
                  </li>
                  <Link to="/">
                    <li
                      onClick={() => logout()}
                      className="bg-red-100 text-red-600 hover:bg-red-200 rounded-md px-2 py-1 font-semibold cursor-pointer"
                    >
                      ออกจากระบบ
                    </li>
                  </Link>
                </ul>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
