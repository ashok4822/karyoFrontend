import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { fetchCart, updateCartItem, removeFromCart, clearCart, getAvailableStock } from "../../redux/reducers/cartSlice";

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [updatingItems, setUpdatingItems] = useState({});
  const [localQuantities, setLocalQuantities] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (cart.items.length === 0 && !cart.loading && !cart.initialized) {
      dispatch(fetchCart());
    }
  }, [dispatch, cart.items.length, cart.loading, cart.initialized]);

  // Initialize local quantities when cart loads
  useEffect(() => {
    const quantities = {};
    cart.items.forEach(item => {
      quantities[item.productVariantId._id] = item.quantity;
    });
    setLocalQuantities(quantities);
  }, [cart.items]);

  const handleQuantityChange = async (productVariantId, newQuantity) => {
    // Update local state immediately for responsive UI
    setLocalQuantities(prev => ({ ...prev, [productVariantId]: newQuantity }));
    setUpdatingItems(prev => ({ ...prev, [productVariantId]: true }));
    
    try {
      await dispatch(updateCartItem({ productVariantId, quantity: newQuantity })).unwrap();
      
      // Refresh available stock for the product after quantity update
      const cartItem = cart.items.find(item => item.productVariantId._id === productVariantId);
      if (cartItem && cartItem.productVariantId?.product?._id) {
        dispatch(getAvailableStock(cartItem.productVariantId.product._id));
      }
      
    } catch (error) {
      // Revert local state if API call fails
      setLocalQuantities(prev => ({ ...prev, [productVariantId]: cart.items.find(item => item.productVariantId._id === productVariantId)?.quantity || 1 }));
      Swal.fire({
        title: 'Update Failed',
        text: error || 'Failed to update quantity',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setUpdatingItems(prev => ({ ...prev, [productVariantId]: false }));
    }
  };

  const handleRemoveItem = async (productVariantId) => {
    const result = await Swal.fire({
      title: 'Remove from Cart',
      text: "Are you sure you want to remove this item from your cart?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(removeFromCart(productVariantId)).unwrap();
        
        // Refresh available stock for the product after removal
        const cartItem = cart.items.find(item => item.productVariantId._id === productVariantId);
        if (cartItem && cartItem.productVariantId?.product?._id) {
          dispatch(getAvailableStock(cartItem.productVariantId.product._id));
        }
        
        Swal.fire({
          title: 'Removed!',
          text: 'Item has been removed from your cart.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to remove item from cart.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const handleClearCart = async () => {
    const result = await Swal.fire({
      title: 'Clear Cart',
      text: "Are you sure you want to clear your entire cart? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(clearCart()).unwrap();
        
        // Refresh available stock for all products in the cart
        const productIds = [...new Set(cart.items.map(item => item.productVariantId?.product?._id).filter(Boolean))];
        productIds.forEach(productId => {
          dispatch(getAvailableStock(productId));
        });
        
        Swal.fire({
          title: 'Cart Cleared!',
          text: 'Your cart has been cleared successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to clear cart.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const quantity = localQuantities[item.productVariantId._id] || item.quantity;
      return total + (item.price * quantity);
    }, 0);
  };

  if (cart.loading && !cart.initialized) {
    return (
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
        <h1>Shopping Cart</h1>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cart.error) {
    return (
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
        <h1>Shopping Cart</h1>
        <p style={{ color: "red" }}>{cart.error}</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
        <h1>Shopping Cart</h1>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p>Your cart is empty.</p>
          <Link to="/products" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "12px 24px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Shopping Cart</h1>
        <button
          onClick={handleClearCart}
          style={{
            padding: "8px 16px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear Cart
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {cart.items.map((item) => {
          const isUpdating = updatingItems[item.productVariantId._id];
          const variant = item.productVariantId;
          const product = variant?.product;
          
          return (
            <div
              key={item.productVariantId._id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "1rem",
                border: "1px solid #eee",
                borderRadius: "8px",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <div 
                  style={{ marginRight: "1rem", cursor: "pointer" }}
                  onClick={() => navigate(`/products/${variant?.product?._id}`)}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {variant?.imageUrls?.[0] ? (
                      <img
                        src={variant.imageUrls[0]}
                        alt={product?.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <span style={{ color: "#999" }}>No Image</span>
                    )}
                  </div>
                </div>
                
                <div 
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => navigate(`/products/${variant?.product?._id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                    e.currentTarget.style.borderRadius = "4px";
                    e.currentTarget.style.padding = "4px";
                    e.currentTarget.style.margin = "-4px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderRadius = "0";
                    e.currentTarget.style.padding = "0";
                    e.currentTarget.style.margin = "0";
                  }}
                >
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "18px", color: "#333" }}>
                    {product?.name || "Product Name"}
                  </h3>
                  <p style={{ margin: "0.5rem 0", color: "#666", fontSize: "14px" }}>
                    Variant: {variant?.colour} - {variant?.capacity}
                  </p>
                  <p style={{ margin: "0.5rem 0", color: "#555", fontWeight: "bold" }}>
                    ₹{item.price?.toFixed(2)}
                  </p>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#007bff", fontSize: "12px", fontStyle: "italic" }}>
                    Click to view product details
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleQuantityChange(item.productVariantId._id, Math.max(1, (localQuantities[item.productVariantId._id] || item.quantity) - 1))}
                    disabled={isUpdating || (localQuantities[item.productVariantId._id] || item.quantity) <= 1}
                    style={{
                      padding: "4px 8px",
                      background: (localQuantities[item.productVariantId._id] || item.quantity) <= 1 ? "#ccc" : "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: (localQuantities[item.productVariantId._id] || item.quantity) <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    -
                  </button>
                  
                  <span style={{ minWidth: "30px", textAlign: "center" }}>
                    {localQuantities[item.productVariantId._id] || item.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleQuantityChange(item.productVariantId._id, Math.min(5, (localQuantities[item.productVariantId._id] || item.quantity) + 1))}
                    disabled={isUpdating || (localQuantities[item.productVariantId._id] || item.quantity) >= 5 || (localQuantities[item.productVariantId._id] || item.quantity) >= (variant?.stock || 0)}
                    style={{
                      padding: "4px 8px",
                      background: ((localQuantities[item.productVariantId._id] || item.quantity) >= 5 || (localQuantities[item.productVariantId._id] || item.quantity) >= (variant?.stock || 0)) ? "#ccc" : "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: ((localQuantities[item.productVariantId._id] || item.quantity) >= 5 || (localQuantities[item.productVariantId._id] || item.quantity) >= (variant?.stock || 0)) ? "not-allowed" : "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ textAlign: "right", minWidth: "80px" }}>
                  <p style={{ margin: "0", fontWeight: "bold" }}>
                    ₹{(item.price * (localQuantities[item.productVariantId._id] || item.quantity)).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.productVariantId._id)}
                  style={{
                    padding: "8px 12px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: "2rem", 
        padding: "1rem", 
        border: "1px solid #eee", 
        borderRadius: "8px",
        backgroundColor: "#f9f9f9"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Total: ₹{calculateTotal().toFixed(2)}</h3>
          <button
            style={{
              padding: "12px 24px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart; 