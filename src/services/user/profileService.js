import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Upload profile image
export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return apiHandler(
    userAxios.put("/users/profile-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

// Update user profile
export const updateUserProfile = (profileData, token) => {
  return apiHandler(
    userAxios.put("/users/profile", profileData, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};
