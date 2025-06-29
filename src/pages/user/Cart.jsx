import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { fetchCart, updateCartItem, removeFromCart, clearCart, getAvailableStock } from "../../redux/reducers/cartSlice";
import { useToast } from "../../hooks/use-toast";

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [updatingItems, setUpdatingItems] = useState({});
  const [localQuantities, setLocalQuantities] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Helper function to check if item is disabled
  const isItemDisabled = (item) => {
    const variant = item.productVariantId;
    const product = variant?.product;
    
    // Check if product or variant is inactive
    const isInactive = product?.status === 'inactive' || variant?.status === 'inactive';
    
    // Check if completely out of stock
    const isOutOfStock = (variant?.stock || 0) <= 0;
    
    return isInactive || isOutOfStock;
  };

  // Helper function to get status message
  const getStatusMessage = (item) => {
    const variant = item.productVariantId;
    const product = variant?.product;
    
    if (product?.status === 'inactive') {
      return "Product is currently unavailable";
    }
    
    if (variant?.status === 'inactive') {
      return "This variant is currently unavailable";
    }
    
    if ((variant?.stock || 0) <= 0) {
      return "Out of stock";
    }
    
    // Check for low stock (less than 3 items)
    if ((variant?.stock || 0) <= 3) {
      return `Low stock - only ${variant.stock} left`;
    }
    
    return null;
  };

  // Helper function to get status type for styling
  const getStatusType = (item) => {
    const variant = item.productVariantId;
    const product = variant?.product;
    
    if (product?.status === 'inactive' || variant?.status === 'inactive') {
      return "inactive";
    }
    
    if ((variant?.stock || 0) <= 0) {
      return "outOfStock";
    }
    
    // Check for low stock (less than 3 items)
    if ((variant?.stock || 0) <= 3) {
      return "lowStock";
    }
    
    return null;
  };

  const handleQuantityChange = async (productVariantId, newQuantity) => {
    // Check if item is disabled before allowing quantity change
    const item = cart.items.find(item => item.productVariantId._id === productVariantId);
    if (item && isItemDisabled(item)) {
      const statusMessage = getStatusMessage(item);
      toast({
        title: "Action not allowed",
        description: statusMessage,
        variant: "destructive",
      });
      return; // Don't allow quantity changes for disabled items
    }

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

  // Function to handle disabled item interactions
  const handleDisabledItemInteraction = (item) => {
    const statusMessage = getStatusMessage(item);
    toast({
      title: "Item unavailable",
      description: statusMessage,
      variant: "destructive",
    });
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

  // Check if there are any disabled items
  const hasDisabledItems = cart.items.some(item => isItemDisabled(item));
  const disabledItemsCount = cart.items.filter(item => isItemDisabled(item)).length;

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

      {/* Warning message for disabled items */}
      {hasDisabledItems && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            color: "#92400e",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <strong>Unable to proceed with checkout</strong>
          </div>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {disabledItemsCount === 1 
              ? "1 item in your cart is currently unavailable or out of stock. Please remove it to continue with checkout."
              : `${disabledItemsCount} items in your cart are currently unavailable or out of stock. Please remove them to continue with checkout.`
            }
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {cart.items.map((item) => {
          const isUpdating = updatingItems[item.productVariantId._id];
          const variant = item.productVariantId;
          const product = variant?.product;
          const isDisabled = isItemDisabled(item);
          const statusMessage = getStatusMessage(item);
          const statusType = getStatusType(item);
          
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
                opacity: isDisabled ? 0.6 : 1,
                position: "relative",
                transition: "opacity 0.3s ease",
              }}
            >
              {/* Status overlay for disabled items */}
              {isDisabled && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "8px",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              )}

              <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
                <div 
                  style={{ 
                    marginRight: "1rem", 
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.7 : 1,
                  }}
                  onClick={() => {
                    if (isDisabled) {
                      handleDisabledItemInteraction(item);
                    } else {
                      navigate(`/products/${variant?.product?._id}`);
                    }
                  }}
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
                          filter: isDisabled ? "grayscale(50%)" : "none",
                        }}
                      />
                    ) : (
                      <span style={{ color: "#999" }}>No Image</span>
                    )}
                  </div>
                </div>
                
                <div 
                  style={{ 
                    flex: 1, 
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.7 : 1,
                  }}
                  onClick={() => {
                    if (isDisabled) {
                      handleDisabledItemInteraction(item);
                    } else {
                      navigate(`/products/${variant?.product?._id}`);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                      e.currentTarget.style.borderRadius = "4px";
                      e.currentTarget.style.padding = "4px";
                      e.currentTarget.style.margin = "-4px";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderRadius = "0";
                      e.currentTarget.style.padding = "0";
                      e.currentTarget.style.margin = "0";
                    }
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
                  
                  {/* Status message */}
                  {statusMessage && (
                    <div
                      style={{
                        margin: "0.5rem 0",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: statusType === "inactive" ? "#fef3c7" : 
                                       statusType === "outOfStock" ? "#fee2e2" : "#dbeafe",
                        color: statusType === "inactive" ? "#92400e" : 
                               statusType === "outOfStock" ? "#dc2626" : "#1e40af",
                        border: `1px solid ${statusType === "inactive" ? "#f59e0b" : 
                                           statusType === "outOfStock" ? "#ef4444" : "#3b82f6"}`,
                        display: "inline-block",
                      }}
                    >
                      {statusMessage}
                    </div>
                  )}
                  
                  {!isDisabled && (
                    <p style={{ margin: "0.25rem 0 0 0", color: "#007bff", fontSize: "12px", fontStyle: "italic" }}>
                      Click to view product details
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      if (isDisabled) {
                        handleDisabledItemInteraction(item);
                      } else {
                        handleQuantityChange(item.productVariantId._id, Math.max(1, (localQuantities[item.productVariantId._id] || item.quantity) - 1));
                      }
                    }}
                    disabled={isUpdating || isDisabled || (localQuantities[item.productVariantId._id] || item.quantity) <= 1}
                    style={{
                      padding: "4px 8px",
                      background: isDisabled || (localQuantities[item.productVariantId._id] || item.quantity) <= 1 ? "#ccc" : "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isDisabled || (localQuantities[item.productVariantId._id] || item.quantity) <= 1 ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    -
                  </button>
                  
                  <span style={{ 
                    minWidth: "30px", 
                    textAlign: "center",
                    opacity: isDisabled ? 0.7 : 1,
                  }}>
                    {localQuantities[item.productVariantId._id] || item.quantity}
                  </span>
                  
                  <button
                    onClick={() => {
                      if (isDisabled) {
                        handleDisabledItemInteraction(item);
                      } else {
                        handleQuantityChange(item.productVariantId._id, Math.min(5, (localQuantities[item.productVariantId._id] || item.quantity) + 1));
                      }
                    }}
                    disabled={isUpdating || isDisabled || (localQuantities[item.productVariantId._id] || item.quantity) >= 5 || (localQuantities[item.productVariantId._id] || item.quantity) >= (variant?.stock || 0)}
                    style={{
                      padding: "4px 8px",
                      background: isDisabled || (localQuantities[item.productVariantId._id] || item.quantity) >= 5 || (localQuantities[item.productVariantId._id] || item.quantity) >= (variant?.stock || 0) ? "#ccc" : "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: isDisabled || (localQuantities[item.productVariantId._id] || item.quantity) >= 5 || (localQuantities[item.productVariantId._id] || item.quantity) >= (variant?.stock || 0) ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ textAlign: "right", minWidth: "80px" }}>
                  <p style={{ 
                    margin: "0", 
                    fontWeight: "bold",
                    opacity: isDisabled ? 0.7 : 1,
                  }}>
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
                    opacity: isDisabled ? 0.8 : 1,
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
            onClick={() => navigate("/checkout")}
            disabled={hasDisabledItems}
            style={{
              padding: "12px 24px",
              background: hasDisabledItems ? "#ccc" : "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: hasDisabledItems ? "not-allowed" : "pointer",
              fontSize: "16px",
              opacity: hasDisabledItems ? 0.6 : 1,
              position: "relative",
            }}
            title={hasDisabledItems ? "Please remove unavailable items to proceed with checkout" : "Proceed to checkout"}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart; 