import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await axios.patch(
        import.meta.env.VITE_API + `editprofile/${userId}`,
        editData
      );
      setData(res.data.data || editData);
      setIsModalOpen(false);
      if (setName && res.data.data && res.data.data.first_name) {
        setName(res.data.data.first_name);
      }
      toast.success('แก้ไขโปรไฟล์สำเร็จ', { position: 'top-right', autoClose: 500 });
    } catch (err) {
      console.log("แก้ไขโปไฟล์ไม่สำเร็จ", err);
      toast.error('ไม่สามารถอัปเดตได้ โปรดลองอีกครั้ง', { position: 'top-right', autoClose: 500 });
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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-2">โปรไฟล์</h1>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">ชื่อ</span>
                </label>
                <div className="input input-bordered bg-base-200 flex items-center">
                  {data.first_name || 'Not provided'}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">นายสกุล</span>
                </label>
                <div className="input input-bordered bg-base-200 flex items-center">
                  {data.last_name || 'Not provided'}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <div className="input input-bordered bg-base-200 flex items-center">
                  {data.Email || 'Not provided'}
                </div>
              </div>
            </div>
            <div className="card-actions justify-end mt-6">
              <button 
                className="btn btn-primary"
                onClick={openModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                แก้ไขโปรไฟล์
              </button>
            </div>
          </div>
        </div>
        {/* Edit Modal */}
        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">แก้ไข โปรไฟล์</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">ชื่อ</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editData.first_name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">นามสกุล</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={editData.last_name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={editData.Email}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isUpdating}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Updating...
                      </>
                    ) : (
                      'บันทึกการเปลี่ยนแปลง'
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div 
              className="modal-backdrop"
              onClick={() => setIsModalOpen(false)}
            ></div>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
}

export default Editprofile;