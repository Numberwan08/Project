import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const { userId } = useAuth();
  const [reports, setReports] = useState([]); // all reports (admin)
  const [myReports, setMyReports] = useState([]); // reports against me
  const [mySubmitted, setMySubmitted] = useState([]); // reports I submitted
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingSubmitted, setLoadingSubmitted] = useState(false);
  const api = import.meta.env.VITE_API;

  const refreshReports = async () => {
    try {
      setLoadingAll(true);
      const res = await axios.get(`${api}report/comments`);
      setReports(res.data?.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const refreshMyReports = async () => {
    if (!userId) {
      setMyReports([]);
      return;
    }
    try {
      setLoadingMine(true);
      const res = await axios.get(`${api}report/me/${userId}`);
      setMyReports(res.data?.data || []);
    } catch {
      setMyReports([]);
    } finally {
      setLoadingMine(false);
    }
  };

  // --- START: ส่วนที่แก้ไข ---
  const refreshMySubmitted = async () => {
    if (!userId) {
      setMySubmitted([]);
      return;
    }
    try {
      setLoadingSubmitted(true);
      const res = await axios.get(`${api}report/my/${userId}`);
      // แก้ไขบรรทัดนี้: ให้ดึงข้อมูลจาก res.data.data.reports
      // เพื่อให้แน่ใจว่า mySubmitted เป็น Array เสมอ
      const submittedReports = res.data?.data?.reports || [];
      setMySubmitted(Array.isArray(submittedReports) ? submittedReports : []);
    } catch {
      setMySubmitted([]);
    } finally {
      setLoadingSubmitted(false);
    }
  };
  // --- END: ส่วนที่แก้ไข ---

  useEffect(() => {
    refreshReports();
  }, []);

  useEffect(() => {
    refreshMyReports();
    refreshMySubmitted();
  }, [userId]);

  const value = useMemo(
    () => ({
      reports,
      myReports,
      mySubmitted,
      totalReports:
        (reports || []).filter((r) => Number(r?.status) !== 0).length || 0,
      myReportCount: myReports.length || 0,
      loadingAll,
      loadingMine,
      loadingSubmitted,
      refreshReports,
      refreshMyReports,
      refreshMySubmitted,
      isReportedComment: (id_comment) =>
        (mySubmitted || []).some(
          (r) => r.id_comment && String(r.id_comment) === String(id_comment)
        ),
      isReportedReply: (id_reply) =>
        (mySubmitted || []).some(
          (r) => r.id_reply && String(r.id_reply) === String(id_reply)
        ),
      // Event-specific helpers
      isReportedEventComment: (id_event_comment) =>
        (mySubmitted || []).some(
          (r) =>
            r.source === "event" &&
            r.id_event_comment &&
            String(r.id_event_comment) === String(id_event_comment)
        ),
      isReportedEventReply: (id_event_reply) =>
        (mySubmitted || []).some(
          (r) =>
            r?.source === "event" &&
            r.id_event_reply &&
            String(r.id_event_reply) === String(id_event_reply)
        ),
    }),
    [reports, myReports, mySubmitted, loadingAll, loadingMine, loadingSubmitted]
  );

  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
};

export const useReport = () => useContext(ReportContext);