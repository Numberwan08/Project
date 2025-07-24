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
    <div className="w-screen h-screen bg-gray-100 overflow-hidden">
      <div>
        <Header></Header>
      </div>

      {/* Scrollable content below header */}
      <main className="h-screen">
        <div className="flex">
          <div>
            <Sidebar />
          </div>
          <div className="h-screen">
            {" "}
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
