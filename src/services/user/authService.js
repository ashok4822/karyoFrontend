import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Get user profile using token
export const fetchUserProfile = (token) => {
  return apiHandler(
    userAxios.get("/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};

// Login service for user
export const loginUser = (email, password) => {
  return apiHandler(userAxios.post("auth/login", { email, password }));
};

// Request OTP for password reset
export const requestPasswordResetOtp = (email) => {
  return apiHandler(
    userAxios.post("auth/request-password-reset-otp", { email })
  );
};

// Verify OTP for password reset
export const verifyPasswordResetOtp = (email, otp) => {
  return apiHandler(
    userAxios.post("auth/verify-password-reset-otp", { email, otp })
  );
};

// Reset Password
export const resetPassword = (email, resetToken, newPassword) => {
  return apiHandler(
    userAxios.post("auth/reset-password", {
      email,
      resetToken,
      newPassword,
    })
  );
};
