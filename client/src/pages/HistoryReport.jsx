import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, AlertCircle, CheckCircle2, Clock, FileText, ExternalLink } from "lucide-react";

function HistoryReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);

  const userId = localStorage.getItem("userId");

  const getHistoryReport = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API}historyreport/${userId}`);
      setReportData(res.data?.data || []);
    } catch (err) {
      console.log("Error get historyReport:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const reasonText = (r) => {
    const map = {
      spam: "สแปม / โฆษณา",
      harassment: "กลั่นแกล้ง / คุกคาม",
      hate: "เฮทสปีช / ความรุนแรง",
      nudity: "รูป/ข้อความไม่เหมาะสม",
      other: "อื่น ๆ",
    };
    return map[r] || r || "-";
  };

  const reasonBadgeColor = (r) => {
    const map = {
      spam: "bg-blue-100 text-blue-700",
      harassment: "bg-purple-100 text-purple-700",
      hate: "bg-red-100 text-red-700",
      nudity: "bg-pink-100 text-pink-700",
      other: "bg-gray-100 text-gray-700",
    };
    return map[r] || "bg-gray-100 text-gray-700";
  };

  const statusConfig = (s) => {
    if (String(s) === "0") {
      return { text: "ดำเนินการแล้ว", bgColor: "bg-green-100", textColor: "text-green-700", icon: CheckCircle2 };
    }
    return { text: "กำลังดำเนินการ", bgColor: "bg-yellow-100", textColor: "text-yellow-700", icon: Clock };
  };

  useEffect(() => {
    getHistoryReport();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [reportData.length]);

  const openPostInNewTab = (item) => {
    const isEvent = item?.source === 'event';
    if (isEvent) {
      if (!item?.id_event || !(item?.id_event_comment || item?.id_event_reply)) return;
      const link = `/detall_event/${item.id_event}?` + (item.id_event_reply
        ? `highlightComment=${item.id_event_comment}&highlightReply=${item.id_event_reply}`
        : `highlightComment=${item.id_event_comment}`) + `&suppressHiddenToast=1`;
      window.open(link, "_blank", "noopener");
      return;
    }
    if (!item?.id_post || !item?.id_comment) return;
    const link = `/detall_att/${item.id_post}?` + (item.id_reply
      ? `highlightComment=${item.id_comment}&highlightReply=${item.id_reply}`
      : `highlightComment=${item.id_comment}`) + `&suppressHiddenToast=1`;
    window.open(link, "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-center text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-gray-900">ประวัติการรายงาน</h1>
        </div>

        {reportData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลรายงาน</h3>
            <p className="text-gray-500">คุณยังไม่มีประวัติการแจ้งรายงานในขณะนี้</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่แจ้งรายงาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เนื้อหา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เจ้าของความคิดเห็น</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สาเหตุ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData
                    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                    .map((item, index) => {
                      const content = item?.reply_text || item?.comment_text || "-";
                      const status = statusConfig(item.status);
                      const StatusIcon = status.icon;
                      const globalIndex = (page - 1) * ITEMS_PER_PAGE + index + 1;
                      return (
                        <tr key={item.id_report_comment || globalIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{globalIndex}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.created_at)}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                            <div className="truncate" title={content}>{content}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item?.target_name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reasonBadgeColor(item.reason)}`}>
                              {reasonText(item.reason)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            <button
                              onClick={() => { setSelected(item); setShowModal(true); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                              <Eye size={14} /> ดูรายละเอียด
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between px-4 pb-4">
              <button
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ก่อนหน้า
              </button>
              <div className="text-sm text-gray-600">
                หน้า {page} / {Math.max(1, Math.ceil(reportData.length / ITEMS_PER_PAGE))}
              </div>
              <button
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(Math.ceil(reportData.length / ITEMS_PER_PAGE) || 1, p + 1))}
                disabled={page >= (Math.ceil(reportData.length / ITEMS_PER_PAGE) || 1)}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/20">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <h3 className="text-xl font-bold text-gray-900">รายละเอียดการรายงาน</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const status = statusConfig(selected.status);
                    const StatusIcon = status.icon;
                    return (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${status.bgColor} ${status.textColor}`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {status.text}
                      </span>
                    );
                  })()}
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${reasonBadgeColor(selected.reason)}`}>
                    {reasonText(selected.reason)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">วันที่แจ้ง</p>
                    <p className="text-sm text-gray-900">{formatDate(selected.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ประเภท</p>
                    <p className="text-sm text-gray-900">{selected.id_reply ? "การตอบกลับ" : "ความคิดเห็น"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">โพสต์</p>
                    <p className="text-sm text-gray-900">{selected.post_name || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">เจ้าของความคิดเห็น</p>
                    <p className="text-sm text-gray-900">{selected?.target_name || "-"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">เนื้อหาที่แจ้ง</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.reply_text || selected.comment_text || "-"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">รายละเอียดการแจ้ง</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.detail_report || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-2 justify-end">
                {selected?.id_post && selected?.id_comment && (
                  <button
                    onClick={() => openPostInNewTab(selected)}
                    className="px-4 py-2 text-sm rounded-lg border flex items-center gap-1"
                  >
                    <ExternalLink size={14} /> ไปยังโพสต์
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryReport;
