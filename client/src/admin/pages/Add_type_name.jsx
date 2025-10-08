import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Plus, Edit2, Trash2 } from "lucide-react";

function Add_type_name() {
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [types, setTypes] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editTypeName, setEditTypeName] = useState("");

  // Create new type
  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      const res = await axios.post(import.meta.env.VITE_API + "post/type", {
        name_type: newTypeName,
      });
      toast.success("เพิ่มประเภทสำเร็จ", {
        position: "top-center",
        autoClose: 1500,
      });
      setNewTypeName("");
      setShowTypeForm(false);
      await fetchTypes();
    } catch (err) {
      toast.error("ไม่สามารถเพิ่มประเภทได้", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // Fetch types
  const fetchTypes = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API + "post/types");
      setTypes(res.data.data || []);
    } catch (err) {
      setTypes([]);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Open edit modal
  const openEdit = (typeItem) => {
    setEditingType(typeItem);
    setEditTypeName(typeItem?.name_type || "");
    setShowEditForm(true);
  };

  // Update a type
  const handleUpdateType = async (e) => {
    e.preventDefault();
    if (!editingType) return;
    if (!editTypeName.trim()) return;
    try {
      await axios.patch(
        import.meta.env.VITE_API + `post/type/${editingType.id_type}`,
        { name_type: editTypeName }
      );
      toast.success("อัปเดตประเภทสำเร็จ", {
        position: "top-center",
        autoClose: 1200,
      });
      setShowEditForm(false);
      setEditingType(null);
      setEditTypeName("");
      await fetchTypes();
    } catch (err) {
      toast.error("อัปเดตประเภทไม่สำเร็จ", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // Delete a type
  const handleDeleteType = async (typeItem) => {
    if (!typeItem) return;
    if (!window.confirm(`ยืนยันการลบประเภท "${typeItem.name_type}" ?`)) return;
    try {
      await axios.delete(
        import.meta.env.VITE_API + `post/type/${typeItem.id_type}`
      );
      toast.success("ลบประเภทสำเร็จ", {
        position: "top-center",
        autoClose: 1200,
      });
      await fetchTypes();
    } catch (err) {
      const msg = err?.response?.data?.msg || "ลบประเภทไม่สำเร็จ";
      toast.error(msg, { position: "top-center", autoClose: 2000 });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-6">
      <ToastContainer />

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-purple-900">
                จัดการประเภทสถานที่
              </h2>
              <p className="text-purple-600 mt-1">
                เพิ่ม แก้ไข และลบประเภทสถานที่ต่างๆ
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTypeForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              เพิ่มประเภท
            </button>
          </div>
        </div>

        {/* Types Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">ลำดับ</th>
                  <th className="text-left py-4 px-6 font-semibold">ID</th>
                  <th className="text-left py-4 px-6 font-semibold">
                    ชื่อประเภท
                  </th>
                  <th className="text-right py-4 px-6 font-semibold">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                          <Plus className="h-8 w-8 text-purple-400" />
                        </div>
                        <p className="text-gray-500 text-lg">
                          ไม่พบรายการประเภท
                        </p>
                        <p className="text-gray-400 text-sm">
                          เริ่มต้นโดยการเพิ่มประเภทใหม่
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  types.map((t, index) => (
                    <tr
                      key={t.id_type}
                      className="border-b border-purple-50 hover:bg-purple-50 transition-colors duration-150"
                    >
                      <td className="py-4 px-9">{index+1}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-semibold">
                          {t.id_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-800 font-medium">
                          {t.name_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors duration-150 font-medium"
                            onClick={() => openEdit(t)}
                          >
                            <Edit2 className="h-4 w-4" />
                            แก้ไข
                          </button>
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-150 font-medium"
                            onClick={() => handleDeleteType(t)}
                          >
                            <Trash2 className="h-4 w-4" />
                            ลบ
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

      {/* Create Type Modal */}
      {showTypeForm && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md w-full p-0 overflow-hidden rounded-2xl shadow-2xl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-2xl p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">เพิ่มประเภทสถานที่</h3>
                  <button
                    onClick={() => setShowTypeForm(false)}
                    className="p-2 hover:bg-purple-500 rounded-lg transition-colors duration-150"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateType} className="p-6">
                <div className="mb-6">
                  <label className="block text-purple-900 font-semibold mb-2">
                    ชื่อประเภท
                  </label>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors duration-150"
                    placeholder="กรอกชื่อประเภท..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTypeForm(false)}
                    className="px-6 py-2.5 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors duration-150 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-150 font-medium"
                  >
                    เพิ่มประเภท
                  </button>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}

      {/* Edit Type Modal */}
      {showEditForm && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md w-full p-0 overflow-hidden rounded-2xl shadow-2xl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-2xl p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">แก้ไขประเภท</h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="p-2 hover:bg-purple-500 rounded-lg transition-colors duration-150"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleUpdateType} className="p-6">
                <div className="mb-6">
                  <label className="block text-purple-900 font-semibold mb-2">
                    ชื่อประเภท
                  </label>
                  <input
                    type="text"
                    value={editTypeName}
                    onChange={(e) => setEditTypeName(e.target.value)}
                    className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors duration-150"
                    placeholder="กรอกชื่อประเภท..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-6 py-2.5 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors duration-150 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-150 font-medium"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default Add_type_name;
