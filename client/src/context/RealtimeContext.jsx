import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;
    try {
      const base = import.meta.env.VITE_API;
      const origin = base ? new URL(base).origin : window.location.origin;
      const { io } = require('socket.io-client');
      socket = io(origin, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
    } catch (e) {
      // ignore
    }
    return () => {
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, []);

  const value = useMemo(() => ({
    connected,
    on: (evt, cb) => socketRef.current?.on(evt, cb),
    off: (evt, cb) => socketRef.current?.off(evt, cb),
  }), [connected]);

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);

