import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

// Create a new offer
export const createOffer = (offerData) =>
  apiHandler(adminAxios.post("/offers", offerData));

// Get all offers with filters
export const getOffers = (params = {}) =>
  apiHandler(adminAxios.get("/offers", { params }));

// Get offer by ID
export const getOfferById = (offerId) =>
  apiHandler(adminAxios.get(`/offers/${offerId}`));

// Update offer
export const updateOffer = (offerId, offerData) =>
  apiHandler(adminAxios.put(`/offers/${offerId}`, offerData));

// Delete offer
export const deleteOffer = (offerId) =>
  apiHandler(adminAxios.delete(`/offers/${offerId}`));

// Toggle offer status
export const toggleOfferStatus = (offerId, newStatus) =>
  apiHandler(
    adminAxios.patch(`/offers/${offerId}/status`, { status: newStatus })
  );

// Get offer statistics
export const getOfferStats = () => apiHandler(adminAxios.get("/offers/stats"));

// Get best offer for a product
export const getBestOfferForProduct = (productId) =>
  apiHandler(adminAxios.get(`/offers/product/${productId}`));

// Get offers for a category
export const getOffersByCategory = (categoryId, params = {}) =>
  apiHandler(adminAxios.get(`/offers/category/${categoryId}`, { params }));

// Get offers for specific products
export const getOffersByProducts = (productIds) =>
  apiHandler(adminAxios.post("/offers/products", { productIds }));
