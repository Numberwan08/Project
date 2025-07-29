import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Navbar";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen min-w-full bg-gray-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 w-full">
        <Header />
      </div>
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-20">
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="pl-64 pt-16 min-h-screen">
        <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
