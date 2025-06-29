import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const { admin, adminAccessToken } = useSelector((state) => state.auth);
  if (!admin || admin?.role !== "admin" || !adminAccessToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export default AdminProtectedRoute;
