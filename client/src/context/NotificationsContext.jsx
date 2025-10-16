// src/context/NotificationsContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useRealtime } from "./RealtimeContext";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { userId: authUserId } = useAuth();
  const userId = authUserId;
  const [reports, setReports] = useState({
    pending_count: 0,
    resolved_count: 0,
    pending: [],
    resolved: [],
  });
  const [replies, setReplies] = useState({ posts: [], events: [] });
  const [myReports, setMyReports] = useState({ pending: [], resolved: [] });
  const [loading, setLoading] = useState(false);
  const [follows, setFollows] = useState([]);

  useEffect(() => {
    try {
      if (!userId) {
        setFollows([]);
        return;
      }
      const raw = localStorage.getItem(`notifFollows:${userId}`);
      const arr = raw ? JSON.parse(raw) : [];
      setFollows(Array.isArray(arr) ? arr : []);
    } catch {
      setFollows([]);
    }
  }, [userId]);

  const realtime = useRealtime();

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch reports and followers (new API structure)
      const myRepAndFollows = await axios.get(
        `${import.meta.env.VITE_API}report/my/${userId}`
      );
      const reportsArr = Array.isArray(myRepAndFollows?.data?.data?.reports)
        ? myRepAndFollows.data.data.reports
        : [];
      // status: 1 = pending, 0 = resolved (ตามตัวอย่าง)
      const pending = reportsArr.filter((x) => Number(x.status) === 1);
      const resolved = reportsArr.filter((x) => Number(x.status) === 0);
      setReports({
        pending_count: pending.length,
        resolved_count: resolved.length,
        pending,
        resolved,
      });

      // Replies to my comments (posts + events)
      const [rp1, rp2] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API}comment/replies/to_me/${userId}`),
        axios.get(`${import.meta.env.VITE_API}event/replies/to_me/${userId}`),
      ]);
      setReplies({
        posts: Array.isArray(rp1?.data?.data) ? rp1.data.data : [],
        events: Array.isArray(rp2?.data?.data) ? rp2.data.data : [],
      });

      // My Reports (for myReports, same as above)
      setMyReports({ pending, resolved });

      // Followers
      const followersFromApi = Array.isArray(
        myRepAndFollows?.data?.data?.followers
      )
        ? myRepAndFollows.data.data.followers
        : [];
      const formattedFollowers = followersFromApi.map((f) => ({
        key: `fol-api-${f.id_follower}`,
        follower_id: f.id_follower,
        first_name: f.first_name,
        ts: Date.now(),
      }));
      setFollows((prev) => {
        const existingApiKeys = new Set(
          prev.filter((p) => p.key.startsWith("fol-api-")).map((p) => p.key)
        );
        const newApiFollows = formattedFollowers.filter(
          (f) => !existingApiKeys.has(f.key)
        );
        const realtimeFollows = prev.filter(
          (p) => !p.key.startsWith("fol-api-")
        );
        const next = [...realtimeFollows, ...newApiFollows].slice(0, 50);
        try {
          localStorage.setItem(`notifFollows:${userId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (e) {
      console.error("Failed to refresh notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  // Auto refresh notifications every 5 seconds
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Trigger unseenCount recalculation when any notification data changes
  // (already handled by useMemo in unseenCount)

  // ... (โค้ดส่วน Realtime useEffect ทั้งหมดเหมือนเดิม)

  const onFollowNew = async (payload) => {
    try {
      if (
        !payload ||
        String(payload.target_user_id || "") !== String(userId || "")
      )
        return;
      const fid = payload.follower_id;
      const ts = Date.now();
      const placeholder = {
        key: `fol-${ts}-${fid}`,
        follower_id: fid,
        first_name: "สมาชิก",
        ts,
      };
      setFollows((prev) => {
        const next = [placeholder, ...prev].slice(0, 50);
        try {
          if (userId)
            localStorage.setItem(
              `notifFollows:${userId}`,
              JSON.stringify(next)
            );
        } catch {}
        return next;
      });
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API}profile/${fid}`
        );
        const name = res?.data?.data?.first_name || "สมาชิก";
        setFollows((prev) => {
          const next = prev.map((x) =>
            x.key === placeholder.key ? { ...x, first_name: name } : x
          );
          try {
            if (userId)
              localStorage.setItem(
                `notifFollows:${userId}`,
                JSON.stringify(next)
              );
          } catch {}
          return next;
        });
      } catch {}
    } catch {}
  };

  useEffect(() => {
    if (!realtime || !realtime.on) return;
    // ... onReport, onReply, onCommentHidden listeners
    realtime.on("follow-new", onFollowNew);
    return () => {
      // ... realtime.off calls
      try {
        realtime.off("follow-new", onFollowNew);
      } catch {}
    };
  }, [realtime, userId]);

  // ... (โค้ดส่วน totalCount และ signature เหมือนเดิม)

  // Calculate unseen notifications count (reports + replies + follows) and update reactively
  const unseenCount = useMemo(() => {
    let seenKeys = [];
    try {
      const raw = localStorage.getItem("notifSeenKeys");
      seenKeys = raw ? JSON.parse(raw) : [];
    } catch {}
    const seenSet = new Set(Array.isArray(seenKeys) ? seenKeys : []);
    const notifKeys = [];
    (reports?.pending || []).forEach((it) =>
      notifKeys.push(`rc-${it.id_report_comment}`)
    );
    (reports?.resolved || []).forEach((it) =>
      notifKeys.push(`rc-${it.id_report_comment}`)
    );
    (replies?.posts || []).forEach((r) =>
      notifKeys.push(`reply-post-${r.id_reply}`)
    );
    (replies?.events || []).forEach((r) =>
      notifKeys.push(`reply-event-${r.id_reply}`)
    );
    (myReports?.resolved || []).forEach((it) =>
      notifKeys.push(`myreport-${it.id_report_comment}`)
    );
    (follows || []).forEach((f) => notifKeys.push(f.key));
    return notifKeys.filter((k) => !seenSet.has(k)).length;
  }, [reports, replies, myReports, follows]);

  const value = {
    loading,
    reports,
    replies,
    myReports,
    follows,
    refresh,
    unseenCount,
    // ...
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
