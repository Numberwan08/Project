import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

function Menu_Profile() {
  const [selectedPost, setSelectedPost] = useState({});
  const [postData, setPostData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [editImage, setEditImage] = useState(null);
  const id_user = localStorage.getItem("userId");

  const getPostMe = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + `post/${id_user}`);
      setPostData(res.data.data);
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
      const res = await axios.delete(import.meta.env.VITE_API + `post/${selectedPost.id_post}`);
      toast.success(res.data.msg,{
      autoClose: 1000,
      });
      getPostMe();
      setIsDelete(false);
      setSelectedPost({});
    } catch (err) {
      console.log("error delete post", err);
      toast.success("ไม่สามารถลบโพสต์ได้");
    }
  };

  const handleClose = () => {
    setSelectedPost({});
    setIsDelete(false);
    setIsEdit(false);
    setEditData({});
    setEditImage(null);
  };

  // เปิด modal แก้ไข
  const handleEdit = (item) => {
    setEditData({
      ...item,
      name_location: item.name_location || "",
      detail_location: item.detail_location || "",
      phone: item.phone || "",
      detail_att: item.detail_att || "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
    });
    setEditImage(null);
    setIsEdit(true);
  };

  // อัปเดตค่าในฟอร์มแก้ไข
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // อัปเดตรูปภาพใหม่
  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditImage(e.target.files[0]);
    }
  };

  // ส่งข้อมูลแก้ไข
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name_location", editData.name_location);
    formData.append("detail_location", editData.detail_location);
    formData.append("phone", editData.phone);
    formData.append("detail_att", editData.detail_att);
    formData.append("latitude", editData.latitude);
    formData.append("longitude", editData.longitude);
    if (editImage) {
      formData.append("image", editImage);
    }
    try {
      await axios.patch(
        import.meta.env.VITE_API + `post/${editData.id_post}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("แก้ไขข้อมูลสำเร็จ",{
        position: "top-center",
        autoClose: 1000,
        onClose: () => window.location.reload(),
      });
      setIsEdit(false);
      setEditData({});
      setEditImage(null);
      getPostMe();
    } catch (err) {
      toast.success("ไม่สามารถแก้ไขข้อมูลได้",{
        position: "top-center",
        autoClose: 1000,
        onClose: () => window.location.reload(),
      });
    }
  };

  return (
    <div>
      <ToastContainer/>
      {/* Modal ลบ */}
      {isDelete && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold test-lg">ยืนยันการลบ</h3>
            <p className="py-4">ยืนยันการลบโพสต์:{selectedPost?.id_post}</p>
            <div className="modal-action">
              <button className="btn btn-error " onClick={handleDelete}>ลบ</button>
              <button className="btn btn-error" onClick={handleClose}>ยกเลิก</button>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal แก้ไข */}
      {isEdit && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-96 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">แก้ไขโพสต์</h3>
            <form className="form-control gap-4" onSubmit={handleEditSubmit}>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ชื่อสถานที่</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  name="name_location"
                  value={editData.name_location}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">รายละเอียดสถานที่</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  name="detail_location"
                  value={editData.detail_location}
                  onChange={handleEditChange}
                  required
                ></textarea>
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">เบอร์โทร</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">รายละเอียดเพิ่มเติม</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  name="detail_att"
                  value={editData.detail_att}
                  onChange={handleEditChange}
                ></textarea>
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ละติจูด</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  name="latitude"
                  value={editData.latitude}
                  onChange={handleEditChange}
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ลองจิจูด</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  name="longitude"
                  value={editData.longitude}
                  onChange={handleEditChange}
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">เปลี่ยนรูปภาพ</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full"
                  onChange={handleEditImageChange}
                />
                {editData.images && !editImage && (
                  <img
                    src={editData.images}
                    alt="รูปภาพโพสต์"
                    className="w-40 h-28 object-cover border rounded mt-2"
                  />
                )}
                {editImage && (
                  <img
                    src={URL.createObjectURL(editImage)}
                    alt="preview"
                    className="w-40 h-28 object-cover border rounded mt-2"
                  />
                )}
              </label>
              <div className="modal-action mt-4">
                <button type="submit" className="btn btn-success text-white">
                  บันทึก
                </button>
                <button
                  type="button"
                  className="btn btn-error text-white"
                  onClick={handleClose}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Modal ดูรายละเอียด */}
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
                  setSelectedPost({});
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </dialog>
      )}

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
                <td>{item.name_location}</td>
                <td>{item.detail_location}</td>
                <td>
                  <img src={item.images} alt="" className="w-20 h-10" />
                </td>
                <td className="flex gap-2">
                  <Pencil
                    size={20}
                    className="cursor-pointer"
                    onClick={() => handleEdit(item)}
                  />
                  <Trash2
                    size={20}
                    className="cursor-pointer"
                    onClick={() => {
                      setIsDelete(true);
                      setSelectedPost(item);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Menu_Profile;