import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {


  const [isLogin, setIsLogin] = useState(() => {
    const storedLogin = localStorage.getItem("isLogin");
    return storedLogin === "true"; // แปลงค่าจาก string เป็น boolean
  });

  const [name, setName] = useState(() => {
    return localStorage.getItem("name") || "";
  });

  const login = () => setIsLogin(true);
  const logout = () => {
    setIsLogin(false);
    setName("");
    localStorage.removeItem("isLogin");
    localStorage.removeItem("name");
  };

  useEffect(() => {
    localStorage.setItem("isLogin", isLogin);
  }, [isLogin]);

  useEffect(() => {
    localStorage.setItem("name", name);
  }, [name]);

  return (
    <AuthContext.Provider value={{ isLogin, login, logout, setName, name }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
