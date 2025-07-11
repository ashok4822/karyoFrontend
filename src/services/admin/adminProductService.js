import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

// Fetch all variant options (e.g., colours, capacities)
export const getVariantOptions = () => {
  return apiHandler(adminAxios.get("/products/variant-options"));
};

// Fetch all brand options
export const getBrandOptions = () => {
  return apiHandler(adminAxios.get("/products/brand-options"));
};

export const deleteProduct = (productId) => {
  return apiHandler(adminAxios.delete(`/products/${productId}`));
};

export const deleteVariant = (productId, variantId) => {
  return apiHandler(
    adminAxios.delete(`/products/${productId}/variants/${variantId}`)
  );
};
