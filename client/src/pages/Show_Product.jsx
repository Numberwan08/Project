import { useState, useEffect } from "react";
import axios from "axios";
import { Pencil, Trash2, Package, MapPin, Phone, DollarSign, Image as ImageIcon } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

function Show_Product() {
  const [selectedPost, setSelectedPost] = useState({});
  const [postData, setPostData] = useState([]);
  const [isDelete, setIsDelete] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [editImage, setEditImage] = useState(null);

  const id_user = localStorage.getItem("userId");

  // ======================
  // Pagination (สไตล์เดียวกับ Show_Event)
  // ======================
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [tab, setTab] = useState('pending');

  // รีเซ็ต/หนีบหน้าปัจจุบันเมื่อจำนวนข้อมูลเปลี่ยน
  useEffect(() => {
    const statusKey = (st) => {
      const s = String(st || '').trim();
      if (s === 'อนุมัติ') return 'approved';
      if (s === 'ปฎิเสธ') return 'rejected';
      return 'pending';
    };
    const filtered = (postData || []).filter((x) => {
      const k = statusKey(x?.status);
      return tab === 'pending' ? k === 'pending' : (tab === 'approved' ? k === 'approved' : k === 'rejected');
    });
    const totalPages = Math.max(1, Math.ceil((filtered.length || 0) / ITEMS_PER_PAGE));
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [postData, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPostMe = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + `product/${id_user}`);
      setPostData(res.data?.data || []);
    } catch (err) {
      console.log("error get post me", err);
      setPostData([]);
    }
  };

  useEffect(() => {
    getPostMe();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await axios.delete(
        import.meta.env.VITE_API + `product/${selectedPost.id_product}`
      );
      toast.success(res.data.msg, { autoClose: 1000 });
      setIsDelete(false);
      setSelectedPost({});
      await getPostMe();
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
      price: item.price || "",
      type: item.type || "",
      name_location: item.name_location || "",
      images: item.images || "",
    });
    setEditImage(null);
    setIsEdit(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageChange = (e) => {
    if (e.target.files && e.target.files[0]) setEditImage(e.target.files[0]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name_product", editData.name_product);
    formData.append("detail_product", editData.detail_product);
    formData.append("phone", editData.phone);
    formData.append("price", editData.price);
    formData.append("type", editData.type);
    if (editImage) formData.append("image", editImage);

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
      await getPostMe();
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
              <h1 className="text-3xl font-bold text-gray-800">สินค้า</h1>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-blue-600 font-semibold">
                สินค้าทั้งหมด: {postData.length} รายการ
              </span>
            </div>
            <div className="bg-purple-50 px-4 py-2 rounded-lg">
              {(() => {
                const statusKey = (st) => {
                  const s = String(st || '').trim();
                  if (s === 'อนุมัติ') return 'approved';
                  if (s === 'ปฎิเสธ') return 'rejected';
                  return 'pending';
                };
                const filtered = (postData || []).filter((x) => {
                  const k = statusKey(x?.status);
                  return tab === 'pending' ? k === 'pending' : (tab === 'approved' ? k === 'approved' : k === 'rejected');
                });
                return (
                  <span className="text-purple-600 font-semibold">
                    {page} / {Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))}
                  </span>
                );
              })()}
            </div>
          </div>
          {(() => {
            const statusKey = (st) => {
              const s = String(st || '').trim();
              if (s === 'อนุมัติ') return 'approved';
              if (s === 'ปฎิเสธ') return 'rejected';
              return 'pending';
            };
            const pendingCount = (postData || []).filter(x => statusKey(x?.status) === 'pending').length;
            const approvedCount = (postData || []).filter(x => statusKey(x?.status) === 'approved').length;
            const rejectedCount = (postData || []).filter(x => statusKey(x?.status) === 'rejected').length;
            return (
              <div className="mt-4 inline-flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                <button
                  className={`px-4 py-2 text-sm font-medium ${tab==='pending' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => { setTab('pending'); setPage(1); }}
                >รอดำเนินการ ({pendingCount})</button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${tab==='approved' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => { setTab('approved'); setPage(1); }}
                >อนุมัติ ({approvedCount})</button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${tab==='rejected' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => { setTab('rejected'); setPage(1); }}
                >ปฎิเสธ ({rejectedCount})</button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal ลบ */}
      {isDelete && (
        <dialog open className="modal modal-open backdrop-blur-sm">
          <div className="modal-box max-w-md bg-white rounded-2xl shadow-2xl border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Trash2 className="text-purple-600" size={24} />
              </div>
              <h3 className="font-bold text-xl text-gray-800">ยืนยันการลบ</h3>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex mb-6">
              <p className="text-gray-700">คุณต้องการลบสินค้า:</p>
              <p className="font-semibold text-purple-600 ml-1">{selectedPost?.name_product}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost hover:bg-gray-100 rounded-xl" onClick={handleClose}>
                ยกเลิก
              </button>
              <button className="btn bg-purple-600 hover:bg-purple-700 text-white border-0 rounded-xl px-6" onClick={handleDelete}>
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
              <div className="flex">
                <Pencil className="text-white" size={24} />
                <h3 className="font-bold text-white text-2xl text-gray-800">แก้ไขข้อมูลสินค้า</h3>
              </div>
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
                  <span className="label-text font-semibold text-gray-700">โพสต์</span>
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
                  className="file-input file-input-bordered w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                    </div>
                  )}
                  {editImage && (
                    <div className="relative group">
                      <img
                        src={URL.createObjectURL(editImage)}
                        alt="preview"
                        className="w-64 h-48 object-cover border-2 border-blue-500 rounded-xl shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" className="btn btn-ghost hover:bg-gray-100 rounded-xl px-6" onClick={handleClose}>
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
                  <th className="text-gray-700 font-semibold">สถานะ</th>
                  <th className="text-gray-700 font-semibold">โพสต์</th>
                  <th className="text-gray-700 font-semibold text-center">จัดการ</th>
                  <th className="text-gray-700 font-semibold text-center">ต้นโพสต์</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const statusKey = (st) => {
                    const s = String(st || '').trim();
                    if (s === 'อนุมัติ') return 'approved';
                    if (s === 'ปฎิเสธ') return 'rejected';
                    return 'pending';
                  };
                  const filtered = (postData || []).filter((x) => {
                    const k = statusKey(x?.status);
                    return tab === 'pending' ? k === 'pending' : (tab === 'approved' ? k === 'approved' : k === 'rejected');
                  });
                  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan="9" className="text-center py-10 text-gray-500">
                          ยังไม่มีสินค้าในแท็บนี้
                        </td>
                      </tr>
                    );
                  }
                  return (
                    pageItems.map((item, index) => (
                      <tr key={item.id_product ?? index} className="hover:bg-gray-50 transition-colors">
                        <td className="font-medium text-gray-600">
                          {(page - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td>
                          <div className="avatar">
                            <div className="w-16 h-16 rounded-xl ring ring-gray-200 ring-offset-2">
                              <img src={item.images} className="object-cover" />
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
                          {(() => {
                            const st = String(item.status || '').trim();
                            const cls = st === 'อนุมัติ'
                              ? 'badge badge-success'
                              : st === 'ปฎิเสธ'
                              ? 'badge badge-error'
                              : 'badge badge-warning';
                            const label = st || 'รอดำเนินการ';
                            return <div className={`${cls}`}>{label}</div>;
                          })()}
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
                              className="btn btn-sm bg-purple-500 hover:bg-purple-600 text-white border-0 rounded-lg"
                              onClick={() => {
                                setIsDelete(true);
                                setSelectedPost(item);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-center">
                            <a
                              href={`/detall_att/${item.id_post}?highlightProduct=${item.id_product}&suppressHiddenToast=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline"
                            >
                              ไปยังโพสต์
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {(() => {
            const statusKey = (st) => {
              const s = String(st || '').trim();
              if (s === 'อนุมัติ') return 'approved';
              if (s === 'ปฎิเสธ') return 'rejected';
              return 'pending';
            };
            const filtered = (postData || []).filter((x) => {
              const k = statusKey(x?.status);
              return tab === 'pending' ? k === 'pending' : (tab === 'approved' ? k === 'approved' : k === 'rejected');
            });
            if (filtered.length === 0) return null;
            return (
            <div className="flex items-center  pt-2bg-gray-50 justify-center px-4 py-3 border-t border-gray-200 flex items-center">
              <button
                className="px-3 py-1.5 text-xs rounded-lg border bg-white disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ก่อนหน้า
              </button>
              <span className="px-2">
                หน้า {page} / {Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))}
              </span>
              <button
                className="px-3 py-1.5 text-xs rounded-lg border bg-white disabled:opacity-50"
                onClick={() =>
                  setPage((p) =>
                    Math.min(Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1, p + 1)
                  )
                }
                disabled={page === Math.ceil(filtered.length / ITEMS_PER_PAGE) || filtered.length === 0}
              >
                ถัดไป
              </button>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default Show_Product;
