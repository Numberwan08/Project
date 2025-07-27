import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {


  const [isLogin, setIsLogin] = useState(() => {
    const storedLogin = localStorage.getItem("isLogin");
    return storedLogin === "true";
  });

  const [name, setName] = useState(() => {
    return localStorage.getItem("name") || "";
  });

  const [userId, setUserId] = useState(() => {
    return localStorage.getItem("userId") || "";
  });

  const login = () => setIsLogin(true);
  const logout = () => {
    setIsLogin(false);
    setName("");
    localStorage.removeItem("isLogin");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
  };

  useEffect(() => {
    localStorage.setItem("isLogin", isLogin);
  }, [isLogin]);

  useEffect(() => {
    localStorage.setItem("name", name);
    localStorage.setItem("userId", userId);
  }, [name]);

  return (
    <AuthContext.Provider value={{ isLogin, login, logout, setName, name , setUserId, userId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
