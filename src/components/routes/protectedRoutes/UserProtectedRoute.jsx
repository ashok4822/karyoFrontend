import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const UserProtectedRoute = ({ children }) => {
  const { user, userAccessToken } = useSelector((state) => state.auth);

  // Don't check isDeleted here - let the backend and individual components handle that
  if (!user || user?.role !== "user" || !userAccessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
