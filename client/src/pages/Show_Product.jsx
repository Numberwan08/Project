import { useState, useEffect } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2, Package, MapPin, Phone, DollarSign, Image as ImageIcon } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <ToastContainer />
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
              <Package className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">จัดการสินค้า</h1>
              <p className="text-gray-500 mt-1">ระบบจัดการและแก้ไขข้อมูลสินค้าของคุณ</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-blue-600 font-semibold">สินค้าทั้งหมด: {postData.length} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ลบ */}
      {isDelete && (
        <dialog open className="modal modal-open backdrop-blur-sm">
          <div className="modal-box max-w-md bg-white rounded-2xl shadow-2xl border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="font-bold text-xl text-gray-800">ยืนยันการลบ</h3>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex mb-6">
              <p className="text-gray-700">คุณต้องการลบสินค้า:</p>
              <p className="font-semibold text-red-600 ml-1">{selectedPost?.name_product}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="btn btn-ghost hover:bg-gray-100 rounded-xl"
                onClick={handleClose}
              >
                ยกเลิก
              </button>
              <button
                className="btn bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl px-6"
                onClick={handleDelete}
              >
                ลบสินค้า
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal แก้ไข */}
      {isEdit && (
        <dialog open className="modal modal-open backdrop-blur-sm">
          <div className="modal-box w-full max-w-3xl bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
            
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl mb-2">
                <div className="flex"><Pencil className="text-white" size={24} />
                <h3 className="font-bold text-white text-2xl text-gray-800">แก้ไขข้อมูลสินค้า</h3></div>
              </div>
              
            <form className="space-y-5" onSubmit={handleEditSubmit}>
              {/* ชื่อสินค้า */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                    <Package size={16} />
                    ชื่อสินค้า
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="name_product"
                  value={editData.name_product}
                  onChange={handleEditChange}
                  required
                />
              </div>

              {/* รายละเอียดสินค้า */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">รายละเอียดสินค้า</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="detail_product"
                  value={editData.detail_product}
                  onChange={handleEditChange}
                  required
                ></textarea>
              </div>

              {/* Grid Layout สำหรับข้อมูลเพิ่มเติม */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* เบอร์โทร */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                      <Phone size={16} />
                      เบอร์โทร
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="phone"
                    value={editData.phone}
                    onChange={handleEditChange}
                  />
                </div>

                {/* ราคา */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                      <DollarSign size={16} />
                      ราคา
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="price"
                    value={editData.price}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              {/* โพสต์สถานที่ */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">โพสต์สถานที่</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-xl bg-gray-50"
                  name="name_location"
                  value={editData.name_location || ""}
                  readOnly
                />
              </div>

              {/* รูปภาพ */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                    <ImageIcon size={16} />
                    เปลี่ยนรูปภาพ
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleEditImageChange}
                />
                <div className="mt-4 flex justify-center">
                  {editData.images && !editImage && (
                    <div className="relative group">
                      <img
                        src={editData.images}
                        alt="รูปภาพสินค้า"
                        className="w-64 h-48 object-cover border-2 border-gray-200 rounded-xl shadow-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-xl"></div>
                    </div>
                  )}
                  {editImage && (
                    <div className="relative group">
                      <img
                        src={URL.createObjectURL(editImage)}
                        alt="preview"
                        className="w-64 h-48 object-cover border-2 border-blue-500 rounded-xl shadow-lg"
                      />
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                        รูปใหม่
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  className="btn btn-ghost hover:bg-gray-100 rounded-xl px-6"
                  onClick={handleClose}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl px-8"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Table Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="text-gray-700 font-semibold">#</th>
                  <th className="text-gray-700 font-semibold">รูปภาพ</th>
                  <th className="text-gray-700 font-semibold">ชื่อสินค้า</th>
                  <th className="text-gray-700 font-semibold">รายละเอียด</th>
                  <th className="text-gray-700 font-semibold">ราคา</th>
                  <th className="text-gray-700 font-semibold">สถานที่</th>
                  <th className="text-gray-700 font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {postData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="font-medium text-gray-600">{index + 1}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-xl ring ring-gray-200 ring-offset-2">
                          <img src={item.images}  className="object-cover" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-800">{item.name_product}</div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {item.detail_product}
                      </div>
                    </td>
                    <td>
                      {item.price && (
                        <div className="badge badge-success text-white gap-1">
                          <DollarSign size={14} />
                          {Number(item.price).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={14} className="text-purple-500" />
                        {item.name_location}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-center">
                        <button
                          className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-0 rounded-lg"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0 rounded-lg"
                          onClick={() => {
                            setIsDelete(true);
                            setSelectedPost(item);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {postData.length === 0 && (
            <div className="text-center py-16">
              <Package size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">ยังไม่มีสินค้าในระบบ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Show_Product;