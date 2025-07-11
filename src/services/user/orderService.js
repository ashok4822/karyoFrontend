import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Check COD availability for an address and total
export const checkCOD = (state, total) => {
  return apiHandler(
    userAxios.post("/orders/check-cod", {
      state,
      total,
    })
  );
};

// Fetch user orders with pagination and optional search
export const fetchUserOrders = ({ page = 1, limit = 10, search = "" }) => {
  const params = {
    page,
    limit,
    ...(search?.trim() && { search: search.trim() }),
  };

  return apiHandler(userAxios.get("/orders", { params }));
};

// Submit a return request
export const submitReturnRequest = (orderId, items, token = null) => {
  return apiHandler(
    userAxios.post(
      `/users/orders/${orderId}/return`,
      { items },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    )
  );
};
