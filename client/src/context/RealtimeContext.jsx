import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    try {
      // Derive socket base URL from VITE_API origin or current window origin
      let base = '';
      try {
        const api = import.meta.env.VITE_API;
        if (api) {
          const u = new URL(api);
          base = u.origin; // strip path like /api
        }
      } catch (_) {}
      if (!base && typeof window !== 'undefined' && window.location) {
        base = window.location.origin;
      }
      // Fallback to relative if still empty
      const url = base || undefined;
      const s = io(url, {
        transports: ['websocket', 'polling'],
        withCredentials: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
      });
      socketRef.current = s;
      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      return () => {
        try {
          s.off('connect', onConnect);
          s.off('disconnect', onDisconnect);
          s.close();
        } catch {}
        socketRef.current = null;
        setConnected(false);
      };
    } catch (_) {
      setConnected(false);
    }
  }, []);

  const value = useMemo(() => ({
    connected,
    on: (evt, cb) => socketRef.current?.on(evt, cb),
    off: (evt, cb) => socketRef.current?.off(evt, cb),
    emit: (evt, payload) => socketRef.current?.emit(evt, payload),
  }), [connected]);

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
