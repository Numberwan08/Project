import React from 'react'
import { createBrowserRouter, Router, RouterProvider } from 'react-router-dom'
import Dashboard from './admin/pages/dashboard'
import Usermember from './admin/pages/Usermembers' 
import PostController from './admin/pages/PostControllers'

function App() {
  const router = createBrowserRouter([
    {
      path: '/admin',
      element: <Dashboard/>,
    },
    {
      path: '/admin/usermember',
      element: <Usermembers/>,
    },
    {
      path: '/admin/PostController',
      element:<PostControllers/>, 
    },
    {
      path: '/admin/EventControllers',
      element: <EventControllers/>,
    }
  ])
  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
