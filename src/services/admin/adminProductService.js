import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

// Create a new product
export const createProduct = (formData) => {
  return apiHandler(
    adminAxios.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};

// Update a product
export const updateProduct = (productId, formData) => {
  return apiHandler(
    adminAxios.put(`/products/${productId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};

// Create a new variant for a product
export const createVariant = (productId, formData) => {
  return apiHandler(
    adminAxios.post(`/products/${productId}/variants`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};

// Update a variant for a product
export const updateVariant = (productId, variantId, formData) => {
  return apiHandler(
    adminAxios.put(`/products/${productId}/variants/${variantId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};

// Fetch all products
export const getAllProducts = (params = {}) => {
  return apiHandler(adminAxios.get("/products", { params }));
};

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
