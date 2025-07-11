import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

export const adminLogin = (formData) => {
  return apiHandler(adminAxios.post("/login", formData));
};

// Refresh admin token
export const refreshAdminToken = () => {
  return apiHandler(adminAxios.post("/refresh-token"));
};

// Get admin profile using token
export const fetchAdminProfile = (token) => {
  return apiHandler(
    adminAxios.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};

// Logout admin
export const logoutAdminApi = () => {
  return apiHandler(adminAxios.post("/logout"));
};
