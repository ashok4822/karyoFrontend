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

// Create Razorpay order
export const createRazorpayOrder = (amount, currency = "INR", receipt = null) => {
  return apiHandler(
    userAxios.post("/orders/razorpay/order", { amount, currency, receipt })
  );
};

// Verify Razorpay payment
export const verifyRazorpayPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  return apiHandler(
    userAxios.post("/orders/razorpay/verify", { razorpay_order_id, razorpay_payment_id, razorpay_signature })
  );
};

// Update online payment status (for retry payment)
export const updateOnlinePaymentStatus = (orderId, paymentStatus) => {
  return apiHandler(
    userAxios.patch(`/orders/${orderId}/payment-status`, { paymentStatus })
  );
};

// Check stock for all items in an order before payment
export const checkOrderStock = (items) => {
  return apiHandler(
    userAxios.post("/orders/check-stock", { items })
  );
};
