import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  removeFromWishlist,
  fetchWishlist,
} from "../../redux/reducers/wishlistSlice";

const Wishlist = () => {
  const wishlist = useSelector((state) => state.wishlist.items);
  const loading = useSelector((state) => state.wishlist.loading);
  const error = useSelector((state) => state.wishlist.error);
  const products = useSelector((state) => state.products.products);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  // Helper to get product and variant status
  const getProductStatus = (item) => {
    const product = products.find((p) => p._id === item.id);
    if (!product) return { status: "unknown", outOfStock: false };
    // Find the variant
    let variant = null;
    if (product.variantDetails && product.variantDetails.length > 0) {
      variant = product.variantDetails.find((v) => v._id === item.variant);
    } else if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => v._id === item.variant);
    }
    const outOfStock = variant ? variant.stock === 0 : product.totalStock === 0;
    const inactive =
      product.status !== "active" || product.blocked || product.unavailable;
    return {
      status: inactive ? "inactive" : "active",
      outOfStock,
    };
  };

  console.log("wishlist frontend: ", wishlist);

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1>Wishlist</h1>
      {loading && <p>Loading wishlist...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {wishlist.map((item) => {
            const { status, outOfStock } = getProductStatus(item);
            return (
              <li
                key={item.id + "-" + item.variant}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 16,
                  opacity: status === "inactive" ? 0.6 : 1,
                }}
              >
                <Link
                  to={`/products/${item.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginRight: 16,
                    }}
                  />
                </Link>
                <div style={{ flex: 1 }}>
                  <Link
                    to={`/products/${item.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <h2 style={{ margin: 0, fontSize: 20 }}>{item.name}</h2>
                  </Link>
                  <p style={{ margin: "8px 0", color: "#555" }}>
                    ₹{item.price?.toFixed(2)}
                  </p>
                  {item.variantName && (
                    <span style={{ color: "#888", fontSize: 14 }}>
                      Variant: {item.variantName}
                    </span>
                  )}
                  {status === "inactive" && (
                    <div
                      style={{
                        color: "#dc3545",
                        fontWeight: "bold",
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      Inactive Product
                    </div>
                  )}
                  {outOfStock && (
                    <div
                      style={{
                        color: "#dc3545",
                        fontWeight: "bold",
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      Out of Stock
                    </div>
                  )}
                </div>
                <button
                  style={{
                    marginRight: 12,
                    padding: "8px 16px",
                    background: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Add to Cart
                </button>
                <button
                  style={{
                    padding: "8px 12px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    dispatch(
                      removeFromWishlist({ id: item.id, variant: item.variant })
                    )
                  }
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Wishlist;
