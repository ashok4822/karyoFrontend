import userAxios from "../../lib/userAxios";
import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

// User Referral APIs

export const getReferralCode = () => {
  return apiHandler(userAxios.get("/api/user/referral/code"));
};

export const postGenerateReferralCode = () => {
  return apiHandler(userAxios.post("/api/user/referral/generate-code"));
};

export const postGenerateReferralLink = () => {
  return apiHandler(userAxios.post("/api/user/referral/generate-link"));
};

export const getReferralHistory = (page = 1, limit = 10) => {
  return apiHandler(
    userAxios.get("/api/user/referral/history", {
      params: { page, limit },
    })
  );
};

export const getReferralStats = () => {
  return apiHandler(userAxios.get("/api/user/referral/stats"));
};

export const validateReferral = (referralCode, referralToken) => {
  return apiHandler(
    userAxios.post("/api/referral/validate", {
      referralCode,
      referralToken,
    })
  );
};

// Admin Referral APIs

export const fetchAdminReferrals = (params = {}) => {
  return apiHandler(adminAxios.get("/api/referrals", { params }));
};
