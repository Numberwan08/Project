import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const RealtimeContext = createContext();

export const RealtimeProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
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
