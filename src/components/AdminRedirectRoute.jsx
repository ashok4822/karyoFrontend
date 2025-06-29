import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRedirectRoute = function ({ element }) {
  const { admin, adminAccessToken } = useSelector((state) => state.auth);
  
  if (admin && admin.role === "admin" && adminAccessToken) {
    return <Navigate to="/admin" replace />;
  }

  return element;
};

export default AdminRedirectRoute; 