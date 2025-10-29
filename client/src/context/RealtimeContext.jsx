import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    try {
      // Derive socket base URL and path from VITE_API (supports absolute or relative)
      const resolveSocketTarget = () => {
        let base = '';
        let path = '/socket.io';
        const api = import.meta.env.VITE_API;
        if (api) {
          try {
            const u = new URL(api, typeof window !== 'undefined' ? window.location.origin : undefined);
            base = u.origin; // strip path
            const apiPath = u.pathname.replace(/\/+$/, '');
            if (apiPath && apiPath !== '/') path = `${apiPath}/socket.io`;
          } catch (_) {
            // If URL failed (e.g., relative), derive from window
            if (typeof window !== 'undefined' && window.location) {
              base = window.location.origin;
              const apiPath = String(api).replace(/\/+$/, '');
              if (apiPath && apiPath !== '/') path = `${apiPath}/socket.io`;
            }
          }
        } else if (typeof window !== 'undefined' && window.location) {
          base = window.location.origin;
        }
        return { base: base || undefined, path };
      };

      const { base, path } = resolveSocketTarget();
      const s = io(base, {
        path,
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
