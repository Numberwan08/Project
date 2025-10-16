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
      setFollows((prev) => {
        // Keep realtime entries intact
        const realtimeFollows = (prev || []).filter(
          (p) => !p.key?.startsWith("fol-api-")
        );
        // Build API entries, preserve previous ts if present to avoid reordering on refresh
        const prevByKey = new Map((prev || []).map((x) => [x.key, x]));
        const apiEntries = followersFromApi.map((f) => {
          const key = `fol-api-${f.id_follower}`;
          const old = prevByKey.get(key);
          return {
            key,
            follower_id: f.id_follower,
            first_name: f.first_name,
            ts: old?.ts || Date.now(),
          };
        });
        // Merge realtime + api entries without dropping existing API items
        const combined = [...realtimeFollows, ...apiEntries];
        const seen = new Set();
        const next = [];
        for (const it of combined) {
          const k = it?.key;
          if (!k || seen.has(k)) continue;
          seen.add(k);
          next.push(it);
        }
        try {
          localStorage.setItem(`notifFollows:${userId}`, JSON.stringify(next));
        } catch {}
        return next.slice(0, 50);
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

  // Removed periodic polling; rely on realtime events + manual refresh

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
    const onNewReply = (payload) => {
      try {
        if (!payload || String(payload.target_user_id || "") !== String(userId || "")) return;
        const { id_reply, id_comment, scope, reply_date } = payload;
        setReplies((prev) => {
          const p = Array.isArray(prev?.posts) ? prev.posts : [];
          const e = Array.isArray(prev?.events) ? prev.events : [];
          if (String(scope) === "event") {
            const exists = e.some((r) => String(r.id_reply) === String(id_reply));
            const item = { id_reply, id_comment, reply_date };
            return exists ? prev : { ...prev, events: [item, ...e].slice(0, 100) };
          } else {
            const exists = p.some((r) => String(r.id_reply) === String(id_reply));
            const item = { id_reply, id_comment, reply_date };
            return exists ? prev : { ...prev, posts: [item, ...p].slice(0, 100) };
          }
        });
      } catch {}
    };
    realtime.on("new-reply", onNewReply);
    return () => {
      // ... realtime.off calls
      try {
        realtime.off("follow-new", onFollowNew);
        realtime.off("new-reply", onNewReply);
      } catch {}
    };
  }, [realtime, userId]);

  // ... (โค้ดส่วน totalCount และ signature เหมือนเดิม)

  // Calculate unseen notifications count (reports + replies + follows) and update reactively
  const unseenCount = useMemo(() => {
    if (!userId) return 0;
    let seenKeys = [];
    let deletedKeys = [];
    try {
      const rawSeen = localStorage.getItem(`notifSeenKeys:${userId}`);
      seenKeys = rawSeen ? JSON.parse(rawSeen) : [];
    } catch {}
    try {
      const rawDel = localStorage.getItem(`notifDeletedKeys:${userId}`);
      deletedKeys = rawDel ? JSON.parse(rawDel) : [];
    } catch {}
    const seenSet = new Set(Array.isArray(seenKeys) ? seenKeys : []);
    const deletedSet = new Set(Array.isArray(deletedKeys) ? deletedKeys : []);
    const notifKeys = [];
    (reports?.pending || []).forEach((it) =>
      notifKeys.push(`rc-${it.id_report_comment}`)
    );
    (reports?.resolved || []).forEach((it) =>
      notifKeys.push(`rc-${it.id_report_comment}`)
    );
    (replies?.posts || []).forEach((r) =>
      notifKeys.push(`rplp-${r.id_reply}`)
    );
    (replies?.events || []).forEach((r) =>
      notifKeys.push(`rple-${r.id_reply}`)
    );
    (myReports?.resolved || []).forEach((it) =>
      notifKeys.push(`mrs-${it.id_report_comment}`)
    );
    (follows || []).forEach((f) => notifKeys.push(f.key));
    const uniqKeys = Array.from(new Set(notifKeys));
    return uniqKeys.filter((k) => !seenSet.has(k) && !deletedSet.has(k)).length;
  }, [reports, replies, myReports, follows, userId]);

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
