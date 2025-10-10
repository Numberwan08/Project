import React, { useMemo, useState } from "react";
import axios from "axios";
import { useReport } from "../../context/ReportContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ReportComment() {
  const { reports, loadingAll, refreshReports } = useReport();
  const api = import.meta.env.VITE_API;
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [processingKey, setProcessingKey] = useState(null);

  const updateStatus = async (id_report_comment, status) => {
    await axios.patch(`${api}report/${id_report_comment}/status`, { status });
  };

  const statusText = (s) => (Number(s) === 0 ? "ซ่อน" : "กำลังดำเนินการ");
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

  const setTargetVisibility = async (g, status) => {
    if (g.source === "event") {
      if (g.id_event_reply) {
        await axios.patch(`${api}event/reply_status/${g.id_event_reply}`, { status });
      } else if (g.id_event_comment) {
        await axios.patch(`${api}event/comment_status/${g.id_event_comment}`, { status });
      }
    } else {
      if (g.id_reply) {
        await axios.patch(`${api}post/reply_status/${g.id_reply}`, { status });
      } else if (g.id_comment) {
        await axios.patch(`${api}post/comment_status/${g.id_comment}`, { status });
      }
    }
  };

  const bulkHideGroup = async (g) => {
    if (processingKey) return;
    setProcessingKey(g.key);
    try {
      await setTargetVisibility(g, 0);
      await Promise.all(g.items.map((r) => updateStatus(r.id_report_comment, 0)));
      toast.success("อัปเดตสถานะแล้ว", { position: "top-center", autoClose: 1000 });
      await refreshReports();
    } finally {
      setProcessingKey(null);
    }
  };

  const bulkUnhideGroup = async (g) => {
    if (processingKey) return;
    setProcessingKey(g.key);
    try {
      await setTargetVisibility(g, 1);
      await Promise.all(g.items.map((r) => updateStatus(r.id_report_comment, 1)));
      toast.success("อัปเดตสถานะแล้ว", { position: "top-center", autoClose: 1000 });
      await refreshReports();
    } finally {
      setProcessingKey(null);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map();
    (reports || []).forEach((r) => {
      const isEvent = r.source === "event";
      const key = isEvent
        ? r.id_event_reply
          ? `event_reply:${r.id_event_reply}`
          : `event_comment:${r.id_event_comment}`
        : r.id_reply
        ? `post_reply:${r.id_reply}`
        : `post_comment:${r.id_comment}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries()).map(([key, items]) => {
      const first = items[0] || {};
      const anyHidden = items.some((x) => Number(x.status) === 0);
      return {
        key,
        items,
        id_post: first.id_post,
        id_comment: first.id_comment,
        id_reply: first.id_reply,
        id_event: first.id_event,
        id_event_comment: first.id_event_comment,
        id_event_reply: first.id_event_reply,
        type: first.id_reply ? "reply" : "comment",
        source: first.source || "post",
        post_name: first.source === "event" ? first.event_name : first.post_name,
        status_group: anyHidden ? 0 : 1,
        count: items.length,
      };
    });
  }, [reports]);

  // toggle ทีละกลุ่ม
  const toggleOne = (key) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedKeys(next);
  };

  // ปุ่ม show/hide ทั้งหมด
  const expandAll = () => setExpandedKeys(new Set(grouped.map((g) => g.key)));
  const collapseAll = () => setExpandedKeys(new Set());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">จัดการการรายงานความคิดเห็น</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">รวมรายงานตามคอมเมนต์/รีพลาย</p>
            {/* {!loadingAll && grouped.length > 0 && (
              expandedKeys.size === grouped.length ? (
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 shadow-sm"
                  onClick={collapseAll}
                >
                  ซ่อนรายละเอียดทั้งหมด
                </button>
              ) : (
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-medium hover:from-purple-700 hover:to-purple-800 shadow-sm"
                  onClick={expandAll}
                >
                  แสดงรายละเอียดทั้งหมด
                </button>
              )
            )} */}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="px-4 py-3 text-center font-medium text-sm w-[6%]">ลำดับ</th>
                  <th className="px-4 py-3 text-left font-medium text-sm w-[34%]">โพสต์ / กิจกรรม</th>
                  <th className="px-4 py-3 text-left font-medium text-sm w-[12%]">จำนวนรายงาน</th>
                  <th className="px-4 py-3 text-left font-medium text-sm w-[14%]">สถานะ</th>
                  <th className="px-4 py-3 text-left font-medium text-sm w-[14%]">รายละเอียดรายงาน</th>
                  <th className="px-4 py-3 text-center font-medium text-sm w-[20%]">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loadingAll ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-600">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : grouped.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="text-gray-400 text-sm font-medium">ไม่พบรายการรายงาน</div>
                    </td>
                  </tr>
                ) : (
                  grouped.map((g, index) => {
                    const busy = processingKey === g.key;
                    return (
                      <React.Fragment key={g.key}>
                        <tr className="align-top hover:bg-purple-50 transition-colors">
                          <td className="px-4 py-3 text-center text-gray-700 font-medium text-sm">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[360px] truncate text-gray-900 font-medium text-sm">
                              {g.post_name || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800 text-sm">{g.count}</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                g.status_group === 0
                                  ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200"
                                  : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }
                            >
                              {statusText(g.status_group)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="text-sm text-purple-700 hover:text-purple-900"
                              onClick={() => toggleOne(g.key)}
                            >
                              {expandedKeys.has(g.key) ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs disabled:opacity-60"
                                disabled={busy}
                                onClick={() => bulkHideGroup(g)}
                              >
                                {busy ? "กำลังซ่อน..." : "ซ่อน"}
                              </button>
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-150 shadow-sm font-medium text-xs disabled:opacity-60"
                                disabled={busy}
                                onClick={() => bulkUnhideGroup(g)}
                              >
                                {busy ? "กำลังแสดง..." : "แสดง"}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedKeys.has(g.key) && (
                          <tr>
                            <td colSpan={6} className="px-4 pb-4">
                              <div className="mx-1 mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <div className="space-y-3">
                                  {g.items.map((r) => (
                                    <div
                                      key={r.id_report_comment}
                                      className="border-b border-gray-200 last:border-none pb-2"
                                    >
                                      <div className="text-sm text-gray-800">
                                        <span className="font-medium">ผู้แจ้ง:</span>{" "}
                                        {r.reporter_name || r.reporter_id || "-"}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        เหตุผล: {reasonText(r.reason)}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        เนื้อหา: {r.detail_report || "-"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportComment;
