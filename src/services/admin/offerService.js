import adminAxios from "../../lib/adminAxios";

// Create a new offer
export const createOffer = async (offerData) => {
  try {
    const response = await adminAxios.post("/api/admin/offers", offerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all offers with filters
export const getOffers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await adminAxios.get(`/api/admin/offers?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get offer by ID
export const getOfferById = async (offerId) => {
  try {
    const response = await adminAxios.get(`/api/admin/offers/${offerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update offer
export const updateOffer = async (offerId, offerData) => {
  try {
    const response = await adminAxios.put(`/api/admin/offers/${offerId}`, offerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete offer
export const deleteOffer = async (offerId) => {
  try {
    const response = await adminAxios.delete(`/api/admin/offers/${offerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Toggle offer status
export const toggleOfferStatus = async (offerId, status) => {
  try {
    const response = await adminAxios.patch(`/api/admin/offers/${offerId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get offer statistics
export const getOfferStats = async () => {
  try {
    const response = await adminAxios.get("/api/admin/offers/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get best offer for a product
export const getBestOfferForProduct = async (productId) => {
  try {
    const response = await adminAxios.get(`/api/offers/product/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get offers for a category
export const getOffersByCategory = async (categoryId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await adminAxios.get(`/api/offers/category/${categoryId}?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get offers for specific products
export const getOffersByProducts = async (productIds) => {
  try {
    const response = await adminAxios.post("/api/offers/products", { productIds });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 