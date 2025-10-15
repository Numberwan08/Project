import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Plus,
  X,
  Edit,
  FileText,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EventControllers() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Add modal & form state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formdata, setFormdata] = useState({
    name_event: "",
    location_event: "",
    phone: "",
    detail_event: "",
    date_start: "",
    date_end: "",
    latitude: "",
    longitude: "",
    type: "2",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Map state (Leaflet) for picking coordinates
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);
  const markerRef = useRef(null);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    id_event: "",
    name_event: "",
    location_event: "",
    phone: "",
    detail_event: "",
    date_start: "",
    date_end: "",
    latitude: "",
    longitude: "",
    type: "2",
  });
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  // Edit map state
  const [showEditMap, setShowEditMap] = useState(false);
  const [editMap, setEditMap] = useState(null);
  const editMarkerRef = useRef(null);

  // ===== Utils =====
  const ensureIsoOrEmpty = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  };
  const validateDates = (start, end) => {
    if (!start || !end) return true;
    return new Date(end) >= new Date(start);
  };

  // โหลดข้อมูลกิจกรรมทั้งหมด
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    axios
      .get(import.meta.env.VITE_API + "event")
      .then((res) => setEvents(res.data.data || []))
      .catch(() => setEvents([]));
  };

  const openAddModal = () => {
    setFormdata({
      name_event: "",
      location_event: "",
      phone: "",
      detail_event: "",
      date_start: "",
      date_end: "",
      latitude: "",
      longitude: "",
      type: "2",
    });
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setShowMap(false);
    setShowModal(true);
  };

  // ===== Image Handlers (Add) =====
  useEffect(() => {
    // cleanup preview on unmount
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (editPreview && editPreview.startsWith("blob:"))
        URL.revokeObjectURL(editPreview);
    };
  }, [editPreview]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOW = ["image/jpeg", "image/png", "image/webp"];
    const MAX = 5 * 1024 * 1024;
    if (!ALLOW.includes(file.type)) {
      toast.error("รองรับเฉพาะ JPG/PNG/WebP", { position: "top-center" });
      e.currentTarget.value = "";
      return;
    }
    if (file.size > MAX) {
      toast.error("ไฟล์ใหญ่เกิน 5MB", { position: "top-center" });
      e.currentTarget.value = "";
      return;
    }
    setSelectedFile(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOW = ["image/jpeg", "image/png", "image/webp"];
    const MAX = 5 * 1024 * 1024;
    if (!ALLOW.includes(file.type)) {
      toast.error("รองรับเฉพาะ JPG/PNG/WebP", { position: "top-center" });
      e.currentTarget.value = "";
      return;
    }
    if (file.size > MAX) {
      toast.error("ไฟล์ใหญ่เกิน 5MB", { position: "top-center" });
      e.currentTarget.value = "";
      return;
    }
    setEditFile(file);
    setEditPreview((old) => {
      if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      toast.error("กรุณาเข้าสู่ระบบแอดมินก่อน", { position: "top-center" });
      return;
    }
    if (!formdata.name_event || !formdata.location_event) {
      toast.error("กรุณากรอกชื่อกิจกรรมและสถานที่", {
        position: "top-center",
        autoClose: 1200,
      });
      return;
    }
    if (!validateDates(formdata.date_start, formdata.date_end)) {
      toast.error("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม", {
        position: "top-center",
      });
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("name_event", formdata.name_event.trim());
      fd.append("location_event", formdata.location_event.trim());
      fd.append("phone", formdata.phone.trim());
      fd.append("detail_event", formdata.detail_event.trim());
      // ปรับเป็น ISO (ถ้า backend ไม่ต้องการ ให้เปลี่ยนกลับเป็นค่าเดิม)
      fd.append("date_start", ensureIsoOrEmpty(formdata.date_start));
      fd.append("date_end", ensureIsoOrEmpty(formdata.date_end));
      fd.append("latitude", formdata.latitude);
      fd.append("longitude", formdata.longitude);
      fd.append("type", formdata.type || "2");
      if (selectedFile) fd.append("image", selectedFile);

      await axios.post(import.meta.env.VITE_API + "event", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      toast.success("เพิ่มกิจกรรมสำเร็จ", {
        position: "top-center",
        autoClose: 1000,
      });
      resetAddForm();
      fetchEvents();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("สิทธิ์ไม่ถูกต้อง กรุณาเข้าสู่ระบบแอดมินใหม่", {
          position: "top-center",
        });
        return;
      }
      const msg = err?.response?.data?.message || "ไม่สามารถเพิ่มกิจกรรมได้";
      toast.error(msg, { position: "top-center", autoClose: 1500 });
    } finally {
      setSubmitting(false);
    }
  };

  // Use browser geolocation for Add form
  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormdata((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
        try {
          if (map && window.L) {
            if (markerRef.current) map.removeLayer(markerRef.current);
            markerRef.current = window.L.marker([lat, lng]).addTo(map);
            map.setView([lat, lng], 15);
          }
        } catch (_) {}
      },
      () => toast.error("ไม่สามารถดึงตำแหน่งปัจจุบันได้")
    );
  };

  const resetAddForm = () => {
    setShowModal(false);
    setShowMap(false);
    if (map) {
      map.off();
      map.remove();
      setMap(null);
    }
    if (markerRef.current) markerRef.current = null;
    setFormdata({
      name_event: "",
      location_event: "",
      phone: "",
      detail_event: "",
      date_start: "",
      date_end: "",
      latitude: "",
      longitude: "",
      type: "2",
    });
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
  };

  // Initialize map when showMap is true
  useEffect(() => {
    if (!showMap) {
      if (map) {
        map.off();
        map.remove();
        setMap(null);
      }
      markerRef.current = null;
      return;
    }
    // load leaflet only once
    const hasLeaflet = !!window.L;
    const loadLeaflet = () =>
      new Promise((resolve) => {
        if (hasLeaflet) return resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    let alive = true;
    loadLeaflet().then(() => {
      if (!alive) return;
      const L = window.L;
      const m = L.map("admin-event-map", { zoomControl: true }).setView(
        [19.9105, 99.8406],
        11
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(m);
      const onClick = (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) m.removeLayer(markerRef.current);
        markerRef.current = L.marker([lat, lng]).addTo(m);
        setFormdata((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
      };
      m.on("click", onClick);
      setMap(m);
    });

    return () => {
      alive = false;
      if (map) {
        try {
          map.off();
          map.remove();
        } catch (_) {}
        setMap(null);
      }
      markerRef.current = null;
    };
  }, [showMap]);

  // Initialize edit map when toggled
  useEffect(() => {
    if (!showEditMap) {
      if (editMap) {
        try {
          editMap.off();
          editMap.remove();
        } catch (_) {}
        setEditMap(null);
      }
      editMarkerRef.current = null;
      return;
    }
    const hasLeaflet = !!window.L;
    const loadLeaflet = () =>
      new Promise((resolve) => {
        if (hasLeaflet) return resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    let alive = true;
    loadLeaflet().then(() => {
      if (!alive) return;
      const L = window.L;
      const center = [
        parseFloat(editForm.latitude || "19.9105") || 19.9105,
        parseFloat(editForm.longitude || "99.8406") || 99.8406,
      ];
      const m = L.map("admin-event-map-edit", { zoomControl: true }).setView(
        center,
        11
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(m);
      const onClick = (e) => {
        const { lat, lng } = e.latlng;
        if (editMarkerRef.current) m.removeLayer(editMarkerRef.current);
        editMarkerRef.current = L.marker([lat, lng]).addTo(m);
        setEditForm((prev) => ({
          ...prev,
          latitude: String(lat.toFixed(6)),
          longitude: String(lng.toFixed(6)),
        }));
      };
      m.on("click", onClick);
      setEditMap(m);
    });

    return () => {
      alive = false;
    };
  }, [showEditMap]);

  // Edit
  const openEdit = (item) => {
    setEditForm({
      id_event: item.id_event,
      name_event: item.name_event || "",
      location_event: item.location_event || "",
      phone: item.phone || "",
      detail_event: item.detail_event || "",
      date_start: item.date_start
        ? new Date(item.date_start).toISOString().slice(0, 16)
        : "",
      date_end: item.date_end
        ? new Date(item.date_end).toISOString().slice(0, 16)
        : "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
      type: String(item.type ?? "2"),
    });
    setEditFile(null);
    setEditPreview(item.images || null);
    setShowEdit(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      toast.error("กรุณาเข้าสู่ระบบแอดมินก่อน", { position: "top-center" });
      return;
    }
    if (!validateDates(editForm.date_start, editForm.date_end)) {
      toast.error("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม", {
        position: "top-center",
      });
      return;
    }
    try {
      setEditSubmitting(true);
      const fd = new FormData();
      fd.append("name_event", editForm.name_event.trim());
      fd.append("location_event", editForm.location_event.trim());
      fd.append("phone", editForm.phone.trim());
      fd.append("detail_event", editForm.detail_event.trim());
      fd.append("date_start", ensureIsoOrEmpty(editForm.date_start));
      fd.append("date_end", ensureIsoOrEmpty(editForm.date_end));
      fd.append("latitude", editForm.latitude);
      fd.append("longitude", editForm.longitude);
      fd.append("type", editForm.type || "2");
      if (editFile) fd.append("image", editFile);

      await axios.patch(
        `${import.meta.env.VITE_API}event/${editForm.id_event}`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      toast.success("แก้ไขกิจกรรมสำเร็จ", {
        position: "top-center",
        autoClose: 1000,
      });
      resetEdit();
      fetchEvents();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("สิทธิ์ไม่ถูกต้อง กรุณาเข้าสู่ระบบแอดมินใหม่", {
          position: "top-center",
        });
      } else {
        toast.error("ไม่สามารถแก้ไขกิจกรรมได้", {
          position: "top-center",
          autoClose: 1500,
        });
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const useCurrentLocationEdit = () => {
    if (!("geolocation" in navigator)) {
      toast.error("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setEditForm((prev) => ({
          ...prev,
          latitude: String(lat.toFixed(6)),
          longitude: String(lng.toFixed(6)),
        }));
      },
      () => toast.error("ไม่สามารถดึงตำแหน่งปัจจุบันได้")
    );
  };

  const resetEdit = () => {
    setShowEdit(false);
    setEditSubmitting(false);
    setEditForm({
      id_event: "",
      name_event: "",
      location_event: "",
      phone: "",
      detail_event: "",
      date_start: "",
      date_end: "",
      latitude: "",
      longitude: "",
      type: "2",
    });
    if (editPreview && editPreview.startsWith("blob:"))
      URL.revokeObjectURL(editPreview);
    setEditFile(null);
    setEditPreview(null);
  };

  // ฟังก์ชันลบกิจกรรม
  const handleDelete = async (id_event) => {
    if (window.confirm("ยืนยันการลบกิจกรรมนี้?")) {
      try {
        await axios.delete(import.meta.env.VITE_API + `event/${id_event}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        });
        fetchEvents();
        toast.success("ลบกิจกรรมสำเร็จ", {
          autoClose: 500,
          position: "top-center",
        });
      } catch (err) {
        toast.error("ลบกิจกรรมไม่สำเร็จ", {
          autoClose: 500,
          position: "top-center",
        });
      }
    }
  };

  // ===== Filter/Paginate (useMemo) =====
  const filteredEvents = useMemo(
    () =>
      events.filter((item) =>
        (item.name_event || "").toLowerCase().includes(search.toLowerCase())
      ),
    [events, search]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / itemsPerPage)
  );

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, page]);

  // ===== ESC & lock scroll when any modal open =====
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showModal) resetAddForm();
        if (showEdit) resetEdit();
      }
    };
    if (showModal || showEdit) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showModal, showEdit]);

  return (
    <>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <ToastContainer />
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                จัดการกิจกรรม
              </h1>
              <p className="text-sm text-gray-600">
                รายการกิจกรรมทั้งหมดของคุณ
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md flex items-center gap-2 mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="ค้นหาชื่อกิจกรรม..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <button
                onClick={openAddModal}
                className="btn btn-primary mt-2 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> เพิ่มกิจกรรม
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <th className="w-[8%] px-4 py-3 text-center font-medium text-sm">
                      ลำดับ
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left font-medium text-sm">
                      โปรไฟล์
                    </th>
                    <th className="w-[30%] px-4 py-3 text-left font-medium text-sm">
                      ชื่อกิจกรรม
                    </th>
                    <th className="w-[20%] px-4 py-3 text-left font-medium text-sm">
                      สถานที่
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left font-medium text-sm">
                      วันที่เริ่ม
                    </th>
                    <th className="w-[12%] px-4 py-3 text-left font-medium text-sm">
                      วันที่สิ้นสุด
                    </th>
                    <th className="w-[15%] px-4 py-3 text-center font-medium text-sm">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Calendar className="w-12 h-12 mb-2" />
                          <p className="text-sm font-medium">
                            ไม่พบข้อมูลกิจกรรม
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEvents.map((item, idx) => (
                      <tr
                        key={item.id_event}
                        className="hover:bg-purple-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-center text-gray-700 font-medium text-sm">
                          {(page - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <img
                            src={item.images}
                            alt={item.name_event}
                            className="w-16 h-16 object-cover rounded-lg shadow-md border-2 border-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {item.name_event}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {item.location_event}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {item.date_start
                            ? new Date(item.date_start).toLocaleDateString(
                                "th-TH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {item.date_end
                            ? new Date(item.date_end).toLocaleDateString(
                                "th-TH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <a
                              href={`/detall_event/${item.id_event}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              โพสต์
                            </a>
                            <button
                              onClick={() => openEdit(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_event)}
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
                  แสดงรายการที่ {(page - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(page * itemsPerPage, filteredEvents.length)}{" "}
                  จากทั้งหมด {filteredEvents.length} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    ก่อนหน้า
                  </button>
                  <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium shadow-sm text-xs">
                    {page} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
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
      </div>

      {/* Add Modal (dialog) */}
      {showModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-full max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-0 shadow-2xl relative">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 z-0"
              onClick={resetAddForm}
            />

            {/* Content (เต็มขนาด modal-box) */}
            <div
              className="relative z-10 bg-white w-full h-full overflow-y-auto shadow-2xl border border-purple-100"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-800 via-purple-600 to-fuchsia-500 px-6 py-4 border-b sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    เพิ่มกิจกรรม
                  </h2>
                  <button
                    onClick={resetAddForm}
                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="ปิด"
                    type="button"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-purple-50 mt-1 text-sm">
                  กรอกข้อมูลกิจกรรมในจังหวัดเชียงราย
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* อัปโหลดรูป */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    รูปภาพกิจกรรม
                  </label>
                  <div className="relative">
                    {preview ? (
                      <div className="relative group">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-56 object-cover rounded-2xl border-4 border-purple-200 shadow-lg"
                        />
                        <div className="absolute inset-0 bg-purple-700/40 rounded-2xl grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium">
                            คลิกเพื่อเปลี่ยนรูป
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-56 border-4 border-dashed border-fuchsia-400 rounded-2xl grid place-items-center bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors cursor-pointer">
                        <div className="text-center">
                          <svg
                            className="h-10 w-10 text-purple-400 mx-auto mb-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16l5-5a3 3 0 014 0l5 5M14 11l1-1a3 3 0 014 0l2 2M2 20h20"
                            />
                          </svg>
                          <p className="text-purple-700 font-medium">
                            อัปโหลดรูปภาพ
                          </p>
                          <p className="text-purple-500 text-xs mt-1">
                            รองรับ JPG/PNG/WebP — แนะนำอัตราส่วนแนวนอน
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      name="image"
                    />
                  </div>
                </div>

                {/* ข้อมูลกิจกรรม */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      ชื่อกิจกรรม <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น เทศกาลดอกไม้เชียงราย"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm"
                      value={formdata.name_event}
                      onChange={(e) =>
                        setFormdata({ ...formdata, name_event: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      สถานที่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สวนสาธารณะ, วัด, ลานกิจกรรม"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm"
                      value={formdata.location_event}
                      onChange={(e) =>
                        setFormdata({
                          ...formdata,
                          location_event: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="08X-XXX-XXXX"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm tabular-nums"
                      value={formdata.phone}
                      onChange={(e) =>
                        setFormdata({
                          ...formdata,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      ประเภท (type)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 2"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm"
                      value={formdata.type}
                      onChange={(e) =>
                        setFormdata({ ...formdata, type: e.target.value })
                      }
                    />
                  </div> */}

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      วันที่เริ่ม
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm"
                      value={formdata.date_start}
                      onChange={(e) =>
                        setFormdata({ ...formdata, date_start: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm"
                      value={formdata.date_end}
                      onChange={(e) =>
                        setFormdata({ ...formdata, date_end: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* พิกัด + แผนที่ */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        ละติจูด (Latitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="19.910500"
                        className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm tabular-nums"
                        value={formdata.latitude}
                        onChange={(e) =>
                          setFormdata({ ...formdata, latitude: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        ลองจิจูด (Longitude)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="99.840600"
                        className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm tabular-nums"
                        value={formdata.longitude}
                        onChange={(e) =>
                          setFormdata({
                            ...formdata,
                            longitude: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-purple-800">
                        เลือกตำแหน่งบนแผนที่
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMap((s) => !s)}
                          className="px-3 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                          {showMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                        </button>
                        <button
                          type="button"
                          onClick={useCurrentLocation}
                          className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all"
                        >
                          ใช้ตำแหน่งปัจจุบัน
                        </button>
                      </div>
                    </div>

                    {showMap && (
                      <div className="mt-4">
                        <div
                          id="admin-event-map"
                          className="h-72 rounded-xl border-2 border-purple-200 shadow-inner"
                        ></div>
                        <p className="text-xs text-purple-600 mt-2 text-center">
                          คลิกบนแผนที่เพื่อเลือกพิกัด ระบบจะกรอก lat/lng
                          ให้อัตโนมัติ
                        </p>
                      </div>
                    )}
                  </div>

                  {formdata.latitude && formdata.longitude && (
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-xl border border-purple-200 text-sm text-purple-800">
                      📍 <span className="font-semibold">ตำแหน่งที่เลือก:</span>{" "}
                      {formdata.latitude}, {formdata.longitude}
                    </div>
                  )}
                </div>

                {/* รายละเอียดกิจกรรม */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    รายละเอียดกิจกรรม
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-sm"
                    rows={3}
                    placeholder="รายละเอียดเพิ่มเติมของกิจกรรม เช่น กิจกรรมภายในงาน เวลาจัดงาน เงื่อนไขการเข้าร่วม เป็นต้น"
                    value={formdata.detail_event}
                    onChange={(e) =>
                      setFormdata({
                        ...formdata,
                        detail_event: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                    className="w-50 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-3.5 px-6 rounded-xl text-base font-bold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50"
                  >
                    {submitting ? "กำลังบันทึก..." : "โพสต์กิจกรรม"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}

      {/* Edit Modal (dialog) */}
      {showEdit && (
        <dialog open className="modal modal-open">
          <div className="modal-box w-full max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-0 shadow-2xl relative">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 z-0"
              onClick={resetEdit}
            />
            {/* Content */}
            <div
              className="relative z-10 bg-white overflow-hidden border border-purple-100"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header (match Add) */}
              <div className="bg-gradient-to-r from-violet-800 via-purple-600 to-fuchsia-500 px-6 py-4 border-b sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    แก้ไขกิจกรรม
                  </h2>
                  <button
                    onClick={resetEdit}
                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="ปิด"
                    type="button"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
                <p className="text-purple-50 mt-1 text-sm">
                  แก้ไขข้อมูลกิจกรรมในจังหวัดเชียงราย
                </p>
              </div>

              <form onSubmit={submitEdit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      ชื่อกิจกรรม
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={editForm.name_event}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name_event: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      สถานที่
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={editForm.location_event}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          location_event: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      เบอร์โทร
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      วันที่เริ่ม
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={editForm.date_start}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date_start: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={editForm.date_end}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date_end: e.target.value })
                      }
                    />
                  </div>
                  {/* Coordinates + map controls */}
                  <div className="col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          ละติจูด (Latitude)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={editForm.latitude}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              latitude: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          ลองจิจูด (Longitude)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          value={editForm.longitude}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              longitude: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-purple-800">
                          เลือกตำแหน่งบนแผนที่
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEditMap((s) => !s)}
                            className="px-3 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                          >
                            {showEditMap ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                          </button>
                          <button
                            type="button"
                            onClick={useCurrentLocationEdit}
                            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all"
                          >
                            ใช้ตำแหน่งปัจจุบัน
                          </button>
                        </div>
                      </div>
                      {showEditMap && (
                        <div className="mt-4">
                          <div
                            id="admin-event-map-edit"
                            className="h-72 rounded-xl border-2 border-purple-200 shadow-inner"
                          ></div>
                          <p className="text-xs text-purple-600 mt-2 text-center">
                            คลิกบนแผนที่เพื่อเลือกพิกัด ระบบจะกรอก lat/lng
                            ให้อัตโนมัติ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    รายละเอียดกิจกรรม
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={3}
                    value={editForm.detail_event}
                    onChange={(e) =>
                      setEditForm({ ...editForm, detail_event: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      ประเภท (type)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm({ ...editForm, type: e.target.value })
                      }
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      รูปภาพ
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      name="image"
                    />
                    {editPreview && (
                      <img
                        src={editPreview}
                        alt="preview"
                        className="mt-2 h-28 rounded-md border object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetEdit}
                    className="px-4 py-2 rounded-lg border text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    aria-busy={editSubmitting}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50"
                  >
                    {editSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}

export default EventControllers;
