import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Get all shipping addresses of the user
export const fetchUserShippingAddresses = (token) => {
  return apiHandler(
    userAxios.get("/users/shipping-addresses", {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};

// Add new shipping address
export const addUserShippingAddress = (addressData, token) => {
  return apiHandler(
    userAxios.post("/users/shipping-address", addressData, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};

// Set address as default
export const setDefaultAddress = (addressId, token) => {
  return apiHandler(
    userAxios.put(
      `/users/shipping-address/${addressId}/default`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
  );
};

// Update a shipping address
export const updateUserShippingAddress = (addressId, addressData, token) => {
  return apiHandler(
    userAxios.put(`/users/shipping-address/${addressId}`, addressData, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};

// Delete a shipping address
export const deleteUserShippingAddress = (addressId, token) => {
  return apiHandler(
    userAxios.delete(`/users/shipping-address/${addressId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
};


