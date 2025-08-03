import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Trash } from "lucide-react";

function Usermember() {
  const [post, setPost]= useState([]);
  const getPost = async () => {
    try{
      const res = await axios.get(import.meta.env.VITE_API+"member")
      setPost(res.data.rows)
      console.log(res.data.rows);
      
    }catch(err){
      console.log(err);
    }
  };

  useEffect(()=>{
    getPost();
  },[]);
  return (
    <div>
      <table className="table">
        {/* {JSON.stringify(post,null,2)} */}
        <thead>
          <tr>
            <th>#</th>
            <th>ไอดีผู้ใช้</th>
            <th>ชื่อ-นามสกุล</th>
            <th>email</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {post.map((item,index)=>(
            <tr>
              <td>{index+1}</td>
              <td>{item.id_user}</td>
              <td>{item.first_name} {item.last_name}</td>
              <td>{item.Email}</td>
              <td><Trash/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Usermember
