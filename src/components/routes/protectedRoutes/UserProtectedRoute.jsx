import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const UserProtectedRoute = ({ children }) => {
  const { user, userAccessToken } = useSelector((state) => state.auth);

  if (!user || user?.role !== "user" || !userAccessToken || user?.isDeleted) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default UserProtectedRoute;
