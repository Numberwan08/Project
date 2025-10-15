import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { Bell } from "lucide-react";

const menuItems = [
  {
    label: "หน้าแรก",
    path: "/",
  },
  {
    label: "ท่องเที่ยว",
    path: "/attraction",
  },
  {
    label: "กิจกรรม",
    path: "/event",
  },
  // {
  //   label: "สินค้า",
  //   path: "/product",
  // },
];

const Navbar = () => {
  const { isLogin, logout, name } = useAuth();
  const { reports, replies, refresh } = useNotifications();
  const [openNotif, setOpenNotif] = useState(false);
  const [notifLimit, setNotifLimit] = useState(10);
  const [seenKeysTick, setSeenKeysTick] = useState(0);
  const [notifTab, setNotifTab] = useState("all"); // all | unread
  const location = useLocation();

  const makeReplyLink = (r, isEvent = false) => {
    return isEvent
      ? `/detall_event/${r.id_event}?highlightComment=${r.id_comment}&highlightReply=${r.id_reply}`
      : `/detall_att/${r.id_post}?highlightComment=${r.id_comment}&highlightReply=${r.id_reply}`;
  };

  const makeReportLink = (it) => {
    // Build deep link to the exact content
    if (it.id_event_comment || it.id_event_reply) {
      // Event source
      const base = `/detall_event/${it.id_event}`;
      const params = new URLSearchParams();
      if (it.id_event_comment)
        params.set("highlightComment", it.id_event_comment);
      if (it.id_event_reply) params.set("highlightReply", it.id_event_reply);
      return `${base}?${params.toString()}`;
    }
    // Post source
    const base = `/detall_att/${it.id_post}`;
    const params = new URLSearchParams();
    if (it.id_comment || it.id_commnet)
      params.set("highlightComment", it.id_comment || it.id_commnet);
    if (it.id_reply) params.set("highlightReply", it.id_reply);
    return `${base}?${params.toString()}`;
  };

  // Build unified notifications list (reports + replies), newest first
  const notifItems = useMemo(() => {
    const items = [];
    // Reports (pending + resolved)
    (reports?.pending || []).forEach((it) => {
      const ts = it.created_at ? Date.parse(it.created_at) : 0;
      items.push({
        key: `rc-${it.id_report_comment}`,
        type: "report-pending",
        label:
          it.id_reply || it.id_event_reply
            ? "รายงานตอบกลับ (ระหว่างตรวจสอบ)"
            : "รายงานคอมเมนต์ (ระหว่างตรวจสอบ)",
        text: it.reason || "-",
        href: makeReportLink(it),
        ts,
        color: "yellow",
      });
    });
    (reports?.resolved || []).forEach((it) => {
      const ts = it.created_at ? Date.parse(it.created_at) : 0;
      items.push({
        key: `rc-${it.id_report_comment}`,
        type: "report-resolved",
        label:
          it.id_reply || it.id_event_reply
            ? "รายงานตอบกลับ (ดำเนินการแล้ว)"
            : "รายงานคอมเมนต์ (ดำเนินการแล้ว)",
        text: it.reason || "-",
        href: makeReportLink(it),
        ts,
        color: "yellow",
      });
    });
    // Replies to my comments (posts + events)
    (replies?.posts || []).forEach((r) => {
      const ts = r.reply_date ? Date.parse(r.reply_date) : 0;
      items.push({
        key: `rplp-${r.id_reply}`,
        type: "reply-post",
        label: `ตอบกลับความคิดเห็น: ${r.post_name || ""}`,
        text: r.reply || "",
        comment_text: r.comment_text || "",
        reply_user_name: r.reply_user_name || "",
        href: makeReplyLink(r, false),
        ts,
        color: "blue",
      });
    });
    (replies?.events || []).forEach((r) => {
      const ts = r.reply_date ? Date.parse(r.reply_date) : 0;
      items.push({
        key: `rple-${r.id_reply}`,
        type: "reply-event",
        label: `ตอบกลับในกิจกรรม: ${r.event_name || ""}`,
        text: r.reply || "",
        comment_text: r.comment_text || "",
        reply_user_name: r.reply_user_name || "",
        href: makeReplyLink(r, true),
        ts,
        color: "blue",
      });
    });
    // Sort newest first
    items.sort((a, b) => b.ts - a.ts);
    return items;
  }, [reports, replies]);

  // Seen handling
  const seenSet = useMemo(() => {
    try {
      const raw = localStorage.getItem("notifSeenKeys");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  }, [seenKeysTick]);

  // Deleted handling (local only)
  const deletedSet = useMemo(() => {
    try {
      const raw = localStorage.getItem("notifDeletedKeys");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  }, [seenKeysTick]);

  const unseenCount = useMemo(
    () => notifItems.filter((n) => !seenSet.has(n.key) && !deletedSet.has(n.key)).length,
    [notifItems, seenSet, deletedSet]
  );

  const markSeen = (key) => {
    try {
      const raw = localStorage.getItem("notifSeenKeys");
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(key)) arr.push(key);
      localStorage.setItem("notifSeenKeys", JSON.stringify(arr));
      setSeenKeysTick((t) => t + 1);
    } catch {}
  };

  const markAllSeen = () => {
    try {
      const raw = localStorage.getItem("notifSeenKeys");
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      effectiveItems.forEach((n) => {
        if (!set.has(n.key)) set.add(n.key);
      });
      localStorage.setItem("notifSeenKeys", JSON.stringify(Array.from(set)));
      setSeenKeysTick((t) => t + 1);
    } catch {}
  };

  const deleteNotif = (key) => {
    try {
      const raw = localStorage.getItem("notifDeletedKeys");
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(key)) arr.push(key);
      localStorage.setItem("notifDeletedKeys", JSON.stringify(arr));
      setSeenKeysTick((t) => t + 1);
    } catch {}
  };

  const clearAllDeleted = () => {
    try {
      localStorage.removeItem("notifDeletedKeys");
      setSeenKeysTick((t) => t + 1);
    } catch {}
  };

  // Items for display: remove deleted, then filter by tab
  const effectiveItems = useMemo(
    () => notifItems.filter((n) => !deletedSet.has(n.key)),
    [notifItems, deletedSet]
  );
  const displayItems = useMemo(() => {
    const base = effectiveItems;
    if (notifTab === "unread") return base.filter((n) => !seenSet.has(n.key));
    return base;
  }, [effectiveItems, notifTab, seenSet]);

  return (
    <nav className="bg-white shadow-md py-4 px-6 fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Chiang Rai</div>
        <ul className=" flex justify-between space-x-6">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`text-gray-700 hover:text-purple-500 transition duration-200 font-medium ${
                  location.pathname === item.path
                    ? "text-purple-800 font-bold bg-purple-100 px-3 py-1 rounded"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          {isLogin ? (
            <>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setOpenNotif((o) => !o);
                    refresh();
                    setNotifLimit(10);
                  }}
                  aria-label="การแจ้งเตือน"
                  title="การแจ้งเตือน"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                      {unseenCount}
                    </span>
                  )}
                </button>
                {openNotif && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white shadow-lg rounded-lg border z-50">
                    <div className="p-3 border-b flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        การแจ้งเตือน
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className={`text-xs px-2 py-1 rounded cursor-pointer ${
                            notifTab === "all"
                              ? "bg-gray-800 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => setNotifTab("all")}
                        >
                          ทั้งหมด
                        </button>
                        <button
                          className={`text-xs px-2 py-1 rounded cursor-pointer  ${
                            notifTab === "unread"
                              ? "bg-gray-800 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => setNotifTab("unread")}
                        >
                          ยังไม่ได้อ่าน
                        </button>
                        {unseenCount > 0 && (
                          <button
                            className="text-xs text-blue-600  text-gray-600 hover:bg-gray-100 py-2 px-1 rounded-md cursor-pointer"
                            onClick={markAllSeen}
                            title="ทำเป็นอ่านทั้งหมด"
                          >
                            อ่านทั้งหมด
                          </button>
                        )}
                        <button
                          className="text-xs text-gray-500 cursor-pointer hover:bg-gray-100 py-2 px-1 rounded-md"
                          onClick={() => setOpenNotif(false)}
                        >
                          ปิด
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-3 space-y-2 text-sm">
                      {displayItems.length > 0 ? (
                        displayItems.slice(0, notifLimit).map((n) => (
                          <div
                            key={n.key}
                            className={`relative p-2 rounded hover:opacity-90 ${
                              seenSet.has(n.key)
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : n.color === "yellow"
                                ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-800"
                                : "bg-blue-50 hover:bg-blue-100 text-blue-800"
                            }`}
                          >
                            <a
                              href={n.href}
                              onClick={() => markSeen(n.key)}
                              className="block"
                            >
                              <div className="font-medium">{n.label}</div>
                            {/* For reports on reply: use detail_report + reporter */}
                            {n.type.startsWith("report") && (
                              <div className="mt-1 text-xs">
                                {/* <div>{n.text ? `รายละเอียด: ${n.text}` : ''}</div> */}
                                <div>
                                  ผู้รายงาน:{" "}
                                  {reports?.pending?.find(
                                    (x) => `rc-${x.id_report_comment}` === n.key
                                  )?.reporter_name ||
                                    reports?.resolved?.find(
                                      (x) =>
                                        `rc-${x.id_report_comment}` === n.key
                                    )?.reporter_name ||
                                    "-"}
                                </div>
                                {/* For comments, show comment owner name */}
                                {(() => {
                                  const it =
                                    reports?.pending?.find(
                                      (x) =>
                                        `rc-${x.id_report_comment}` === n.key
                                    ) ||
                                    reports?.resolved?.find(
                                      (x) =>
                                        `rc-${x.id_report_comment}` === n.key
                                    );
                                  if (!it) return null;
                                  const cname =
                                    it.comment_owner_name ||
                                    it.event_comment_owner_name ||
                                    null;
                                  return cname ? (
                                    <div className="mt-1">
                                      ผู้คอมเมนต์: {cname}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}
                            {/* For replies list, show reply user, original comment, and reply text */}
                            {n.type.startsWith("reply") && (
                              <div className="mt-1 text-xs space-y-1">
                                {n.reply_user_name && (
                                  <div>ผู้ตอบ: {n.reply_user_name}</div>
                                )}
                                {n.comment_text && (
                                  <div className="flex">
                                    คอมเมนต์:   <span className="line-clamp-2 ml-1">{n.comment_text}</span>
                                  </div>
                                )}
                                {n.text && (
                                  <div className="flex">
                                    ตอบกลับ:   <span className="line-clamp-2 ml-1">{n.text}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            </a>
                            <button
                              className="absolute top-2 right-2 text-xs text-red-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteNotif(n.key);
                              }}
                              title="ลบการแจ้งเตือนนี้"
                            >
                              ลบ
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-600">
                          ยังไม่มีการแจ้งเตือน
                        </div>
                      )}
                      {displayItems.length > notifLimit && (
                        <div className="pt-1 text-center">
                          <button
                            className="text-blue-600 hover:underline text-sm cursor-pointer"
                            onClick={() => setNotifLimit((l) => l + 10)}
                          >
                            แสดงก่อนหน้านี้
                          </button>
                        </div>
                      )}
                      {deletedSet.size > 0 && (
                        <div className="pt-2 text-center">
                          <button
                            className="text-gray-500 hover:underline text-xs"
                            onClick={clearAllDeleted}
                          >
                            เรียกคืนการลบทั้งหมด
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <h3>สวัสดี :{name}</h3>
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn m-1">
                  เมนูสมาชิก
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                  {/* <li>
                    <a href="/menu/menu_att">เพิ่มสถานที่</a>
                  </li> */}
                  {/* ซ่อนการเพิ่มกิจกรรมจากผู้ใช้ทั่วไป */}
                  {/* <li>
                    <a href="/menu/menu_prodact">เพิ่มสินค้า</a>
                  </li> */}
                  {/* <li>
                    <a href="/menu/Show_Event">ข้อมูลกิจกรรม</a>
                  </li> */}
                  <li>
                    <a href="/menu/show_product">ข้อมูลสินค้า</a>
                  </li>
                  <li>
                    <a href="/menu/redactcommnet">ประวัติการถูกรายงาน</a>
                  </li>
                  <li>
                    <a href="/menu/historyreport">ประวัติการรายงาน</a>
                  </li>
                  <li>
                    <a href="/menu/comment">ประวัติความคิดเห็น</a>
                  </li>
                  <li>
                    <a href="/menu/profile">แก้ไขโปรไฟล์</a>
                  </li>
                  <Link to="/">
                    <li
                      onClick={() => logout()}
                      className="bg-red-100 text-red-600 hover:bg-red-200 rounded-md px-2 py-1 font-semibold cursor-pointer"
                    >
                      ออกจากระบบ
                    </li>
                  </Link>
                </ul>
              </div>
            </>
          ) : (
            <>
              <button>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-500 transition duration-200 font-medium"
                >
                  เข้าสู่ระบบ
                </Link>
              </button>
              <button>
                <Link
                  to="/register"
                  className="text-gray-700 hover:text-blue-500 transition duration-200 font-medium"
                >
                  สมัครสมาชิก
                </Link>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
