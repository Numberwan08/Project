import React from 'react'
import Navbar from '../components/Navbar'
import { Outlet } from 'react-router-dom'

function Pageslayout() {
  return (
    <>
      <div className='mt-15'>
        <Navbar />
      </div>
        <Outlet />
    </>
  )
}

export default Pageslayout
