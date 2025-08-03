import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

function Show_Product() {
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
      const res = await axios.get(
        import.meta.env.VITE_API + `product/${id_user}`
      );
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
      const res = await axios.delete(
        import.meta.env.VITE_API + `product/${selectedPost.id_product}`
      );
      toast.success(res.data.msg, {
        autoClose: 1000,
      });
      getPostMe();
      setIsDelete(false);
      setSelectedPost({});
    } catch (err) {
      console.log("error delete post", err);
      toast.error("ไม่สามารถลบโพสต์ได้");
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
      name_product: item.name_product || "",
      detail_product: item.detail_product || "",
      phone: item.phone || "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
      price: item.price || "",
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
    formData.append("name_product", editData.name_product);
    formData.append("detail_product", editData.detail_product);
    formData.append("phone", editData.phone);
    formData.append("latitude", editData.latitude);
    formData.append("longitude", editData.longitude);
    formData.append("price", editData.price);
    if (editImage) {
      formData.append("image", editImage);
    }
    try {
      await axios.patch(
        import.meta.env.VITE_API + `product/${editData.id_product}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("แก้ไขข้อมูลสำเร็จ", { autoClose: 1000 });
      setIsEdit(false);
      setEditData({});
      setEditImage(null);
      getPostMe();
    } catch (err) {
      toast.error("ไม่สามารถแก้ไขข้อมูลได้");
    }
  };

  return (
    <div>
      <ToastContainer />
      {/* Modal ลบ */}
      {isDelete && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold test-lg">ยืนยันการลบ</h3>
            <p className="py-4">ยืนยันการลบโพสต์: {selectedPost?.id_product}</p>
            <div className="modal-action">
              <button
                className="btn btn-error "
                onClick={handleDelete}
              >
                ลบ
              </button>
              <button className="btn btn-error" onClick={handleClose}>
                ยกเลิก
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal แก้ไข */}
      {isEdit && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-96 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">แก้ไขสินค้า</h3>
            <form className="form-control gap-4" onSubmit={handleEditSubmit}>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ชื่อสินค้า</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  name="name_product"
                  value={editData.name_product}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">รายละเอียดสินค้า</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  name="detail_product"
                  value={editData.detail_product}
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
                  <span className="label-text">ราคา</span>
                </div>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  name="price"
                  value={editData.price}
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
                    alt="รูปภาพสินค้า"
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
                  <span className="label-text">ชื่อสินค้า</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedPost.name_product || ""}
                  readOnly
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">รายละเอียดสินค้า</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={selectedPost.detail_product || ""}
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
                  <span className="label-text">ราคา</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedPost.price || ""}
                  readOnly
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ละติจูด</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedPost.latitude || ""}
                  readOnly
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">ลองจิจูด</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedPost.longitude || ""}
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
              <th>ชื่อสินค้า</th>
              <th>รายละเอียด</th>
              <th>รูป</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {postData.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.name_product}</td>
                <td>{item.detail_product}</td>
                <td>
                  <img src={item.images} alt="" className="w-20 h-10" />
                </td>
                <td className="flex gap-2">
                  <Pencil
                    size={20}
                    className="cursor-pointer"
                    onClick={() => handleEdit(item)}
                  />
                  <Eye
                    size={20}
                    className="cursor-pointer"
                    onClick={() => handleViewDetail(item)}
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

export default Show_Product;