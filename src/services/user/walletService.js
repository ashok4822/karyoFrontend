import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Fetch wallet balance
export const fetchWalletBalance = () => {
  return apiHandler(userAxios.get("/users/wallet"));
};

export const getWallet = async () => {
  return await apiHandler(userAxios.get("/users/wallet"));
};

export const addFunds = async ({ amount, description }) => {
  return await apiHandler(
    userAxios.post("/users/wallet/add", { amount, description })
  );
};

export const deductFunds = async ({ amount, description }) => {
  return await apiHandler(
    userAxios.post("/users/wallet/deduct", { amount, description })
  );
};

// Create Razorpay order for wallet add funds
export const createWalletRazorpayOrder = async ({ amount, description }) => {
  return await apiHandler(
    userAxios.post("/users/wallet/razorpay/order", { amount, description })
  );
};

// Verify Razorpay payment and add funds to wallet
export const verifyWalletPayment = async (paymentData) => {
  return await apiHandler(
    userAxios.post("/users/wallet/razorpay/verify", paymentData)
  );
};
