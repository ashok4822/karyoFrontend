// Check if product is blocked, unavailable or inactive
export const isProductUnavailable = (product) => {
  return (
    !product ||
    product.blocked ||
    product.unavailable ||
    product.status !== "active"
  );
};
