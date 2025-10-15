import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const toAbs = (p) => {
  try {
    if (!p) return null;
    const norm = String(p).replace(/\\/g, "/");
    if (/^https?:\/\//i.test(norm)) return norm;
    let origin = "";
    try {
      const api = import.meta.env.VITE_API;
      if (api) {
        const u = new URL(api);
        origin = u.origin; // removes '/api' or any path
      } else if (typeof window !== "undefined" && window.location) {
        origin = window.location.origin;
      }
    } catch (_) {}
    if (!origin) return norm; // fallback
    return `${origin}/${norm.replace(/^\/+/, "")}`;
  } catch (_) {
    return p;
  }
};

function Show_Profile() {
  const { id } = useParams();
  const { userId: authUserId, setName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;
  const userId = useMemo(() => {
    try {
      return authUserId || localStorage.getItem("userId");
    } catch {
      return null;
    }
  }, [authUserId]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Own-profile edit state
  const isOwner = useMemo(
    () => String(userId || "") === String(id || ""),
    [userId, id]
  );
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    Email: "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Edit product state
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name_product: "",
    detail_product: "",
    phone: "",
    price: "",
    type: "",
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Load user info (no single-user endpoint, so filter from list)
        const ures = await axios.get(`${import.meta.env.VITE_API}member`);
        const list = Array.isArray(ures.data?.rows) ? ures.data.rows : [];
        const u = list.find((x) => String(x.id_user) === String(id)) || null;
        // 2) Load products of this user
        const pres = await axios.get(
          `${import.meta.env.VITE_API}product/${id}`
        );
        const pdata = Array.isArray(pres.data?.data) ? pres.data.data : [];
        if (mounted) {
          setUser(u ? { ...u, image_profile: toAbs(u.image_profile) } : null);
          setProducts(pdata);
          if (isOwner && u) {
            setProfileForm({
              first_name: u.first_name || "",
              last_name: u.last_name || "",
              Email: u.Email || "",
            });
          }
        }
      } catch (e) {
        if (mounted) setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [id, isOwner]);

  // Reset page when products change
  useEffect(() => {
    setPage(1);
  }, [products]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((products?.length || 0) / PAGE_SIZE));
  }, [products]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (products || []).slice(start, start + PAGE_SIZE);
  }, [products, page]);

  const openEdit = (p) => {
    setEditingProductId(p.id_product);
    setEditForm({
      name_product: p.name_product || "",
      detail_product: p.detail_product || "",
      phone: p.phone || "",
      price: p.price || "",
      type: p.type || "",
    });
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setEditImageFile(null);
    setEditForm({
      name_product: "",
      detail_product: "",
      phone: "",
      price: "",
      type: "",
    });
  };

  const submitEdit = async (e, id_product) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const fd = new FormData();
      fd.append("name_product", (editForm.name_product || "").trim());
      fd.append("detail_product", editForm.detail_product || "");
      fd.append("phone", editForm.phone || "");
      fd.append("price", editForm.price || "");
      if (
        editForm.type !== undefined &&
        editForm.type !== null &&
        editForm.type !== ""
      ) {
        fd.append("type", editForm.type);
      }
      if (editImageFile) fd.append("image", editImageFile);
      await axios.patch(
        `${import.meta.env.VITE_API}product/${id_product}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      // update local state
      setProducts((prev) =>
        prev.map((x) =>
          x.id_product === id_product
            ? {
                ...x,
                ...editForm,
                images: editImageFile
                  ? URL.createObjectURL(editImageFile)
                  : x.images,
              }
            : x
        )
      );
      cancelEdit();
      alert("แก้ไขสินค้าสำเร็จ");
    } catch (err) {
      console.error("edit product error", err);
      alert("ไม่สามารถแก้ไขสินค้าได้");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteProduct = async (id_product) => {
    if (!confirm("ต้องการลบสินค้านี้ใช่หรือไม่?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API}product/${id_product}`);
      setProducts((prev) => prev.filter((x) => x.id_product !== id_product));
      alert("ลบสินค้าสำเร็จ");
    } catch (err) {
      console.error("delete product error", err);
      alert("ไม่สามารถลบสินค้าได้");
    }
  };

  // Profile edit helpers
  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  const onPickProfileImage = (file) => {
    if (!file) {
      setProfileImageFile(null);
      setProfilePreviewUrl(null);
      return;
    }
    setProfileImageFile(file);
    const url = URL.createObjectURL(file);
    setProfilePreviewUrl(url);
    setProfileEditMode(true);
  };

  const cancelProfileEdit = () => {
    setProfileEditMode(false);
    setProfileImageFile(null);
    if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    setProfilePreviewUrl(null);
    if (user) {
      setProfileForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        Email: user.Email || "",
      });
    }
  };

  const saveProfile = async () => {
    try {
      setProfileSaving(true);
      const fd = new FormData();
      fd.append("first_name", (profileForm.first_name || "").trim());
      fd.append("last_name", (profileForm.last_name || "").trim());
      fd.append("Email", (profileForm.Email || user?.Email || "").trim());
      if (profileImageFile) fd.append("image_profile", profileImageFile);
      const res = await axios.patch(
        `${import.meta.env.VITE_API}editprofile/${userId}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updated = res?.data?.data || null;
      if (updated) {
        const up = { ...updated };
        setUser(up);
        setProfileForm({
          first_name: up.first_name || "",
          last_name: up.last_name || "",
          Email: up.Email || "",
        });
        if (setName && up.first_name) setName(up.first_name);
      }
      setProfileEditMode(false);
      setProfileImageFile(null);
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
      setProfilePreviewUrl(null);
      alert("บันทึกโปรไฟล์สำเร็จ");
    } catch (err) {
      console.error("save profile error", err);
      alert("ไม่สามารถบันทึกโปรไฟล์ได้");
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-3xl shadow-xl p-8 relative overflow-hidden">
        {/* overlay เบา ๆ */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

        {/* Action (ขวาบน) */}
        <div className="absolute top-4 right-4 z-10">
          {isOwner && (
            <>
              {!profileEditMode ? (
                <button
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all text-sm"
                  onClick={() => setProfileEditMode(true)}
                >
                  แก้ไขชื่อ/รูป
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-emerald-400/90 text-white hover:bg-emerald-400 transition-all text-sm disabled:opacity-50"
                    onClick={saveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all text-sm"
                    onClick={cancelProfileEdit}
                    disabled={profileSaving}
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* เนื้อหา */}
        <div className="relative flex flex-col items-center text-center gap-4 z-0">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/50 shadow-2xl bg-white/20 flex items-center justify-center group">
              {profilePreviewUrl || user?.image_profile ? (
                <img
                  src={profilePreviewUrl || user.image_profile}
                  alt="avatar"
                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                  onClick={() =>
                    setSelectedImage(profilePreviewUrl || user.image_profile)
                  }
                />
              ) : (
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}

              {/* เปลี่ยนรูป: โชว์เมื่อ hover หรืออยู่โหมดแก้ไข */}
              {isOwner && (
                <label
                  className={`absolute bottom-2 right-2 bg-black/50 text-white text-[12px] px-2 py-1 rounded cursor-pointer transition-opacity
              ${
                profileEditMode
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
                >
                  เปลี่ยนรูป
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      onPickProfileImage(e.target.files?.[0] || null)
                    }
                  />
                </label>
              )}
            </div>
          </div>

          {/* ชื่อ/บทบาท */}
          <div className="space-y-1">
            {!profileEditMode ? (
              <>
                <h2 className="text-3xl font-bold text-white">
                  {user?.first_name || "ผู้ใช้"} {user?.last_name || ""}
                </h2>
                <p className="text-purple-100">สมาชิก</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      first_name: e.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="ชื่อ"
                />
                {/* ถ้าจะเปิดนามสกุลภายหลัง ค่อยปลดคอมเมนต์บล็อกนี้ */}
                {/* <input
            type="text"
            value={profileForm.last_name}
            onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
            className="px-3 py-2 rounded bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="นามสกุล"
          /> */}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-100 rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">สินค้าทั้งหมด</h3>
          <span className="text-sm text-gray-500">
            {products.length} รายการ
          </span>
        </div>

        {products.length === 0 ? (
          <p className="text-gray-500">ผู้ใช้นี้ยังไม่มีสินค้า</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((p) => (
              <div
                key={p.id_product}
                className="relative bg-gray-50 rounded-lg p-4 hover:shadow transition"
              >
                <div className="relative mb-3">
                  <img
                    src={p.images}
                    alt={p.name_product}
                    className="w-full h-36 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(p.images)}
                  />
                </div>

                {/* Info */}
                <h4 className="font-semibold text-gray-800 line-clamp-1">
                  {p.name_product}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {p.detail_product}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-purple-700 font-semibold">
                    ฿{p.price}
                  </span>
                  {p.id_post ? (
                    <a
                      href={`/detall_att/${p.id_post}?highlightProduct=${p.id_product}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                      title="เปิดโพสต์ต้นทางและไฮไลต์สินค้านี้"
                    >
                      ดูในโพสต์
                    </a>
                  ) : (
                    <a
                      href={`/detall_product/${p.id_product}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                      title="เปิดรายละเอียดสินค้า"
                    >
                      ดูสินค้า
                    </a>
                  )}
                </div>
                {String(p.id_user) === String(userId) && (
                  <div className="absolute right-4 flex  items-center justify-end gap-3 z-10">
                    <button
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => openEdit(p)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="text-red-600 hover:underline text-sm"
                      onClick={() => deleteProduct(p.id_product)}
                    >
                      ลบ
                    </button>
                  </div>
                )}
                {/* Phone */}
                {p.phone && (
                  <div className="mt-1 text-sm flex justify-between items-center">
                    <a
                      href={`tel:${p.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      📞 {p.phone}
                    </a>
                  </div>
                )}

                {editingProductId === p.id_product && (
                  <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm p-3 rounded-lg overflow-auto">
                    <form
                      className="space-y-2"
                      onSubmit={(e) => submitEdit(e, p.id_product)}
                    >
                      <input
                        type="text"
                        className="input input-sm input-bordered w-full"
                        placeholder="ชื่อสินค้า"
                        value={editForm.name_product}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name_product: e.target.value,
                          })
                        }
                        required
                      />
                      <textarea
                        className="textarea textarea-bordered w-full"
                        rows={2}
                        placeholder="รายละเอียด"
                        value={editForm.detail_product}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            detail_product: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="input input-sm input-bordered w-full"
                          placeholder="โทร"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                        />
                        <input
                          type="number"
                          className="input input-sm input-bordered w-full"
                          placeholder="ราคา"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({ ...editForm, price: e.target.value })
                          }
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-sm file-input-bordered w-full"
                        onChange={(e) =>
                          setEditImageFile(e.target.files?.[0] || null)
                        }
                      />
                      {editImageFile && (
                        <img
                          src={URL.createObjectURL(editImageFile)}
                          alt="preview"
                          className="w-full h-28 object-cover rounded"
                        />
                      )}
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          onClick={cancelEdit}
                          disabled={editLoading}
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
                          disabled={editLoading}
                        >
                          {editLoading ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {products.length > PAGE_SIZE && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ก่อนหน้า
            </button>
            <span className="px-2 py-1">
              หน้า {page} / {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl p-0">
            <div
              className="flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div
                className="relative max-w-[90vw] max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt="preview"
                  className="w-auto h-auto max-w-[50vw] max-h-[80vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-black/30 hover:bg-black/40 text-white rounded-full p-2 transition-all duration-200"
                  aria-label="ปิด"
                  title="ปิด"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default Show_Profile;
