import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User, Mail, Edit3, Save, X, Loader, Eye, EyeOff, Lock } from 'lucide-react';

function Editprofile() {
  const { userId, setName } = useAuth();
  const realtime = useRealtime?.() || null;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    Email: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    old1: false,
    old2: false,
    newpass: false,
  });
  const [passwordFields, setPasswordFields] = useState({
    oldPassword1: '',
    oldPassword2: '',
    newPassword: '',
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  // Inline edit mode like Show_Profile
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  // Products of current user (readonly display)
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;
  const [selectedProductImage, setSelectedProductImage] = useState(null);
  // Edit product overlay
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name_product: '',
    detail_product: '',
    phone: '',
    price: '',
    type: ''
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  // Followers/Following counts and list modal (like Show_Profile)
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalType, setListModalType] = useState('followers');
  const [listModalLoading, setListModalLoading] = useState(false);
  const [listModalItems, setListModalItems] = useState([]);

  const toAbs = (p) => {
    try {
      if (!p) return null;
      const norm = String(p).replace(/\\\\/g, '/');
      if (/^https?:\/\//i.test(norm)) return norm;
      let origin = '';
      try {
        const api = import.meta.env.VITE_API;
        if (api) {
          const u = new URL(api);
          origin = u.origin;
        } else if (typeof window !== 'undefined' && window.location) {
          origin = window.location.origin;
        }
      } catch (_) {}
      if (!origin) return norm;
      return `${origin}/${norm.replace(/^\/+/, '')}`;
    } catch (_) {
      return p;
    }
  };

  const formatThaiDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const d = new Date(dateString);
      return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (_) {
      return '-';
    }
  };
  const sexLabel = (sx) => {
    const v = String(sx || '').toLowerCase();
    if (v === 'm') return 'ชาย';
    if (v === 'f') return 'หญิง';
    return '-';
  };

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [imageFile]);

  const getUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `profile/${userId}`);
      const rec = res.data?.data || {};
      setData({ ...rec, image_profile: toAbs(rec.image_profile) });
      setEditData({
        first_name: rec.first_name || '',
        last_name: rec.last_name || '',
        Email: rec.Email || ''
      });
    } catch (err) {
      console.log("error get user", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);

    if (
      !passwordFields.oldPassword1 ||
      !passwordFields.oldPassword2 ||
      !passwordFields.newPassword
    ) {
      toast.error('กรุณากรอกรหัสผ่านให้ครบทุกช่อง', { position: 'top-center', autoClose: 1500 });
      setIsChangingPassword(false);
      return;
    }
    if (passwordFields.oldPassword1 !== passwordFields.oldPassword2) {
      toast.error('รหัสผ่านเก่าไม่ตรงกัน', { position: 'top-center', autoClose: 1500 });
      setIsChangingPassword(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('first_name', editData.first_name || '');
      formData.append('last_name', editData.last_name || '');
      formData.append('Email', editData.Email || '');
      formData.append('oldPassword', passwordFields.oldPassword1);
      formData.append('newPassword', passwordFields.newPassword);

      const res = await axios.patch(
        import.meta.env.VITE_API + `editprofile/${userId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setData(res.data.data || data);
      if (setName && res.data.data && res.data.data.first_name) {
        setName(res.data.data.first_name);
      }
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ', { position: 'top-center', autoClose: 1500 });
      setPasswordFields({ oldPassword1: '', oldPassword2: '', newPassword: '' });
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.log('เปลี่ยนรหัสผ่านไม่สำเร็จ', err);
      toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้', { position: 'top-center', autoClose: 1500 });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('first_name', editData.first_name || '');
      formData.append('last_name', editData.last_name || '');
      formData.append('Email', editData.Email || '');
      if (imageFile) {
        formData.append('image_profile', imageFile);
      }

      const res = await axios.patch(
        import.meta.env.VITE_API + `editprofile/${userId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setData(res.data.data || editData);
      setIsModalOpen(false);
      if (setName && res.data.data && res.data.data.first_name) {
        setName(res.data.data.first_name);
      }
      toast.success('แก้ไขโปรไฟล์สำเร็จ', { position: 'top-center', autoClose: 1500 });
      setImageFile(null);
    } catch (err) {
      console.log("แก้ไขโปไฟล์ไม่สำเร็จ", err);
      toast.error('ไม่สามารถอัปเดตได้ โปรดลองอีกครั้ง', { position: 'top-center', autoClose: 1500 });
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = () => {
    setEditData({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      Email: data.Email || ''
    });
    setIsModalOpen(true);
  };

  

  useEffect(() => {
    if (userId) {
      getUser();
    }
  }, [userId]);

  // Load my products
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        if (!userId) return;
        const pres = await axios.get(`${import.meta.env.VITE_API}product/${userId}`);
        const pdata = Array.isArray(pres.data?.data) ? pres.data.data : [];
        if (active) setProducts(pdata);
      } catch (_) {
        if (active) setProducts([]);
      }
    };
    run();
    return () => { active = false; };
  }, [userId]);

  // Pagination helpers
  const totalPages = useMemo(() => Math.max(1, Math.ceil((products?.length || 0) / PAGE_SIZE)), [products]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (products || []).slice(start, start + PAGE_SIZE);
  }, [products, page]);

  const openEdit = (p) => {
    setEditingProductId(p.id_product);
    setEditForm({
      name_product: p.name_product || '',
      detail_product: p.detail_product || '',
      phone: p.phone || '',
      price: p.price || '',
      type: p.type || ''
    });
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setEditImageFile(null);
    setEditForm({ name_product: '', detail_product: '', phone: '', price: '', type: '' });
  };

  const submitEdit = async (e, id_product) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const fd = new FormData();
      fd.append('name_product', (editForm.name_product || '').trim());
      fd.append('detail_product', editForm.detail_product || '');
      fd.append('phone', editForm.phone || '');
      fd.append('price', editForm.price || '');
      if (editForm.type !== undefined && editForm.type !== null && editForm.type !== '') {
        fd.append('type', editForm.type);
      }
      if (editImageFile) fd.append('image', editImageFile);
      await axios.patch(`${import.meta.env.VITE_API}product/${id_product}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts((prev) => prev.map((x) => x.id_product === id_product ? { ...x, ...editForm, images: editImageFile ? URL.createObjectURL(editImageFile) : x.images } : x));
      cancelEdit();
      toast.success('แก้ไขสินค้าสำเร็จ', { position: 'top-center', autoClose: 1500 });
    } catch (err) {
      console.error('edit product error', err);
      toast.error('ไม่สามารถแก้ไขสินค้าได้', { position: 'top-center', autoClose: 1500 });
    } finally {
      setEditLoading(false);
    }
  };

  const deleteProduct = async (id_product) => {
    if (!confirm('ต้องการลบสินค้านี้ใช่หรือไม่?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API}product/${id_product}`);
      setProducts((prev) => prev.filter((x) => x.id_product !== id_product));
      toast.success('ลบสินค้าสำเร็จ', { position: 'top-center', autoClose: 1500 });
    } catch (err) {
      console.error('delete product error', err);
      toast.error('ไม่สามารถลบสินค้าได้', { position: 'top-center', autoClose: 1500 });
    }
  };

  // Realtime: increment followers if someone starts following me while I'm on this page
  useEffect(() => {
    if (!realtime?.on || !realtime?.off) return;
    const handler = (payload) => {
      try {
        if (!payload) return;
        if (String(payload.target_user_id) === String(userId)) {
          setFollowersCount((c) => c + 1);
        }
      } catch {}
    };
    realtime.on('follow-new', handler);
    return () => {
      try { realtime.off('follow-new', handler); } catch {}
    };
  }, [realtime, userId]);

  // Load follower/following counts for current user
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        if (!userId) return;
        const [resFollowers, resFollowing] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API}social/followers/${userId}`),
          axios.get(`${import.meta.env.VITE_API}social/following/${userId}`),
        ]);
        const flw = Array.isArray(resFollowers?.data?.data) ? resFollowers.data.data : [];
        const flg = Array.isArray(resFollowing?.data?.data) ? resFollowing.data.data : [];
        if (active) {
          setFollowersCount(flw.length);
          setFollowingCount(flg.length);
        }
      } catch (_) {}
    };
    run();
    return () => { active = false; };
  }, [userId]);

  const openListModal = async (type) => {
    try {
      if (!userId) return;
      setListModalType(type);
      setListModalOpen(true);
      setListModalLoading(true);
      const url = type === 'followers'
        ? `${import.meta.env.VITE_API}social/followers/${userId}`
        : `${import.meta.env.VITE_API}social/following/${userId}`;
      const res = await axios.get(url);
      const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
      setListModalItems(arr.map((u) => ({
        id_user: u.id_user,
        first_name: u.first_name || 'ผู้ใช้',
        image_profile: toAbs(u.image_profile),
      })));
    } catch (_) {
      setListModalItems([]);
    } finally {
      setListModalLoading(false);
    }
  };

  const onPickProfileImage = (file) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    setImageFile(file);
    setProfileEditMode(true);
  };

  const cancelProfileEdit = () => {
    setProfileEditMode(false);
    setImageFile(null);
    setEditData({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      Email: data.Email || '',
    });
  };

  const saveProfile = async () => {
    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append('first_name', (editData.first_name || '').trim());
      formData.append('last_name', (editData.last_name || '').trim());
      formData.append('Email', (editData.Email || data?.Email || '').trim());
      if (imageFile) formData.append('image_profile', imageFile);

      const res = await axios.patch(
        import.meta.env.VITE_API + `editprofile/${userId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const updated = res?.data?.data || null;
      if (updated) {
        const up = { ...updated };
        setData({ ...up, image_profile: toAbs(up.image_profile) });
        setEditData({ first_name: up.first_name || '', last_name: up.last_name || '', Email: up.Email || '' });
        if (setName && up.first_name) setName(up.first_name);
      }
      setProfileEditMode(false);
      setImageFile(null);
      toast.success('แก้ไขโปรไฟล์สำเร็จ', { position: 'top-center', autoClose: 1500 });
    } catch (err) {
      toast.error('ไม่สามารถบันทึกโปรไฟล์ได้', { position: 'top-center', autoClose: 1500 });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header like Show_Profile */}
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-3xl shadow-xl p-8 relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

          {/* Actions */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {!profileEditMode ? (
              <button
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all text-sm flex items-center gap-2"
                onClick={() => setProfileEditMode(true)}
              >
                <Edit3 className="w-4 h-4" /> แก้ไขชื่อ/รูป
              </button>
            ) : (
              <>
                <button
                  className="px-3 py-1.5 rounded-lg bg-emerald-400/90 text-white hover:bg-emerald-400 transition-all text-sm disabled:opacity-50"
                  onClick={saveProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all text-sm"
                  onClick={cancelProfileEdit}
                  disabled={isUpdating}
                >
                  ยกเลิก
                </button>
              </>
            )}
            <button
              className="px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all text-sm flex items-center gap-2"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <Lock className="w-4 h-4" /> เปลี่ยนรหัสผ่าน
            </button>
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center text-center gap-4 z-0">
            <p className="text-purple-100 text-4xl">โปรไฟล์</p>
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/50 shadow-2xl bg-white/20 flex items-center justify-center group">
                {previewUrl || data?.image_profile ? (
                  <img
                    src={previewUrl || data.image_profile}
                    alt="avatar"
                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                    onClick={() => setSelectedProfileImage(previewUrl || data.image_profile)}
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
                <label
                  className={`absolute bottom-2 right-2 bg-black/50 text-white text-[12px] px-2 py-1 rounded cursor-pointer transition-opacity ${
                    profileEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  เปลี่ยนรูป
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickProfileImage(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            {/* Name and details */}
            <div className="space-y-1">
              {!profileEditMode ? (
                <>
                  <h2 className="text-3xl font-bold text-white">{data?.first_name || 'ผู้ใช้'}</h2>
                  {/* <p className="text-purple-100 mt-1">เพศ: {sexLabel(data?.sex)}</p> */}
                  {/* <p className="text-purple-100">วันเกิด: {formatThaiDate(data?.dob)}</p> */}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="text"
                    value={editData.first_name}
                    onChange={(e) => setEditData((f) => ({ ...f, first_name: e.target.value }))}
                    className="px-3 py-2 rounded bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="ชื่อ"
                  />
                </div>
              )}
            </div>

            {/* Follower / Following counts */}
            {/* <div className="flex items-center gap-3 text-purple-100">
              <button type="button" className="underline-offset-2 hover:underline" onClick={() => openListModal('followers')}>
                ผู้ติดตาม: {followersCount}
              </button>
              <span>•</span>
              <button type="button" className="underline-offset-2 hover:underline" onClick={() => openListModal('following')}>
                กำลังติดตาม: {followingCount}
              </button>
            </div> */}
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
                    onClick={() => setSelectedProductImage(p.images)}
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
                

                {editingProductId === p.id_product && (
                  <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm p-3 rounded-lg overflow-auto">
                    <form className="space-y-2" onSubmit={(e) => submitEdit(e, p.id_product)}>
                      <input
                        type="text"
                        className="input input-sm input-bordered w-full"
                        placeholder="ชื่อสินค้า"
                        value={editForm.name_product}
                        onChange={(e) => setEditForm({ ...editForm, name_product: e.target.value })}
                        required
                      />
                      <textarea
                        className="textarea textarea-bordered w-full"
                        rows={2}
                        placeholder="รายละเอียด"
                        value={editForm.detail_product}
                        onChange={(e) => setEditForm({ ...editForm, detail_product: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="input input-sm input-bordered w-full"
                          placeholder="โทร"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                        <input
                          type="number"
                          className="input input-sm input-bordered w-full"
                          placeholder="ราคา"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-sm file-input-bordered w-full"
                        onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                      />
                      {editImageFile && (
                        <img src={URL.createObjectURL(editImageFile)} alt="preview" className="w-full h-28 object-cover rounded" />
                      )}
                      <div className="flex gap-2 justify-end pt-1">
                        <button type="button" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={cancelEdit} disabled={editLoading}>
                          ยกเลิก
                        </button>
                        <button type="submit" className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50" disabled={editLoading}>
                          {editLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
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
        {/* Edit Modal (legacy, no longer used but kept) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">แก้ไขโปรไฟล์</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                  disabled={isUpdating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Profile Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">รูปโปรไฟล์</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {(previewUrl || data?.image_profile) ? (
                        <img
                          src={previewUrl || data.image_profile}
                          alt="รูปโปรไฟล์"
                          className="w-20 h-20 object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-gray-300 rounded-xl bg-white/50 p-2"
                    />
                  </div>
                </div>
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="กรอกชื่อ"
                  />
                </div>

                {/* ย้ายส่วนเปลี่ยนรหัสผ่านไปยังโมดอลเฉพาะ */}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isUpdating}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        บันทึก
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">เปลี่ยนรหัสผ่าน</h3>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                  disabled={isChangingPassword}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">รหัสผ่านเก่า</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type={showPassword.old1 ? 'text' : 'password'}
                      name="oldPassword1"
                      value={passwordFields.oldPassword1}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="รหัสผ่านเก่า"
                      autoComplete="current-password"
                    />
                    <button type="button" className="px-2" onClick={() => toggleShowPassword('old1')}>
                      {showPassword.old1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านเก่า</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type={showPassword.old2 ? 'text' : 'password'}
                      name="oldPassword2"
                      value={passwordFields.oldPassword2}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="ยืนยันรหัสผ่านเก่า"
                      autoComplete="current-password"
                    />
                    <button type="button" className="px-2" onClick={() => toggleShowPassword('old2')}>
                      {showPassword.old2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type={showPassword.newpass ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordFields.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="รหัสผ่านใหม่"
                      autoComplete="new-password"
                    />
                    <button type="button" className="px-2" onClick={() => toggleShowPassword('newpass')}>
                      {showPassword.newpass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    onClick={() => setIsPasswordModalOpen(false)}
                    disabled={isChangingPassword}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        บันทึก
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Followers/Following Modal */}
        {listModalOpen && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{listModalType === 'followers' ? 'ผู้ติดตาม' : 'กำลังติดตาม'}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setListModalOpen(false)} aria-label="ปิด">✕</button>
              </div>
              {listModalLoading ? (
                <div className="py-6 text-center text-gray-500">กำลังโหลด...</div>
              ) : listModalItems.length === 0 ? (
                <div className="py-6 text-center text-gray-500">ยังไม่มีรายการ</div>
              ) : (
                <div className="max-h-[60vh] overflow-auto divide-y">
                  {listModalItems.map((it) => (
                    <Link
                      key={it.id_user}
                      to={`/showprofile/${it.id_user}`}
                      className="flex items-center gap-3 py-2 hover:bg-gray-50 px-1 rounded"
                      onClick={() => setListModalOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {it.image_profile ? (
                          <img src={it.image_profile} alt={it.first_name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{it.first_name}</div>
                        {/* <div className="text-xs text-gray-500">ID: {it.id_user}</div> */}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="modal-action">
                <button className="btn" onClick={() => setListModalOpen(false)}>ปิด</button>
              </div>
            </div>
          </dialog>
        )}

        {/* Profile Image Preview Modal */}
        {selectedProfileImage && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-4xl p-0">
              <div className="flex items-center justify-center z-50 p-4" onClick={() => setSelectedProfileImage(null)}>
                <div className="relative max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                  <img src={selectedProfileImage} alt="preview" className="w-auto h-auto max-w-[50vw] max-h-[80vh] object-contain rounded-lg" />
                  <button onClick={() => setSelectedProfileImage(null)} className="absolute top-4 right-4 bg-black/30 hover:bg-black/40 text-white rounded-full p-2 transition-all duration-200" aria-label="ปิด" title="ปิด">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </dialog>
        )}


        <ToastContainer />
      </div>
      

      {/* Product Image Preview Modal */}
      {selectedProductImage && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl p-0">
            <div className="flex items-center justify-center z-50 p-4" onClick={() => setSelectedProductImage(null)}>
              <div className="relative max-w-[90vw] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                <img src={selectedProductImage} alt="preview" className="w-auto h-auto max-w-[50vw] max-h-[80vh] object-contain rounded-lg" />
                <button onClick={() => setSelectedProductImage(null)} className="absolute top-4 right-4 bg-black/30 hover:bg-black/40 text-white rounded-full p-2 transition-all duration-200" aria-label="ปิด" title="ปิด">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

export default Editprofile;
