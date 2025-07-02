import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./admin/pages/dashboard";
import Usermember from "./admin/pages/Usermembers";
import PostController from "./admin/pages/PostControllers";
import EventControllers from "./admin/pages/EventControllers";
import ProductControllers from "./admin/pages/ProductControllers";
import Adminlayout from "./layout/Adminlayout";
import HomePage from "./pages/HomePage";
import AdminLayout from "./layout/Adminlayout";
import Pageslayout from "./layout/Pageslayout";

function App() {
  const router = createBrowserRouter([
    {
      path: "/admin",
      element: <Adminlayout />,
      children: [
        {
          path: "/admin",
          element: <Dashboard />,
        },
        {
          path: "/admin/usermember",
          element: <Usermember />,
        },
        {
          path: "/admin/post",
          element: <PostController />,
        },
        {
          path: "/admin/event",
          element: <EventControllers />,
        },
        {
          path: "/admin/product",
          element: <ProductControllers />,
        },
      ],
    },
    {
      path: "/page",
      element: <Pageslayout />,
      children : [
        {
          path:"/page/home",
          element: <HomePage />,
        },
      ]
    },
  ]);
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
