import React from "react";

function Menu_Att() {
  return (
    <div className="h-screen m-5 items-center justify-content-center">
     
       <div className="m-5">
        <div>
          <input type="file" className="file-input" />
        </div>
        <div>
          <input
            type="text"
            className="input input-neutral mt-2"
            placeholder="ชื่อสถานที่"
            required
          />
        </div>
        <div>
          <input
            type="text"
            className="input input-neutral input-xl mt-2"
            placeholder="รายระเอียดที่ตั้งสถานที่"
            required
          />
        </div>
        <div>
          <input
            type="tel"
            className="tabular-nums input input-neutral mt-2 "
            required
            placeholder="เบอร์โทรศัพท์"
            pattern="[0-9]*"
            minlength="10"
            maxlength="10"
            title="Must be 10 digits"
          />
        </div>
         <div>
          <input type="date" className="input mt-2" />
        </div>
        <div>
          <textarea
            name=""
            className="textarea textarea-xl mt-2 textarea-neutral h-20 w-200"
            placeholder="รายละเอียดสถานที่"
            id=""
            required
          ></textarea>
        </div>
      </div>
      <button className="btn btn-error">ยืนยัน</button>
    </div>
  );
}

export default Menu_Att;
