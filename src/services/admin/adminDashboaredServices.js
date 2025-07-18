import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

export const getDashboardData = (filters = {}) => {
  // Convert filters to query string
  const params = new URLSearchParams(filters).toString();
  return apiHandler(adminAxios.get(`/dashboard${params ? `?${params}` : ""}`));
};
