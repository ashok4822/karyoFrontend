import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCartState } from "../../redux/reducers/cartSlice";
import { clearCurrentOrder } from "../../redux/reducers/orderSlice";

const OrderConfirmation = () => {
  const { currentOrder } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear cart after successful order
    dispatch(clearCartState());
    
    // Clear current order after 5 seconds
    const timer = setTimeout(() => {
      dispatch(clearCurrentOrder());
    }, 5000);

    return () => clearTimeout(timer);
  }, [dispatch]);

  if (!currentOrder) {
    return (
      <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <h1>Order Not Found</h1>
          <p>No order details available.</p>
          <button
            onClick={() => navigate("/")}
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
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          borderRadius: "50%", 
          background: "#10b981", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 1rem",
          fontSize: "2rem",
          color: "white"
        }}>
          ✓
        </div>
        <h1 style={{ color: "#10b981", marginBottom: "0.5rem" }}>
          Order Placed Successfully!
        </h1>
        <p style={{ color: "#666", fontSize: "1.125rem" }}>
          Thank you for your purchase. Your order has been confirmed.
        </p>
      </div>

      <div style={{ 
        backgroundColor: "#fff", 
        padding: "2rem", 
        borderRadius: "8px", 
        border: "1px solid #eee",
        marginBottom: "2rem"
      }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Order Details</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          <div>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Order Information</h3>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Order ID:</strong> {currentOrder._id}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Order Number:</strong> {currentOrder.orderNumber}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Order Date:</strong> {new Date(currentOrder.createdAt).toLocaleDateString()}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Status:</strong> 
              <span style={{ 
                color: "#10b981", 
                fontWeight: "bold",
                marginLeft: "0.5rem"
              }}>
                {currentOrder.status}
              </span>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>Payment Method:</strong> {currentOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Shipping Address</h3>
            <div style={{ lineHeight: "1.6" }}>
              <div>{currentOrder.shippingAddress.firstName} {currentOrder.shippingAddress.lastName}</div>
              <div>{currentOrder.shippingAddress.address}</div>
              <div>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}</div>
              <div>{currentOrder.shippingAddress.country}</div>
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Phone:</strong> {currentOrder.shippingAddress.phone}
              </div>
              <div>
                <strong>Email:</strong> {currentOrder.shippingAddress.email}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Order Items</h3>
          <div style={{ border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
            {currentOrder.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "1rem",
                  borderBottom: index < currentOrder.items.length - 1 ? "1px solid #eee" : "none",
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff"
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    marginRight: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {item.productVariant?.imageUrls?.[0] ? (
                    <img
                      src={item.productVariant.imageUrls[0]}
                      alt={item.productVariant.product?.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "4px"
                      }}
                    />
                  ) : (
                    <span style={{ color: "#999", fontSize: "0.75rem" }}>No Image</span>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>
                    {item.productVariant?.product?.name || "Product Name"}
                  </h4>
                  <p style={{ margin: "0", color: "#666", fontSize: "0.875rem" }}>
                    {item.productVariant?.colour} - {item.productVariant?.capacity}
                  </p>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.875rem" }}>
                    Qty: {item.quantity}
                  </p>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: "bold" }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          marginTop: "2rem", 
          padding: "1rem", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "8px",
          border: "1px solid #e9ecef"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span>Subtotal:</span>
            <div style={{ textAlign: "right" }}>
              {currentOrder.discount ? (
                <>
                  <div style={{ textDecoration: "line-through", color: "#999", fontSize: "0.875rem" }}>
                    ₹{currentOrder.subtotal.toFixed(2)}
                  </div>
                  <div style={{ fontWeight: "bold", color: "#10b981" }}>
                    ₹{currentOrder.subtotalAfterDiscount.toFixed(2)}
                  </div>
                </>
              ) : (
                <span>₹{currentOrder.subtotal.toFixed(2)}</span>
              )}
            </div>
          </div>
          
          {currentOrder.discount && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#10b981" }}>Discount ({currentOrder.discount.discountName}):</span>
              <span style={{ color: "#10b981", fontWeight: "500" }}>
                -₹{currentOrder.discount.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span>Shipping:</span>
            <span>{currentOrder.shipping === 0 ? "Free" : `₹${currentOrder.shipping.toFixed(2)}`}</span>
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid #dee2e6",
            fontWeight: "bold",
            fontSize: "1.125rem"
          }}>
            <span>Total:</span>
            <span>₹{currentOrder.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "1rem"
          }}
        >
          Continue Shopping
        </button>
        <button
          onClick={() => navigate("/profile")}
          style={{
            padding: "12px 24px",
            background: "transparent",
            color: "#4f46e5",
            border: "1px solid #4f46e5",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation; 