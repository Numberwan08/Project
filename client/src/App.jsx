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
import { AuthProvider } from "./context/AuthContext";
import Detall_Event from "./pages/Detall_Event";
import Detall_Prodact from "./pages/Detall_Prodact";
import Detall_Att from "./pages/Detall_att";
import Uselayuot from "./layout/Uselayout";
import Menu_Att from "./pages/Menu_Att";
import Menu_Event from "./pages/Menu_Event";
import Menu_Prodact from "./pages/Menu_Prodact";
import Menu_Profile from "./pages/Menu_Profile";
import Show_Event from "./pages/show_event";
import Show_Product from "./pages/show_product";

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
        {
          path:"/detall_att/:id",
          element:<Detall_Att/>,
        },
        {
          path:"/detall_event/:id",
          element:<Detall_Event/>,
        },
        {
          path:"/detall_product/:id",
          element:<Detall_Prodact/>,
        },
      ]
    },
    {
      path:"/menu",
      element:<Uselayuot/>,
      children:[
        {
          path:"/menu/menu_att",
          element : <Menu_Att/>
        },
        {
          path:"/menu/menu_event",
          element : <Menu_Event/>
        },
        {
          path:"/menu/menu_prodact",
          element : <Menu_Prodact/>
        },
        {
          path:"/menu/menu_profile",
          element : <Menu_Profile/>
        },
        {
          path:"/menu/show_event",
          element : <Show_Event/>
        },
        {
          path:"/menu/show_product",
          element:<Show_Product/>
        }
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
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
