import { useState, useEffect } from 'react';
import axios from 'axios';
import {Eye,Pencil} from "lucide-react";

function Menu_Profile() {
  const [postData, setPostData] = useState([]);
  const user_id = localStorage.getItem("userId");
  const getPostMe = async ()=>{

    try{
      const res = await axios.get(import.meta.env.VITE_API+`post/${user_id}`);
      setPostData(res.data.data);


    }catch(err){
      console.log("error get post me", err);
    }
  }

  useEffect(()=>{
    getPostMe();
  },[]);

  return (
    <div>
      {/* <div><pre>{JSON.stringify(postData,null,2)}</pre></div> */}
      โพสต์ของฉัน
      <div className="mt-3 w-full">
        <table className="table bg-base-100 w-full">
          <thead>
           <tr>
            <th>#</th>
            <th>ชื่อสถานที่</th>
            <th>รายละเอียด</th>
            <th>รูป</th>
            <th>จัดการ</th>
           </tr>
          </thead>
          <tbody>
            {postData.map((item,index)=>(
              <tr key={index}>
                <td>{index+1}</td>
                <td>{item.name_location}</td>
                <td>{item.detail_location}</td>
                <td><img src={item.images} alt="" className="w-20 h-10"/></td>
                <td><Eye size={20}/><Pencil/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Menu_Profile
