import userAxios from "../../lib/userAxios";
import { apiHandler } from "../../utils/apiHandler";

// Fetch single product by ID
export const fetchProductById = (id) => {
  return apiHandler(userAxios.get(`/products/${id}`));
};

// Fetch related products by category (excluding current product)
export const fetchRelatedProductsByCategory = ({
  categoryId,
  excludeId,
  limit = 4,
}) => {
  return apiHandler(
    userAxios.get("/products", {
      params: {
        category: categoryId,
        limit,
        exclude: excludeId,
      },
    })
  );
};

// Fetch all categories
export const fetchCategories = () => {
  return apiHandler(userAxios.get("/categories"));
};

// Fetch all brand options
export const fetchBrandOptions = () => {
  return apiHandler(userAxios.get("/products/brand-options"));
};

// Fetch all variant options
export const fetchVariantOptions = () => {
  return apiHandler(userAxios.get("/products/variant-options"));
};

export const getFeaturedProductByCategory = (categoryId) => {
  return apiHandler(
    userAxios.get("/products", {
      params: { category: categoryId, limit: 1 },
    })
  );
};

export const getFeaturedProductByBrand = (brand) => {
  return apiHandler(
    userAxios.get("/products", {
      params: { brand, limit: 1 },
    })
  );
};

export const fetchNewLaunchProducts = () => {
  return apiHandler(
    userAxios.get("/products", {
      params: {
        sort: "createdAt",
        order: "desc",
        limit: 6,
      },
    })
  );
};

export const fetchHandPickedProducts = () => {
  return apiHandler(
    userAxios.get("/products", {
      params: {
        sort: "variantDetails.colour",
        order: "asc",
        limit: 4,
      },
    })
  );
};
