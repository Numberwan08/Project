import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRealtime } from './RealtimeContext';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { userId: authUserId } = useAuth();
  // Track current userId from AuthContext so notifications update on login/logout
  const userId = authUserId;
  const [reports, setReports] = useState({ pending_count: 0, resolved_count: 0, pending: [], resolved: [] });
  const [replies, setReplies] = useState({ posts: [], events: [] });
  const [myReports, setMyReports] = useState({ pending: [], resolved: [] });
  const [loading, setLoading] = useState(false);
  // In-memory + persisted (localStorage) list of follow notifications
  const [follows, setFollows] = useState([]);

  // Load persisted follows per-user when userId changes
  useEffect(() => {
    try {
      if (!userId) { setFollows([]); return; }
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
      // Fetch reports about me
      const rep = await axios.get(`${import.meta.env.VITE_API}report/me/${userId}`);
      const list = Array.isArray(rep?.data?.data) ? rep.data.data : [];
      const pending = list.filter((x) => Number(x.status) === 1);
      const resolved = list.filter((x) => Number(x.status) === 0);
      setReports({
        pending_count: pending.length,
        resolved_count: resolved.length,
        pending,
        resolved,
      });

      // Replies to my comments (places)
      const [rp1, rp2, myRep] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API}comment/replies/to_me/${userId}`),
        axios.get(`${import.meta.env.VITE_API}event/replies/to_me/${userId}`),
        axios.get(`${import.meta.env.VITE_API}report/my/${userId}`),
      ]);
      setReplies({
        posts: Array.isArray(rp1?.data?.data) ? rp1.data.data : [],
        events: Array.isArray(rp2?.data?.data) ? rp2.data.data : [],
      });
      // My submitted reports (we will notify when resolved)
      const myList = Array.isArray(myRep?.data?.data) ? myRep.data.data : [];
      const myPending = myList.filter((x) => Number(x.status) === 1);
      const myResolved = myList.filter((x) => Number(x.status) === 0);
      setMyReports({ pending: myPending, resolved: myResolved });
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Realtime: listen for updates and refresh when relevant
  useEffect(() => {
    if (!realtime || !realtime.on) return;
    const onReport = (payload) => {
      if (!payload) return;
      if (String(payload.reporter_id || '') === String(userId || '')) {
        refresh();
        toast.success('รายงานดำเนินการเสร็จสิ้น', { position: 'top-center', autoClose: 1500 });
      }
    };
    const onReply = (payload) => {
      if (!payload) return;
      if (String(payload.target_user_id || '') === String(userId || '')) {
        refresh();
      }
    };
    const onCommentHidden = (payload) => {
      if (!payload) return;
      if (String(payload.target_user_id || '') === String(userId || '')) {
        toast.info('ความคิดเห็นของคุณถูกลบแล้ว', { position: 'top-center', autoClose: 1500 });
        refresh();
      }
    };
    const onFollowNew = async (payload) => {
      try {
        if (!payload) return;
        if (String(payload.target_user_id || '') !== String(userId || '')) return;
        const fid = payload.follower_id;
        const ts = Date.now();
        // 1) Add immediately with placeholder name, so bell shows up instantly
        const placeholder = { key: `fol-${ts}-${fid}`, follower_id: fid, first_name: 'สมาชิก', ts };
        setFollows((prev) => {
          const next = [placeholder, ...prev].slice(0, 50);
          try { if (userId) localStorage.setItem(`notifFollows:${userId}`, JSON.stringify(next)); } catch {}
          return next;
        });
        // 2) Resolve follower name async and update the latest entry
        try {
          const res = await axios.get(`${import.meta.env.VITE_API}profile/${fid}`);
          const name = res?.data?.data?.first_name || 'สมาชิก';
          setFollows((prev) => {
            const next = prev.map((x) => x.key === placeholder.key ? { ...x, first_name: name } : x);
            try { if (userId) localStorage.setItem(`notifFollows:${userId}`, JSON.stringify(next)); } catch {}
            return next;
          });
        } catch {}
      } catch {}
    };
    realtime.on('report-status-updated', onReport);
    realtime.on('new-reply', onReply);
    realtime.on('comment-hidden', onCommentHidden);
    realtime.on('follow-new', onFollowNew);
    return () => {
      try {
        realtime.off('report-status-updated', onReport);
        realtime.off('new-reply', onReply);
        realtime.off('comment-hidden', onCommentHidden);
        realtime.off('follow-new', onFollowNew);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, userId]);

  const totalCount = (reports?.pending_count || 0)
    + (replies?.posts?.length || 0)
    + (replies?.events?.length || 0)
    + (myReports?.resolved?.length || 0)
    + (follows?.length || 0);

  // Allow consumers to persist seen signature to avoid duplicate UI
  const signature = useMemo(() => {
    const latestRep = Math.max(
      ...(reports?.pending?.map((x) => Number(x.id_report_comment || 0)) || [0]),
      ...(reports?.resolved?.map((x) => Number(x.id_report_comment || 0)) || [0])
    );
    const latestRpl = Math.max(
      ...(replies?.posts?.map((x) => Number(x.id_reply || 0)) || [0]),
      ...(replies?.events?.map((x) => Number(x.id_reply || 0)) || [0])
    );
    const latestMyRep = Math.max(
      ...(myReports?.pending?.map((x) => Number(x.id_report_comment || 0)) || [0]),
      ...(myReports?.resolved?.map((x) => Number(x.id_report_comment || 0)) || [0])
    );
    return `${reports?.pending_count || 0}|${reports?.resolved_count || 0}|${latestRep}|${latestRpl}|${latestMyRep}`;
  }, [reports, replies, myReports]);

  const value = {
    loading,
    reports,
    replies,
    myReports,
    follows,
    refresh,
    totalCount,
    signature,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
