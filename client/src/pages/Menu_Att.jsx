import React, { useState } from "react";
import axios from "axios";

function Menu_Att() {
  const [formdata, setFormdata] = useState({
    name_location: "",
    detail_location: "",
    phone: "",
    detail_att: "",
    latitude: "",
    longitude: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const path = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(path);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const formDataToSend = new FormData();
    formDataToSend.append("id_user", localStorage.getItem("userId"));
    formDataToSend.append("name_location", formdata.name_location);
    formDataToSend.append("detail_location", formdata.detail_location);
    formDataToSend.append("phone", formdata.phone);
    formDataToSend.append("detail_att", formdata.detail_att);
    formDataToSend.append("latitude", formdata.latitude);
    formDataToSend.append("longitude", formdata.longitude);
    formDataToSend.append("date", formdata.date);
    if (selectedFile) {
      formDataToSend.append("image", selectedFile); // ต้องเป็น key ที่ backend รับ
    }

    const res = await axios.post(import.meta.env.VITE_API + "post", formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Response:", res.data);
  } catch (error) {
    console.error("Error submitting form:", error);
  }
};

  return (
    <div className="h-screen m-5 items-center justify-content-center overflow-y-auto">
      <form onSubmit={handleSubmit} className="">
        {/* <pre>{JSON.stringify(formdata, null, 2)}</pre> */}
        <img src={preview} alt="" style={{ width: "200px", height: "200px" }} />
        <div className="m-5">
          <div>
            <input
              type="file"
              className="file-input"
              onChange={handleImageChange}
              name="image"
            />
          </div>
          <div>
            <input
              type="text"
              className="input input-neutral mt-2"
              placeholder="ชื่อสถานที่"
              value={formdata.name_location}
              onChange={(e) =>
                setFormdata({ ...formdata, name_location: e.target.value })
              }
              required
              name="name_location"
            />
          </div>
          <div>
            <input
              type="text"
              className="input input-neutral input-xl mt-2"
              placeholder="รายระเอียดที่ตั้งสถานที่"
              value={formdata.detail_location}
              onChange={(e) =>
                setFormdata({ ...formdata, detail_location: e.target.value })
              }
              required
              name="detail_location"
            />
          </div>
          <div>
            <input
              type="tel"
              className="tabular-nums input input-neutral mt-2 "
              required
              placeholder="เบอร์โทรศัพท์"
              title="Must be 10 digits"
              value={formdata.phone}
              onChange={(e) =>
                setFormdata({ ...formdata, phone: e.target.value })
              }
              name="phone"
            />
          </div>
          <div>
            <input
              type="tel"
              className="tabular-nums input input-neutral mt-2 "
              required
              placeholder="ละติจูด"
              title="Must be 10 digits"
              value={formdata.latitude}
              onChange={(e) =>
                setFormdata({ ...formdata, latitude: e.target.value })
              }
              name="latitude"
            />
          </div>
          <div>
            <input
              type="tel"
              className="tabular-nums input input-neutral mt-2 "
              required
              placeholder="ลองจิจูด"
              title="Must be 10 digits"
              value={formdata.longitude}
              onChange={(e) =>
                setFormdata({ ...formdata, longitude: e.target.value })
              }
              name="longitude"
            />
          </div>
          <div>
            <input
              type="date"
              className="input mt-2"
              value={formdata.date}
              onChange={(e) =>
                setFormdata({ ...formdata, date: e.target.value })
              }
              name="date"
            />
          </div>
          <div>
            <textarea
              name="detail_att"
              className="textarea textarea-xl mt-2 textarea-neutral h-20 w-200"
              placeholder="รายละเอียดสถานที่"
              id=""
              required
              value={formdata.detail_att}
              onChange={(e) =>
                setFormdata({ ...formdata, detail_att: e.target.value })
              }
            ></textarea>
          </div>
        </div>
        <button className="btn btn-error">ยืนยัน</button>
      </form>
    </div>
  );
}

export default Menu_Att;
