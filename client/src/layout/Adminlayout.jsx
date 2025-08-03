import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../admin/components/sidebar";
import Header from "../admin/components/Header";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="w-screen h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar Fixed */}
      <div className={`fixed top-0 left-0 h-full  bg-white z-20 transition-all duration-300${
        sidebarOpen ? " w-64" : " w-20"
      }`}>
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300${
        sidebarOpen ? " ml-64" : " ml-20"
      }`}>
        {/* Header Fixed */}
        <div className="fixed top-0 left-64 right-0 h-16 bg-white z-10 transition-all duration-300"
        style={{ left: sidebarOpen ? "16rem" : "4rem" }}>
          <Header toggleSidebar={toggleSidebar} />
        </div>

        {/* Scrollable content below header */}
        <main className="flex-1 overflow-y-auto mt-16  p-4 bg-gray-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;