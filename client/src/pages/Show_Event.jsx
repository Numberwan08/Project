import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2, MapPin } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function Show_Event() {
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
        import.meta.env.VITE_API + `event/${id_user}`
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
        import.meta.env.VITE_API + `event/${selectedPost.id_event}`
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

  const handleEdit = (item) => {
    setEditData({
      ...item,
      name_event: item.name_event || "",
      location_event: item.location_event || "",
      phone: item.phone || "",
      detail_event: item.detail_event || "",
      date_start: item.date_start ? item.date_start.slice(0, 10) : "",
      date_end: item.date_end ? item.date_end.slice(0, 10) : "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
      type: item.type || "",
    });
    setEditImage(null);
    setIsEdit(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditImage(e.target.files[0]);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name_event", editData.name_event);
    formData.append("location_event", editData.location_event);
    formData.append("phone", editData.phone);
    formData.append("detail_event", editData.detail_event);
    formData.append("date_start", editData.date_start);
    formData.append("date_end", editData.date_end);
    formData.append("latitude", editData.latitude);
    formData.append("longitude", editData.longitude);
    formData.append("type", editData.type);
    if (editImage) {
      formData.append("image", editImage);
    }
    try {
      await axios.patch(
        import.meta.env.VITE_API + `event/${editData.id_event}`,
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
    <div className="container mx-auto px-4 py-6">
      <ToastContainer position="top-right" />
      
      {/* Modal ลบ */}
      {isDelete && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-xl mb-2">ยืนยันการลบ</h3>
            <p className="py-4 text-gray-600">
              คุณต้องการลบกิจกรรม "{selectedPost?.name_event}" ใช่หรือไม่?
            </p>
            <div className="modal-action">
              <button
                className="btn btn-error text-white"
                onClick={handleDelete}
              >
                ลบ
              </button>
              <button className="btn btn-ghost" onClick={handleClose}>
                ยกเลิก
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal แก้ไข */}
      {isEdit && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-2xl mb-6 text-primary">แก้ไขกิจกรรม</h3>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-semibold">ชื่อกิจกรรม</span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full focus:input-primary"
                    name="name_event"
                    value={editData.name_event}
                    onChange={handleEditChange}
                    required
                  />
                </label>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-semibold">สถานที่</span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full focus:input-primary"
                    name="location_event"
                    value={editData.location_event}
                    onChange={handleEditChange}
                    required
                  />
                </label>
              </div>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-semibold">เบอร์โทร</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full focus:input-primary"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-semibold">รายละเอียดกิจกรรม</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full h-24 focus:textarea-primary"
                  name="detail_event"
                  value={editData.detail_event}
                  onChange={handleEditChange}
                  required
                ></textarea>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-semibold">วันที่เริ่ม</span>
                  </div>
                  <input
                    type="date"
                    className="input input-bordered w-full focus:input-primary"
                    name="date_start"
                    value={editData.date_start}
                    onChange={handleEditChange}
                  />
                </label>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-semibold">วันที่สิ้นสุด</span>
                  </div>
                  <input
                    type="date"
                    className="input input-bordered w-full focus:input-primary"
                    name="date_end"
                    value={editData.date_end}
                    onChange={handleEditChange}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-semibold">ละติจูด</span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full focus:input-primary"
                    name="latitude"
                    value={editData.latitude}
                    onChange={handleEditChange}
                  />
                </label>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-semibold">ลองจิจูด</span>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full focus:input-primary"
                    name="longitude"
                    value={editData.longitude}
                    onChange={handleEditChange}
                  />
                </label>
              </div>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-semibold">เปลี่ยนรูปภาพ</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full focus:file-input-primary"
                  onChange={handleEditImageChange}
                />
                {editData.images && !editImage && (
                  <div className="mt-3">
                    <img
                      src={editData.images}
                      alt="รูปภาพกิจกรรม"
                      className="w-48 h-32 object-cover border-2 rounded-lg shadow-sm"
                    />
                  </div>
                )}
                {editImage && (
                  <div className="mt-3">
                    <img
                      src={URL.createObjectURL(editImage)}
                      alt="preview"
                      className="w-48 h-32 object-cover border-2 border-primary rounded-lg shadow-sm"
                    />
                  </div>
                )}
              </label>
              <div className="modal-action mt-6">
                <button type="submit" className="btn btn-success text-white">
                  บันทึก
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
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
          <div className="modal-box w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-2xl mb-6 text-primary">รายละเอียดกิจกรรม</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">ชื่อกิจกรรม</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={selectedPost.name_event || ""}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">สถานที่</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={selectedPost.location_event || ""}
                    readOnly
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">เบอร์โทร</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={selectedPost.phone || ""}
                  readOnly
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">รายละเอียดกิจกรรม</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24 bg-base-200"
                  value={selectedPost.detail_event || ""}
                  readOnly
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">วันที่เริ่ม</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={
                      selectedPost.date_start
                        ? new Date(selectedPost.date_start).toLocaleDateString("th-TH")
                        : ""
                    }
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">วันที่สิ้นสุด</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full bg-base-200"
                    value={
                      selectedPost.date_end
                        ? new Date(selectedPost.date_end).toLocaleDateString("th-TH")
                        : ""
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">พิกัด</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={
                    selectedPost.latitude && selectedPost.longitude
                      ? `ละติจูด ${selectedPost.latitude}, ลองจิจูด ${selectedPost.longitude}`
                      : ""
                  }
                  readOnly
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">ประเภท</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={selectedPost.type || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">รูปภาพ</span>
                </label>
                <div className="flex justify-center">
                  <img
                    src={selectedPost.images}
                    alt="รูปภาพกิจกรรม"
                    className="w-full max-w-md h-64 object-cover border-2 rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
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

      <div className="bg-base-100 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-primary">กิจกรรมของฉัน</h2>
          <div className="badge badge-primary badge-lg">{postData.length} กิจกรรม</div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="text-center">#</th>
                <th>ชื่อกิจกรรม</th>
                <th>สถานที่</th>
                <th className="text-center">รูป</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {postData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    ไม่มีข้อมูลกิจกรรม
                  </td>
                </tr>
              ) : (
                postData.map((item, index) => (
                  <tr key={index} className="hover">
                    <td className="text-center font-semibold">{index + 1}</td>
                    <td className="font-medium">{item.name_event}</td>
                    <td className="text-gray-600">{item.location_event}</td>
                    <td className="text-center">
                      <div className="flex justify-center">
                        <img
                          src={item.images}
                          alt={item.name_event}
                          className="w-24 h-16 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-3 justify-center">
                        <button
                          className="btn btn-sm btn-info btn-circle"
                          onClick={() => handleViewDetail(item)}
                          title="ดูรายละเอียด"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="btn btn-sm btn-warning btn-circle"
                          onClick={() => handleEdit(item)}
                          title="แก้ไข"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="btn btn-sm btn-error btn-circle"
                          onClick={() => {
                            setIsDelete(true);
                            setSelectedPost(item);
                          }}
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Show_Event;