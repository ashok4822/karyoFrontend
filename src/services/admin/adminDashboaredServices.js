import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

export const getDashboardData = () => {
  return apiHandler(adminAxios.get("/dashboard"));
};
