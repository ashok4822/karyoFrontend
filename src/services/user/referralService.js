import userAxios from "../../lib/userAxios";

// Generate referral code for user
export const generateReferralCode = async () => {
  try {
    const response = await userAxios.post("/api/user/referral/generate-code");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user's referral code and stats
export const getReferralCode = async () => {
  try {
    const response = await userAxios.get("/api/user/referral/code");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Generate referral link with token
export const generateReferralLink = async () => {
  try {
    const response = await userAxios.post("/api/user/referral/generate-link");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user's referral history
export const getReferralHistory = async (page = 1, limit = 10) => {
  try {
    const response = await userAxios.get(`/api/user/referral/history?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get user's referral statistics
export const getReferralStats = async () => {
  try {
    const response = await userAxios.get("/api/user/referral/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Validate referral code/token
export const validateReferral = async (referralCode, referralToken) => {
  try {
    const response = await userAxios.post("/api/referral/validate", {
      referralCode,
      referralToken,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 