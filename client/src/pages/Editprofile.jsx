import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User, Mail, Edit3, Save, X, Loader, Eye, EyeOff, Lock } from 'lucide-react';

function Editprofile() {
  const { userId, setName } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    Email: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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

  const getUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(import.meta.env.VITE_API + `profile/${userId}`);
      setData(res.data.data);
      setEditData({
        first_name: res.data.data.first_name || '',
        last_name: res.data.data.last_name || '',
        Email: res.data.data.Email || ''
      });
    } catch (err) {
      console.log("error get user", err);
    } finally {
      setLoading(false);
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

    // ถ้ามีการกรอกรหัสผ่านใหม่ ต้องตรวจสอบรหัสผ่านเก่า
    if (
      passwordFields.oldPassword1 ||
      passwordFields.oldPassword2 ||
      passwordFields.newPassword
    ) {
      if (
        !passwordFields.oldPassword1 ||
        !passwordFields.oldPassword2 ||
        !passwordFields.newPassword
      ) {
        toast.error('กรุณากรอกรหัสผ่านให้ครบทุกช่อง', { position: 'top-center', autoClose: 1500 });
        setIsUpdating(false);
        return;
      }
      if (passwordFields.oldPassword1 !== passwordFields.oldPassword2) {
        toast.error('รหัสผ่านเก่าไม่ตรงกัน', { position: 'top-center', autoClose: 1500 });
        setIsUpdating(false);
        return;
      }
    }

    try {
      const payload = {
        ...editData,
      };
      // ถ้ามีการเปลี่ยนรหัสผ่าน ให้ส่งข้อมูลรหัสผ่านไปด้วย
      if (passwordFields.oldPassword1 && passwordFields.oldPassword2 && passwordFields.newPassword) {
        payload.oldPassword = passwordFields.oldPassword1;
        payload.newPassword = passwordFields.newPassword;
      }

      const res = await axios.patch(
        import.meta.env.VITE_API + `editprofile/${userId}`,
        payload
      );
      setData(res.data.data || editData);
      setIsModalOpen(false);
      if (setName && res.data.data && res.data.data.first_name) {
        setName(res.data.data.first_name);
      }
      toast.success('แก้ไขโปรไฟล์สำเร็จ', { position: 'top-center', autoClose: 1500 });
      setPasswordFields({ oldPassword1: '', oldPassword2: '', newPassword: '' });
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
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">โปรไฟล์</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {data.first_name} 
                </h2>
                <p className="text-purple-100 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {data.Email || 'ไม่ได้ระบุอีเมล'}
                </p>
              </div>
              <button 
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                onClick={openModal}
              >
                <Edit3 className="w-4 h-4" />
                แก้ไข
              </button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
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

                {/* Change Password Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    เปลี่ยนรหัสผ่าน
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showPassword.old1 ? "text" : "password"}
                      name="oldPassword1"
                      value={passwordFields.oldPassword1}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="รหัสผ่านเก่า"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="px-2"
                      onClick={() => toggleShowPassword("old1")}
                    >
                      {showPassword.old1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type={showPassword.old2 ? "text" : "password"}
                      name="oldPassword2"
                      value={passwordFields.oldPassword2}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="ยืนยันรหัสผ่านเก่า"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="px-2"
                      onClick={() => toggleShowPassword("old2")}
                    >
                      {showPassword.old2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type={showPassword.newpass ? "text" : "password"}
                      name="newPassword"
                      value={passwordFields.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="รหัสผ่านใหม่"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="px-2"
                      onClick={() => toggleShowPassword("newpass")}
                    >
                      {showPassword.newpass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

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

        <ToastContainer />
      </div>
    </div>
  );
}

export default Editprofile;