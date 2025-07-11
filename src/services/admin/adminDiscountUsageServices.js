import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

export const getUsageStats = (page = 1, search = "") => {
  return apiHandler(
    adminAxios.get("/discounts/usage-stats", {
      params: {
        page,
        limit: 10,
        search,
      },
    })
  );
};
