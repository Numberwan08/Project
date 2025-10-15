import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./admin/pages/Dashboard";
import Usermember from "./admin/pages/Usermembers";
import PostController from "./admin/pages/PostControllers";
import EventControllers from "./admin/pages/EventControllers";
import ProductControllers from "./admin/pages/ProductControllers";
import ManagePlaces from "./admin/pages/ManagePlaces";
import Adminlayout from "./layout/Adminlayout";
import HomePage from "./pages/HomePage";
import Pageslayout from "./layout/Pageslayout";
import EventPages from "./pages/EventPages";
import AttractionPage from "./pages/AttractionPage";
import ProductPage from "./pages/ProductPage";
import PlacesPage from "./pages/PlacesPage";
import PlaceDetail from "./pages/PlaceDetail";  
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "./context/AuthContext";
import { ReportProvider } from "./context/ReportContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import Detall_Event from "./pages/Detall_Event";
import Detall_Prodact from "./pages/Detall_Prodact";
import Detall_Att from "./pages/Detall_Att";
import Uselayuot from "./layout/Uselayout";
import Menu_Att from "./pages/Menu_Att";
import Menu_Event from "./pages/Menu_Event";
import Menu_Prodact from "./pages/Menu_Prodact";
import Menu_Profile from "./pages/Menu_Profile";
import Show_Event from "./pages/show_event";
import Show_Product from "./pages/show_product";
import Adminlogin from "./admin/pages/Adminlogin";
import { Edit } from "lucide-react";
import Editprofile from "./pages/Editprofile";
import PostControllers from "./admin/pages/ManagePlaces";
import "./App.css";
import Add_type_name from "./admin/pages/Add_type_name";
import ReportComment from "./admin/pages/reportcomment";
import Report_Me from "./pages/Report_Me";
import HistoryReport from "./pages/HistoryReport";
import Comment_Me from "./pages/Comment_Me";
import Show_Profile from "./pages/Show_Profile";

function App() {
  const router = createBrowserRouter([
    {
      path:"/loginadmin",
      element:<Adminlogin/>
    },
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
          path: "/admin/places",
          element: <PostControllers />,
        },
        {
          path: "/admin/event",
          element: <EventControllers />,
        },
        {
          path: "/admin/product",
          element: <ProductControllers />,
        },
        {
          path: "/admin/addattraction",
          element: <Menu_Att />,
        },
        {
          path: "/admin/addtype",
          element: <Add_type_name />,
        },
        {
          path: "/admin/reportcomment",
          element: <ReportComment/>,
        }
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
          path:"/places",
          element: <PlacesPage />,
        },
        {
          path:"/place/:id",
          element: <PlaceDetail />,
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
        {
          path:"/showprofile/:id",
          element:<Show_Profile/>,
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
        },
        {
          path:"/menu/profile",
          element:<Editprofile/>
        },
        {
          path:"/menu/redactcommnet",
          element:<Report_Me/>
        },
        {
          path:"/menu/historyreport",
          element:<HistoryReport/>
        },
        {
          path:"/menu/comment",
          element:<Comment_Me/>
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
      <ReportProvider>
        <RealtimeProvider>
          <NotificationsProvider>
            <RouterProvider router={router} />
          </NotificationsProvider>
        </RealtimeProvider>
      </ReportProvider>
    </AuthProvider>
  );
}

export default App;
