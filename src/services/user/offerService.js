import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Get best offer for a specific product
export const getBestOfferForProduct = (productId) => {
  return apiHandler(userAxios.get(`/api/offers/product/${productId}`));
};

// Get best offers for multiple products
export const getBestOffersForProducts = (productIds) => {
  const promises = productIds.map((productId) =>
    userAxios.get(`/api/offers/product/${productId}`)
  );

  return Promise.all(promises)
    .then((responses) => {
      const offersMap = {};
      responses.forEach((response, index) => {
        if (response.data?.success && response.data?.data) {
          offersMap[productIds[index]] = response.data.data;
        }
      });
      return { success: true, data: offersMap };
    })
    .catch((error) => {
      console.error("Error fetching best offers for products:", error);
      throw error;
    });
};

// Get offers for a specific category
export const getOffersByCategory = (categoryId, page = 1, limit = 10) => {
  return apiHandler(
    userAxios.get(`/api/offers/category/${categoryId}`, {
      params: { page, limit },
    })
  );
};

// Get offers for specific products
export const getOffersByProducts = (productIds) => {
  return apiHandler(userAxios.post("/api/offers/products", { productIds }));
};

// Get all active offers (for offers page)
export const getAllActiveOffers = (page = 1, limit = 12) => {
  return apiHandler(
    userAxios.get("/api/offers", {
      params: { page, limit },
    })
  );
};
