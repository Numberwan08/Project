import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, setName } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username,
      password,
    };
    try {
      const res = await axios.post(import.meta.env.VITE_API + "login", payload);
      login();
      navigate("/");
      setName(res.data.data);
      console.log(res.data.data)
    } catch (error) {}
  };

  return (
    <div className="h-screen">
      <div className="flex justify-content items-center">
        <div className="card">
          <div className="card-title">
            <h2>เข้าสู่ระบบ</h2>
          </div>
          <div className="card-boby">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                name="username"
              />
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
              />
              <button title="submit" className="btn btn-error mt-2 w-full">
                login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
