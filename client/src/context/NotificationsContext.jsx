import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [reports, setReports] = useState({ pending_count: 0, resolved_count: 0, pending: [], resolved: [] });
  const [replies, setReplies] = useState({ posts: [], events: [] });
  const [myReports, setMyReports] = useState({ pending: [], resolved: [] });
  const [loading, setLoading] = useState(false);

  const userId = useMemo(() => {
    try { return localStorage.getItem('userId'); } catch { return null; }
  }, []);

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

  const totalCount = (reports?.pending_count || 0) + (replies?.posts?.length || 0) + (replies?.events?.length || 0) + (myReports?.resolved?.length || 0);

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
    refresh,
    totalCount,
    signature,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
