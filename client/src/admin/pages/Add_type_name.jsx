import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  X,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Add_type_name() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // create/edit modal states
  const [showCreate, setShowCreate] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [creating, setCreating] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [updating, setUpdating] = useState(false);

  const API = import.meta.env.VITE_API;

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API + "post/types");
      setTypes(res.data?.data || []);
    } catch (err) {
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return types;
    return types.filter(
      (t) =>
        (t.name_type || "").toLowerCase().includes(q) ||
        String(t.id_type).includes(q)
    );
  }, [types, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const handlePrev = () => setPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setPage((p) => Math.min(p + 1, totalPages));

  // create
  const openCreate = () => {
    setNewTypeName("");
    setShowCreate(true);
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      setCreating(true);
      await axios.post(API + "post/type", { name_type: newTypeName.trim() });
      toast.success("เพิ่มประเภทสำเร็จ", {
        autoClose: 1200,
        position: "top-center",
      });
      setShowCreate(false);
      await fetchTypes();
    } catch {
      toast.error("ไม่สามารถเพิ่มประเภทได้", {
        autoClose: 1600,
        position: "top-center",
      });
    } finally {
      setCreating(false);
    }
  };

  // edit
  const openEdit = (item) => {
    setEditingType(item);
    setEditTypeName(item?.name_type || "");
    setShowEdit(true);
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingType || !editTypeName.trim()) return;
    try {
      setUpdating(true);
      await axios.patch(API + `post/type/${editingType.id_type}`, {
        name_type: editTypeName.trim(),
      });
      toast.success("อัปเดตประเภทสำเร็จ", {
        autoClose: 1200,
        position: "top-center",
      });
      setShowEdit(false);
      setEditingType(null);
      setEditTypeName("");
      await fetchTypes();
    } catch {
      toast.error("อัปเดตประเภทไม่สำเร็จ", {
        autoClose: 1600,
        position: "top-center",
      });
    } finally {
      setUpdating(false);
    }
  };

  // delete (คงสไตล์ confirm แบบตัวอย่างสินค้าให้ “ประมาณนี้”)
  const handleDelete = async (typeItem) => {
    if (!typeItem) return;
    if (!window.confirm(`ยืนยันการลบประเภท "${typeItem.name_type}" ?`)) return;
    console.log("delete type id => ", typeItem.id_type);
    try {
      await axios.delete(API + `post/type/${typeItem.id_type}`);
      toast.success("ลบประเภทสำเร็จ", {
        autoClose: 900,
        position: "top-center",
      });
      await fetchTypes();
    } catch (err) {
      const msg = err?.response?.data?.msg || "ลบประเภทไม่สำเร็จ";
      toast.error(msg, { autoClose: 1400, position: "top-center" });
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex">
            <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
            จัดการประเภทสถานที่
          </h1>
          <p className="text-sm text-gray-600">
            เพิ่ม แก้ไข และลบประเภทสถานที่ของคุณ
          </p>
          </div>
          <div className="mt-5 ml-3">
            <button
              type="button"
              onClick={openCreate}
              className="btn btn-primary mt-2 flex items-center gap-2"
            >
              <Plus className="h-5 w-5 "  />
              เพิ่มประเภท
            </button>
          </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="w-[10%] px-4 py-3 text-center font-medium text-sm">
                    ลำดับ
                  </th>
                 
                  <th className="w-[45%] px-4 py-3 text-left font-medium text-sm">
                    ชื่อประเภท
                  </th>
                  <th className="w-[30%]">จำนวนสถายที่ท่องเที่ยว</th>
                  <th className="w-[25%] px-4 py-3 text-center font-medium text-sm">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12">
                      <div className="flex items-center justify-center gap-2 text-purple-700">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">กำลังโหลดรายการ…</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Package className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">
                          {search
                            ? "ไม่พบประเภทตามคำค้นหา"
                            : "ไม่พบข้อมูลประเภท"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr
                      key={item.id_type}
                      className="hover:bg-purple-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-center text-gray-700 font-medium text-sm">
                        {(page - 1) * itemsPerPage + idx + 1}
                      </td>
                    
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.name_type}
                        </div>
                      </td>
                      <td>
                        {item.count_location}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {filtered.length > 0 ? (
                  <>
                    แสดงรายการที่ {(page - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(page * itemsPerPage, filtered.length)} จากทั้งหมด{" "}
                    {filtered.length} รายการ
                  </>
                ) : (
                  <>ไม่มีรายการ</>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  ก่อนหน้า
                </button>
                <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium shadow-sm text-xs">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages || filtered.length === 0}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                >
                  ถัดไป
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="เพิ่มประเภทสถานที่"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <Field label="ชื่อประเภท" htmlFor="newType">
            <input
              id="newType"
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="กรอกชื่อประเภท…"
              autoFocus
              className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition"
              disabled={creating}
              required
            />
          </Field>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              disabled={creating}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg disabled:opacity-60 inline-flex items-center gap-2"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              เพิ่มประเภท
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="แก้ไขประเภท"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
          <Field label="ชื่อประเภท" htmlFor="editType">
            <input
              id="editType"
              type="text"
              value={editTypeName}
              onChange={(e) => setEditTypeName(e.target.value)}
              placeholder="กรอกชื่อประเภท…"
              autoFocus
              className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition"
              disabled={updating}
              required
            />
          </Field>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              disabled={updating}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg disabled:opacity-60 inline-flex items-center gap-2"
            >
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึก
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ---------- Small UI primitives ---------- */
function Field({ label, htmlFor, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Modal({ open, onClose, title, children }) {
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={ref}
          className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-white"
        >
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Add_type_name;
