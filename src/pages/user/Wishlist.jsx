import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  removeFromWishlist,
  fetchWishlist,
} from "../../redux/reducers/wishlistSlice";
import { addToCart, getAvailableStock } from "../../redux/reducers/cartSlice";
import { fetchProductsFromBackend } from "../../redux/reducers/productSlice";

const Wishlist = () => {
  const wishlist = useSelector((state) => state.wishlist.items);
  const loading = useSelector((state) => state.wishlist.loading);
  const error = useSelector((state) => state.wishlist.error);
  const initialized = useSelector((state) => state.wishlist.initialized);
  const products = useSelector((state) => state.products.products);
  const cartLoading = useSelector((state) => state.cart.loading);
  const cartError = useSelector((state) => state.cart.error);
  const dispatch = useDispatch();
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    // Only fetch if wishlist is empty and not already loading
    // This prevents double fetching with AuthSync
    if (wishlist.length === 0 && !loading && !initialized) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, wishlist.length, loading, initialized]);

  useEffect(() => {
    // Fetch latest products when wishlist page loads
    dispatch(fetchProductsFromBackend({ limit: 1000 })); // adjust limit as needed
  }, [dispatch]);

  // Helper to get product and variant status
  const getProductStatus = (item) => {
    const product = products.find((p) => p._id === item.id);
    if (!product) return { status: "unknown", outOfStock: false, variantInactive: false };
    // Find the variant
    let variant = null;
    if (product.variantDetails && product.variantDetails.length > 0) {
      variant = product.variantDetails.find((v) => v._id === item.variant);
    } else if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => v._id === item.variant);
    }
    const outOfStock = variant ? variant.stock === 0 : product.totalStock === 0;
    const productInactive = product.status !== "active" || product.blocked || product.unavailable;
    const variantInactive = variant && variant.status === "inactive";
    return {
      status: productInactive || variantInactive ? "inactive" : "active",
      outOfStock,
      variantInactive,
    };
  };

  // Handle add to cart
  const handleAddToCart = async (item) => {
    const { status, outOfStock } = getProductStatus(item);
    
    if (status === "inactive") {
      Swal.fire({
        title: 'Product Not Available',
        text: 'This product is not available for purchase.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    if (outOfStock) {
      Swal.fire({
        title: 'Out of Stock',
        text: 'This product is out of stock.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setAddingToCart(prev => ({ ...prev, [item.id + "-" + item.variant]: true }));
    
    try {
      await dispatch(addToCart({ 
        productVariantId: item.variant, 
        quantity: 1 
      })).unwrap();
      
      // Refresh wishlist to reflect the updated state
      await dispatch(fetchWishlist()).unwrap();
      
      // Success message
      Swal.fire({
        title: 'Item Added to Cart',
        text: 'Item added to cart successfully!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
    } catch (error) {
      Swal.fire({
        title: 'Failed to Add Item',
        text: error || 'Failed to add item to cart',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setAddingToCart(prev => ({ ...prev, [item.id + "-" + item.variant]: false }));
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (item) => {
    const result = await Swal.fire({
      title: 'Remove from Wishlist',
      text: 'Are you sure you want to remove this item from your wishlist?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(removeFromWishlist({ id: item.id, variant: item.variant })).unwrap();
        
        // Refresh available stock for the product after removal
        dispatch(getAvailableStock(item.id));
        
        Swal.fire({
          title: 'Removed!',
          text: 'Item has been removed from your wishlist.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to remove item from wishlist.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1>Wishlist</h1>
      {loading && !initialized && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading wishlist...</p>
          {/* Simple loading skeleton */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "1rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "8px",
                    marginRight: "1rem",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: "20px",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "4px",
                      marginBottom: "0.5rem",
                      width: "60%",
                    }}
                  />
                  <div
                    style={{
                      height: "16px",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "4px",
                      width: "40%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {wishlist.map((item) => {
            const { status, outOfStock, variantInactive } = getProductStatus(item);
            const isAddingToCart = addingToCart[item.id + "-" + item.variant];
            const isDisabled = status === "inactive" || outOfStock || isAddingToCart || cartLoading;
            
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
                  opacity: (status === "inactive" || outOfStock) ? 0.6 : 1,
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
                    <span style={{ color: "#888", fontSize: 14, display: "block", marginBottom: "4px" }}>
                      Variant: {item.variantName}
                    </span>
                  )}
                  {(status === "inactive" || outOfStock) && (
                    <div
                      style={{
                        color: "#dc3545",
                        fontWeight: "bold",
                        fontSize: 14,
                        marginTop: 4,
                        padding: "4px 8px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "4px",
                        border: "1px solid #fecaca",
                        display: "inline-block",
                      }}
                    >
                      {status === "inactive" 
                        ? (variantInactive ? "Inactive Variant" : "Inactive Product")
                        : "Out of Stock"
                      }
                    </div>
                  )}
                </div>
                <button
                  style={{
                    marginRight: 12,
                    padding: "8px 16px",
                    background: isDisabled ? "#ccc" : "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                  onClick={() => handleAddToCart(item)}
                  disabled={isDisabled}
                >
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
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
                  onClick={() => handleRemoveFromWishlist(item)}
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
