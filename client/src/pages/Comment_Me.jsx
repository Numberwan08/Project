import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ExternalLink, MessageSquare, CalendarDays } from 'lucide-react';

function Comment_Me() {
  const api = import.meta.env.VITE_API;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const [loading, setLoading] = useState(true);
  const [postComments, setPostComments] = useState([]); // places
  const [eventComments, setEventComments] = useState([]);
  const [postReplies, setPostReplies] = useState([]);
  const [eventReplies, setEventReplies] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('post'); // 'post' | 'event'
  const [typeFilter, setTypeFilter] = useState('comment'); // 'comment' | 'reply'
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchAll = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [p, e, pr, er] = await Promise.all([
          axios.get(`${api}post/comments/me/${userId}`),
          axios.get(`${api}event/comments/me/${userId}`),
          axios.get(`${api}comment/replies/me/${userId}`),
          axios.get(`${api}event/replies/me/${userId}`),
        ]);
        setPostComments(p.data?.data || []);
        setEventComments(e.data?.data || []);
        setPostReplies(pr.data?.data || []);
        setEventReplies(er.data?.data || []);
      } catch (_) {
        setPostComments([]);
        setEventComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [api, userId]);

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, typeFilter]);

  const activeList = useMemo(() => {
    if (sourceFilter === 'event') return typeFilter === 'reply' ? eventReplies : eventComments;
    return typeFilter === 'reply' ? postReplies : postComments;
  }, [sourceFilter, typeFilter, eventComments, postComments, eventReplies, postReplies]);
  const totalPages = Math.max(1, Math.ceil((activeList?.length || 0) / ITEMS_PER_PAGE));
  const paged = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return (activeList || []).slice(start, start + ITEMS_PER_PAGE);
  }, [activeList, page]);

  const buildLink = (item) => {
    try {
      if (sourceFilter === 'event') {
        if (typeFilter === 'reply') {
          if (!item?.id_event || !item?.id_comment || !item?.id_reply) return '#';
          return `/detall_event/${item.id_event}?highlightComment=${item.id_comment}&highlightReply=${item.id_reply}&suppressHiddenToast=1`;
        }
        if (!item?.id_event || !item?.id_comment) return '#';
        return `/detall_event/${item.id_event}?highlightComment=${item.id_comment}&suppressHiddenToast=1`;
      }
      if (typeFilter === 'reply') {
        if (!item?.id_post || !item?.id_comment || !item?.id_reply) return '#';
        return `/detall_att/${item.id_post}?highlightComment=${item.id_comment}&highlightReply=${item.id_reply}&suppressHiddenToast=1`;
      }
      if (!item?.id_post || !item?.id_comment) return '#';
      return `/detall_att/${item.id_post}?highlightComment=${item.id_comment}&suppressHiddenToast=1`;
    } catch {
      return '#';
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">ความคิดเห็นของฉัน</h1>
        <div className="inline-flex rounded-lg border overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm ${sourceFilter === 'post' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setSourceFilter('post')}
          >
            สถานที่
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm border-l ${sourceFilter === 'event' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setSourceFilter('event')}
          >
            กิจกรรม
          </button>
        </div>
        <div className="inline-flex rounded-lg border overflow-hidden ml-2">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm ${typeFilter === 'comment' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setTypeFilter('comment')}
          >
            ความคิดเห็น
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm border-l ${typeFilter === 'reply' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setTypeFilter('reply')}
          >
            ตอบกลับ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium w-[36%]">สถานที่/กิจกรรม</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[44%]">{typeFilter === 'reply' ? 'ตอบกลับ' : 'ความคิดเห็น'}</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[20%]">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-500">กำลังโหลด...</td>
                </tr>
              ) : (paged || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12">
                    <div className="text-center text-gray-400">ยังไม่มีความคิดเห็น</div>
                  </td>
                </tr>
              ) : (
                paged.map((item) => (
                  <tr key={`${sourceFilter}-${typeFilter}-${item.id_comment || item.id_reply}`} className="hover:bg-purple-50/60">
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {sourceFilter === 'event' ? (
                          <CalendarDays className="w-4 h-4 text-purple-600" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                        )}
                        <span className="truncate">{sourceFilter === 'event' ? (item.event_name || '-') : (item.post_name || '-')}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{formatDate(item.date_comment)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{typeFilter === 'reply' ? (item.reply || '-') : (item.comment || '-')}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <a
                        href={buildLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                      >
                        <ExternalLink className="w-4 h-4" /> ไปยังต้นโพสต์
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {(activeList?.length || 0) > 0 ? (
              <>
                แสดง {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, activeList.length)} จากทั้งหมด {activeList.length} รายการ
              </>
            ) : (
              <>ไม่มีรายการ</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border bg-white disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border bg-white disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Comment_Me;
