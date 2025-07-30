import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

function Show_Event() {
  const [selectedPost, setSelectedPost] = useState([]);
  const [postData, setPostData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const user_id = localStorage.getItem("userId");
  const getPostMe = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API + `event/${user_id}`
      );
      setPostData(res.data.data);
      console.log(res.data);
    } catch (err) {
      console.log("error get post me", err);
    }
  };

  useEffect(() => {
    getPostMe();
  }, []);

  const handleViewDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await axios.delete(
        import.meta.env.VITE_API + `event/${selectedPost.id_event}`
      );
      toast.success(res.data.msg, {
        autoClose: 1000,
      });
      getPostMe();
      setIsDelete(false);
      setSelectedPost([]);
    } catch (err) {
      console.log("error delete post", err);
      toast.success("ไม่สามารถลบโพสต์ได้");
    }
  };

  const handleClose = () => {
    setSelectedPost([]);
    setIsDelete(false);
  };

  return (
    <div>
      <ToastContainer />
      {isDelete && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold test-lg">ยืนยันการลบ</h3>
            <p className="py-4">ยืนยันการลบโพสต์:{selectedPost?.id_event}</p>
            <div className="modal-action">
              <button
                className="btn btn-error "
                onClick={() => handleDelete(selectedPost?.id_event)}
              >
                ลบ
              </button>
              <button className="btn btn-error" onClick={() => handleClose()}>
                ยกเลิก
              </button>
            </div>
          </div>
        </dialog>
      )}
      {isModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-96 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">รายละเอียดโพสต์</h3>
            <form className="form-control gap-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ชื่อสถานที่</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedPost.name_location || ""}
                  readOnly
                />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">รายละเอียดสถานที่</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={selectedPost.detail_location || ""}
                  readOnly
                ></textarea>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">เบอร์โทร</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedPost.phone || ""}
                  readOnly
                />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">รายละเอียดเพิ่มเติม</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={selectedPost.detail_att || ""}
                  readOnly
                ></textarea>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">วันที่โพสต์</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={
                    selectedPost.date
                      ? new Date(selectedPost.date).toLocaleString("th-TH", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })
                      : ""
                  }
                  readOnly
                />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">พิกัด</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={
                    selectedPost.latitude && selectedPost.longitude
                      ? `ละติจูด ${selectedPost.latitude}, ลองจิจูด ${selectedPost.longitude}`
                      : ""
                  }
                  readOnly
                />
              </label>

              <div>
                <div className="label">
                  <span className="label-text">รูปภาพ</span>
                </div>
                <img
                  src={selectedPost.images}
                  alt="รูปภาพโพสต์"
                  className="w-64 h-40 object-cover border rounded"
                />
              </div>
            </form>

            <div className="modal-action mt-4">
              <button
                className="btn btn-error text-white"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPost([]);
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </dialog>
      )}
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
            {postData.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.name_event}</td>
                <td>{item.location_event}</td>
                <td>
                  <img src={item.images} alt="" className="w-20 h-10" />
                </td>
                <td className="flex">
                  <div>
                    <Pencil
                      size={20}
                      className="cursor-pointer"
                      onClick={() => handleViewDetail(item)}
                    />
                  </div>
                  <div>
                    <Trash2
                      size={20}
                      className="cursor-pointer"
                      onClick={() => {
                        setIsDelete(true);
                        setSelectedPost(item);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Show_Event;
