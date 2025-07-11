import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Send OTP to update email
export const requestEmailChangeOtp = (email, token) => {
  return apiHandler(
    userAxios.post(
      "/users/request-email-change-otp",
      { email },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
  );
};

// Verify OTP and update user email
export const verifyEmailChangeOtp = (email, otp, token) => {
  return apiHandler(
    userAxios.post(
      "/users/verify-email-change-otp",
      { email, otp },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
  );
};

export const getUserProfile = async () => {
  return await apiHandler(userAxios.get("/users/profile"));
};
