import React from "react";

import {
  LayoutDashboard,
  Users,
  LogOut,
  BookText,
  MailWarning,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

// รายการเมนูทั้งหมด
const menuItems = [
  { label: "เพิ่มสถานที่ท่องเที่ยว", icon: <Users size={20} />, path: "/menu/menu_att" },
  {
    label: "เพิ่มกิจกรรม",
    icon: <BookText size={20} />,
    path: "/menu/menu_event",
  },
  { label: "เพิ่มสินค้า", icon: <Settings size={20} />, path: "/menu/menu_prodact" },
  {
    label: "โพสต์ของผู้ใช้",
    icon: <MailWarning size={20} />,
    path: "/menu/menu_profile",
  },
  {
    label: "กิจกรรมของผู้ใช้",
    icon: <MailWarning size={20} />,
    path: "/menu/show_event",
  },
  {
    label: "สินค้าผู้ใช้",
    icon: <MailWarning size={20} />,
    path :"/menu/show_product",
  }
];

const Sidebar = ({ isOpen = true }) => {
  const [activeItem, setActiveItem] = React.useState("Dashboard");

  const handleLogout = () => {
    console.log("Logging out...");
  };

  const handleItemClick = (label) => {
    setActiveItem(label);
  };

  return (
    <aside
      className={`h-screen bg-gradient-to-b h-full from-purple-600 to-purple-500 border-r border-purple-700 shadow-2xl transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-4 border-b border-purple-700/50">
        <h2
          className={`text-2xl font-bold text-center text-purple-100 drop-shadow-lg ${
            !isOpen && "hidden"
          }`}
        >
          เมนูสมาชิก
        </h2>
        {!isOpen && (
          <div className="w-8 h-8 bg-purple-600 rounded-lg mx-auto flex items-center justify-center">
            <LayoutDashboard size={20} className="text-purple-100" />
          </div>
        )}
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-150px)]">
        {menuItems.map((item, index) => {
          const isActive = activeItem === item.label;
          return (
            <div key={index} onClick={() => handleItemClick(item.label)}>
             <Link
                to={item.path}>
                 <span
                className={`flex items-center p-3 rounded-xl ml-1 mb-2 transition-all duration-200 cursor-pointer ${
                  !isOpen && "justify-center"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg transform scale-105 border border-purple-400"
                    : "text-purple-200 hover:bg-purple-700/50 hover:text-white hover:shadow-md hover:scale-102"
                }`}
              >
                <span className={isActive ? "text-white" : "text-purple-300"}>
                  {item.icon}
                </span>
                <span className={`ml-3 ${!isOpen && "hidden"} font-medium`}>
                  {item.label}
                </span>
              </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;