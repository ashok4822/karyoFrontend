import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

export const getOrderById = (orderId) => {
  return apiHandler(adminAxios.get(`/orders/${orderId}`));
};

export const updateOrderStatus = (orderId, status) => {
  return apiHandler(adminAxios.put(`/orders/${orderId}/status`, { status }));
};

export const updatePaymentStatus = (orderId, paymentStatus) => {
  return apiHandler(
    adminAxios.put(`/orders/${orderId}/payment-status`, { paymentStatus })
  );
};

export const updateOrderItemStatus = (orderId, itemId, status) => {
  return apiHandler(
    adminAxios.put(`/orders/${orderId}/items/${itemId}/status`, { status })
  );
};

export const updateOrderItemPaymentStatus = (
  orderId,
  itemId,
  paymentStatus
) => {
  return apiHandler(
    adminAxios.put(`/orders/${orderId}/items/${itemId}/status`, {
      paymentStatus,
    })
  );
};

export const getAllOrders = ({
  page = 1,
  limit = 10,
  status,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  console.log('getAllOrders service called with params:', {
    page,
    limit,
    status,
    search,
    sortBy,
    sortOrder,
  });
  return apiHandler(
    adminAxios.get("/orders", {
      params: {
        page,
        limit,
        status,
        search,
        sortBy,
        sortOrder,
      },
    })
  );
};

export const deleteOrderById = (orderId) => {
  return apiHandler(adminAxios.delete(`/orders/${orderId}`));
};


