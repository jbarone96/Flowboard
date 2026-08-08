import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import "./index.css";
import { AcceptInvite } from "./pages/AcceptInvite";
import { Board } from "./pages/Board";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Workspaces } from "./pages/Workspaces";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route path="/workspaces" element={<Layout><Workspaces /></Layout>} />
        <Route path="/board/:workspaceId" element={<Layout><Board /></Layout>} />
        <Route path="/invite/:token" element={<Layout><AcceptInvite /></Layout>} />
        <Route path="*" element={<Layout><div className="container">Page not found</div></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);