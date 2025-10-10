import React from "react";
import { useReport } from "../../context/ReportContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  MapPin,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin" },
  { label: "จัดการจำนวนผู้ใช้งาน", icon: <Users size={20} />, path: "usermember" },
  { label: "จัดการสถานที่ท่องเที่ยว", icon: <MapPin size={20} />, path: "places" },
  { label: "จัดการกิจกรรม", icon: <Calendar size={20} />, path: "event" },
  { label: "จัดการสินค้า", icon: <Package size={20} />, path: "product" },
  { label: "เพิ่มประเภทสถานที่", icon: <Package size={20} />, path: "addtype" },
  { label: "รายงานคอมเม้น", icon: <Package size={20} />, path: "reportcomment" },
];

const Sidebar = ({ isOpen = true }) => {
  const location = useLocation();
  const { totalReports } = useReport() || {};
  const activePath = location.pathname.replace("/admin/", "") || "/admin";

  return (
    <aside
      className={`bg-gradient-to-b h-full from-purple-600 to-purple-500 border-r border-purple-700 shadow-2xl transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-4 border-b border-purple-700/50">
        {isOpen ? (
          <h2 className="text-2xl font-bold text-center text-purple-100 drop-shadow-lg">
            Admin Panel
          </h2>
        ) : (
          <div className="w-8 h-8 bg-purple-600 rounded-lg mx-auto flex items-center justify-center">
            <LayoutDashboard size={20} className="text-purple-100" />
          </div>
        )}
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-150px)]">
        {menuItems.map((item, index) => {
          const isActive = location.pathname.endsWith(item.path);
          return (
            <Link to={item.path} key={index}>
              <span
                className={`flex items-center p-3 rounded-xl ml-1 mb-2 transition-all duration-200 cursor-pointer ${
                  !isOpen && "justify-center"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg transform scale-105 border border-purple-400"
                    : "text-purple-200 hover:bg-purple-700/50 hover:text-white hover:shadow-md"
                }`}
              >
                <span>{item.icon}</span>
                <span className={`ml-3 ${!isOpen && "hidden"} font-medium flex items-center gap-2`}>
                  {item.label}
                  {item.path === "reportcomment" && (
                    <span className="badge badge-error text-white">{totalReports || 0}</span>
                  )}
                </span>
              </span>
            </Link>
          );
        })}

        {/* Logout/Home */}
        <Link to="/loginadmin" className="block">
          <span
            className={`flex items-center p-3 rounded-xl ml-1 mb-2 transition-all duration-200 cursor-pointer ${
              !isOpen && "justify-center"
            } text-purple-200 hover:bg-purple-700/50 hover:text-white hover:shadow-md`}
          >
            <LogOut size={20} />
            <span className={`ml-3 ${!isOpen && "hidden"} font-medium`}>
              กลับหน้าหลัก
            </span>
          </span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
