import adminAxios from "../../lib/adminAxios";
import { apiHandler } from "../../utils/apiHandler";

// Reusable: Fetch categories by status
export const getCategories = ({
  page = 1,
  limit = 10,
  search = "",
  sort = "asc",
  status, // 'active' or 'inactive'
}) => {
  return apiHandler(
    adminAxios.get("/categories", {
      params: {
        page,
        limit,
        search,
        sort,
        status, // Optional param
      },
    })
  );
};

// Create a category
export const createCategory = (formData) => {
  return apiHandler(adminAxios.post("/categories", formData));
};

// Update a category
export const updateCategory = (categoryId, formData) => {
  return apiHandler(adminAxios.put(`/categories/${categoryId}`, formData));
};

// Delete a category
export const deleteCategory = (categoryId) => {
  return apiHandler(adminAxios.delete(`/categories/${categoryId}`));
};

// Restore a deleted category
export const restoreCategory = (categoryId) => {
  return apiHandler(adminAxios.patch(`/categories/${categoryId}/restore`));
};

// Fetch all active categories (no pagination)
export const getAllActiveCategories = () => {
  return apiHandler(adminAxios.get("/categories/active"));
};

export const getAllCategories = (params = {}) => {
  return apiHandler(adminAxios.get("/categories", { params }));
};
