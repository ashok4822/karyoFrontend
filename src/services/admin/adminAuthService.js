import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

export const adminLogin = (formData) => {
  return apiHandler(adminAxios.post("/login", formData));
};
