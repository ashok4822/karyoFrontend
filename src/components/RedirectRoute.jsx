import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const RedirectRoute = function ({ element }) {
  const { user } = useSelector((state) => state.auth);
  if (user && user.role === "user") {
    return <Navigate to="/" />;
  }

  if (user && user.role === "admin") {
    return <Navigate to="/admin" />;
  }

  return element;
};

export default RedirectRoute;
