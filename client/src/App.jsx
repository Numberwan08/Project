import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./admin/pages/dashboard";
import Usermember from "./admin/pages/Usermembers";
import PostController from "./admin/pages/PostControllers";
import EventControllers from "./admin/pages/EventControllers";
import ProductControllers from "./admin/pages/ProductControllers";
import Adminlayout from "./layout/Adminlayout";
import HomePage from "./pages/HomePage";
import Pageslayout from "./layout/Pageslayout";
import EventPages from "./pages/EventPages";
import AttractionPage from "./pages/AttractionPage";
import ProductPage from "./pages/ProductPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
      path: "/",
      element: <Pageslayout />,
      children : [
        {
          path:"/",
          element: <HomePage />,
        },
        {
          path:"/event",
          element: <EventPages />,
        },
        {
          path:"/attraction",
          element: <AttractionPage />,
        },
        {
          path:"/product",
          element: <ProductPage />,
        },
      ]
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    }
  ]);
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
