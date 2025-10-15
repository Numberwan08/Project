import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useReport } from "../context/ReportContext";

function Report_Me() {
  const { myReports, loadingMine, refreshMyReports } = useReport();
  const api = import.meta.env.VITE_API;
  const navigate = useNavigate();

  // จากเดิมใช้ expanded เดี่ยว → เปลี่ยนเป็นชุด key ที่ถูกกางอยู่
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [isAllOpen, setIsAllOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("post"); // 'post' | 'event'
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    refreshMyReports?.();
  }, []);

  const statusText = (s) => (Number(s) === 0 ? "ถูกลบแล้ว" : "กำลังดำเนินการ");
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

  const handleOpen = async ({ id_post, id_comment, id_reply }) => {
    try {
      if (id_comment) {
        const st = await axios.get(`${api}post/comment_status/${id_comment}`);
        const s = st?.data?.data?.status;
        if (String(s) === "0") {
          toast.info("คอมเมนต์นี้ถูกซ่อนแล้ว", { position: "top-center", autoClose: 1500 });
          return; // ถูกซ่อนแล้ว ไม่ต้องนำทางต่อ
        }
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.info("คอมเมนต์นี้ถูกลบแล้ว", { position: "top-center", autoClose: 1500 });
        return;
      }
    }
    const link = id_post
      ? `/detall_att/${id_post}?` +
        (id_reply
          ? `highlightComment=${id_comment}&highlightReply=${id_reply}`
          : `highlightComment=${id_comment}`) +
        `&suppressHiddenToast=1`
      : undefined;
    if (link) navigate(link);
  };

  const handleOpenFromGroup = (g) => {
    if (Number(g.status_group) === 0) {
      toast.info("คอมเมนต์นี้ถูกซ่อนแล้ว", { position: "top-center", autoClose: 1500 });
      return;
    }
    if (g.source === "event") {
      const link = g.id_event
        ? `/detall_event/${g.id_event}?` +
          (g.id_event_reply
            ? `highlightComment=${g.id_event_comment}&highlightReply=${g.id_event_reply}`
            : `highlightComment=${g.id_event_comment}`) +
          `&suppressHiddenToast=1`
        : undefined;
      if (link) navigate(link);
      return;
    }
    handleOpen({
      id_post: g.id_post,
      id_comment: g.id_comment,
      id_reply: g.id_reply,
    });
  };

  // ---- จัดกลุ่มรายงานตามคอมเมนต์/รีพลายเดียวกัน ----
  const groupedPost = useMemo(() => {
    const map = new Map();
    (myReports || [])
      .filter((r) => r.source !== "event")
      .forEach((r) => {
        const key = r.id_reply ? `post_reply:${r.id_reply}` : `post_comment:${r.id_comment}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
      });

    return Array.from(map.entries()).map(([key, items]) => {
      const first = items[0] || {};
      const anyHidden = items.some((x) => Number(x.status) === 0);
      return {
        key,
        items,
        source: "post",
        id_post: first.id_post,
        id_comment: first.id_comment,
        id_reply: first.id_reply,
        type: first.id_reply ? "reply" : "comment",
        post_name: first.post_name,
        count: items.length,
        status_group: anyHidden ? 0 : 1,
      };
    });
  }, [myReports]);

  const groupedEvent = useMemo(() => {
    const map = new Map();
    (myReports || [])
      .filter((r) => r.source === "event")
      .forEach((r) => {
        const key = r.id_event_reply
          ? `event_reply:${r.id_event_reply}`
          : `event_comment:${r.id_event_comment}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
      });

    return Array.from(map.entries()).map(([key, items]) => {
      const first = items[0] || {};
      const anyHidden = items.some((x) => Number(x.status) === 0);
      return {
        key,
        items,
        source: "event",
        id_event: first.id_event,
        id_event_comment: first.id_event_comment,
        id_event_reply: first.id_event_reply,
        type: first.id_event_reply ? "reply" : "comment",
        event_name: first.event_name,
        count: items.length,
        status_group: anyHidden ? 0 : 1,
      };
    });
  }, [myReports]);

  const grouped = sourceFilter === "event" ? groupedEvent : groupedPost;

  // reset page when dataset changes
  useEffect(() => {
    setPage(1);
  }, [sourceFilter, grouped.length]);

  const totalPages = Math.max(1, Math.ceil((grouped.length || 0) / ITEMS_PER_PAGE));
  const pagedGroups = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return grouped.slice(start, start + ITEMS_PER_PAGE);
  }, [grouped, page]);

  // --- ปุ่ม "แสดงทั้งหมด / ซ่อนทั้งหมด" ---
  const openAll = () => {
    const next = new Set(grouped.map((g) => g.key));
    setExpandedKeys(next);
    setIsAllOpen(true);
  };
  const closeAll = () => {
    setExpandedKeys(new Set());
    setIsAllOpen(false);
  };

  const toggleOne = (key) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedKeys(next);
    setIsAllOpen(next.size === grouped.length && grouped.length > 0);
  };

  return (
    <div className="w-full mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">ประวัติการถูกรายงาน</h1>
        <div className="inline-flex rounded-lg border overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm ${
              sourceFilter === "post" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setSourceFilter("post")}
          >
            โพสต์
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm border-l ${
              sourceFilter === "event" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setSourceFilter("event")}
          >
            กิจกรรม
          </button>
        </div>
      {/* {!loadingMine && grouped.length > 0 && (
          <div className="flex gap-2">
            {isAllOpen ? (
              <button
                type="button"
                onClick={closeAll}
                className="btn btn-sm"
              >
                ซ่อนรายละเอียดทั้งหมด
              </button>
            ) : (
              <button
                type="button"
                onClick={openAll}
                className="btn btn-sm btn-outline"
              >
                แสดงรายละเอียดทั้งหมด
              </button>
            )}
          </div>
        )} */}
      </div>

      {loadingMine ? (
        <div className="text-gray-500">กำลังโหลด...</div>
      ) : grouped.length > 0 ? (
        <div className="space-y-4">
          {pagedGroups.map((g) => {
            const groupStatusLabel = statusText(g.status_group);
            const link = g.source === 'event'
              ? (g.id_event
                  ? `/detall_event/${g.id_event}?` +
                    (g.id_event_reply
                      ? `highlightComment=${g.id_event_comment}&highlightReply=${g.id_event_reply}`
                      : `highlightComment=${g.id_event_comment}`) +
                    `&suppressHiddenToast=1`
                  : undefined)
              : (g.id_post
                  ? `/detall_att/${g.id_post}?` +
                    (g.id_reply
                      ? `highlightComment=${g.id_comment}&highlightReply=${g.id_reply}`
                      : `highlightComment=${g.id_comment}`) +
                    `&suppressHiddenToast=1`
                  : undefined);

            const isOpen = expandedKeys.has(g.key);

            return (
              <div key={g.key} className="bg-white rounded-md shadow p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">{g.source === 'event' ? 'กิจกรรม' : 'โพสต์'}</div>
                    <div className="font-medium truncate">{g.source === 'event' ? (g.event_name || '-') : (g.post_name || '-')}</div>

                    <div className="mt-2 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
                      {/* <div>
                        <div className="text-sm text-gray-500">ประเภท</div>
                        <div className="font-medium">{g.type}</div>
                      </div> */}
                      <div>
                        <div className="text-sm text-gray-500">จำนวนรายงาน</div>
                        <div className="font-medium">{g.count}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">สถานะ</div>
                        <div
                          className={`font-semibold ${
                            Number(g.status_group) === 0 ? "text-red-600" : "text-yellow-600"
                          }`}
                        >
                          {groupStatusLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    {link ? (
                      <button
                        type="button"
                        onClick={() => handleOpenFromGroup(g)}
                        className={`text-sm ${
                          Number(g.status_group) === 0
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        ดูคอมเมนต์
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleOne(g.key)}
                      className="text-sm text-purple-700 hover:text-purple-900"
                    >
                      {isOpen ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 bg-gray-50 rounded-md p-3 space-y-3">
                    {g.items.map((r) => (
                      <div key={r.id_report_comment} className="border-b last:border-none pb-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="text-sm">
                            <div className="text-gray-800">
                              <span className="font-medium">ผู้แจ้ง:</span>{" "}
                              {r.reporter_name || r.reporter_id || "-"}
                            </div>
                            <div className="text-gray-600">
                              เหตุผล: {reasonText(r.reason)}
                              {r.detail_report}
                            </div>
                            <div className="text-gray-600 mt-1">
                              เนื้อหา: {r.detail_report}
                            </div>
                          </div>
                          {/* <div
                            className={`text-sm font-semibold ${
                              Number(r.status) === 0 ? "text-red-600" : "text-yellow-600"
                            }`}
                          >
                            {statusText(r.status)}
                          </div> */}
                        </div>
                        {r.created_at && (
                          <div className="mt-1 text-xs text-gray-500">
                            เวลาแจ้ง: {new Date(r.created_at).toLocaleString("th-TH")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center  pt-2bg-gray-50 justify-center px-4 py-3 border-t border-gray-200 flex items-center">
            <div className="flex items-center gap-2">
              <button
              type="button"
              className="px-3 py-1.5 text-xs rounded-lg border bg-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ก่อนหน้า
            </button>
            <div className="px-2">
        {page} / {totalPages}
            </div>
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded-lg border bg-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              ถัดไป
            </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">ยังไม่มีการรายงานที่เกี่ยวกับคุณ</div>
      )}
      <ToastContainer />
    </div>
  );
}

export default Report_Me;
