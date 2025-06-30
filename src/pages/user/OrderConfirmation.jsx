import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { clearCartState, clearCart } from "../../redux/reducers/cartSlice";
import {
  clearCurrentOrder,
  fetchOrderById,
} from "../../redux/reducers/orderSlice";
import "./OrderConfirmation.css"; // Optional for custom styles

const OrderConfirmation = () => {
  const { currentOrder } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();

  useEffect(() => {
    if (!currentOrder && orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [currentOrder, orderId, dispatch]);

  useEffect(() => {
    dispatch(clearCart());
    dispatch(clearCartState());
    const timer = setTimeout(() => {
      dispatch(clearCurrentOrder());
    }, 10000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  if (!currentOrder) {
    return (
      <div className="order-confirmation-bg d-flex align-items-center justify-content-center min-vh-100 py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card shadow-lg rounded-4 border-0 p-4 text-center">
                <div className="order-success-icon mx-auto mb-3">
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#dc3545" strokeWidth="3" fill="#f8d7da" />
                    <path d="M6 18L18 6M6 6l12 12" stroke="#dc3545" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h1 className="h4 fw-bold mb-2">Order Not Found</h1>
                <p className="text-muted mb-4">No order details available.</p>
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-primary px-4"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-bg d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg rounded-4 border-0 p-4">
              <div className="text-center mb-4">
                <div className="order-success-icon mx-auto mb-3">
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="#198754" strokeWidth="3" fill="#d1e7dd" />
                    <path d="M7 13l3 3 7-7" stroke="#198754" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h1 className="h3 fw-bold mb-2">Order Placed Successfully!</h1>
                <p className="text-muted mb-2">Thank you for your purchase. Your order is confirmed and being processed.</p>
                <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                  <span className="badge bg-success bg-opacity-25 text-success fs-6">Order #{currentOrder.orderNumber}</span>
                  <span className="badge bg-primary bg-opacity-25 text-primary fs-6">{currentOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
                  <span className="badge bg-info bg-opacity-25 text-info fs-6">{currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}</span>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <h5 className="fw-semibold mb-3">Order Information</h5>
                  <ul className="list-unstyled text-muted small mb-0">
                    <li className="mb-2 d-flex justify-content-between"><span>Order Date:</span><span className="fw-semibold text-dark">{new Date(currentOrder.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></li>
                    <li className="mb-2 d-flex justify-content-between"><span>Total Amount:</span><span className="fw-bold text-dark">₹{currentOrder.total.toFixed(2)}</span></li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5 className="fw-semibold mb-3">Shipping Address</h5>
                  <div className="bg-light rounded-3 p-3 small">
                    <div className="fw-semibold mb-1">{currentOrder.shippingAddress.recipientName}</div>
                    <div>{currentOrder.shippingAddress.addressLine1}</div>
                    {currentOrder.shippingAddress.addressLine2 && <div>{currentOrder.shippingAddress.addressLine2}</div>}
                    <div>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.postalCode}</div>
                    <div>{currentOrder.shippingAddress.country}</div>
                    <div className="mt-2 border-top pt-2">{currentOrder.shippingAddress.phoneNumber}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="fw-semibold mb-3">Order Items</h5>
                <ul className="list-group list-group-flush">
                  {currentOrder.items.map((item, index) => (
                    <li key={index} className="list-group-item px-0 py-3 d-flex align-items-center">
                      <Link
                        to={`/products/${item.productVariantId.product?._id}`}
                        className="d-flex align-items-center flex-grow-1 text-decoration-none"
                        style={{ color: 'inherit' }}
                      >
                        <div className="order-item-img me-3 flex-shrink-0">
                          {item.productVariantId?.imageUrls?.[0] ? (
                            <img src={item.productVariantId.imageUrls[0]} alt={item.productVariantId.product?.name} className="img-fluid rounded-3" style={{width: '48px', height: '48px', objectFit: 'cover'}} />
                          ) : (
                            <div className="bg-secondary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center" style={{width: '48px', height: '48px'}}></div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold text-dark">{item.productVariantId?.product?.name || "Product Name"}</div>
                          <div className="text-muted small">{item.productVariantId?.colour} {item.productVariantId?.capacity && `- ${item.productVariantId.capacity}`}</div>
                        </div>
                      </Link>
                      <div className="text-end ms-3">
                        <div className="fw-bold text-dark">₹{(item.price * item.quantity).toFixed(2)}</div>
                        <div className="text-muted small">Qty: {item.quantity}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h5 className="fw-semibold mb-3">Price Breakdown</h5>
                <ul className="list-unstyled small mb-0">
                  <li className="d-flex justify-content-between mb-1"><span>Subtotal:</span><span>₹{currentOrder.subtotal.toFixed(2)}</span></li>
                  {currentOrder.discount && (
                    <li className="d-flex justify-content-between mb-1"><span>Discount:</span><span className="text-success">-₹{currentOrder.discount.discountAmount.toFixed(2)}</span></li>
                  )}
                  <li className="d-flex justify-content-between mb-1"><span>Shipping:</span><span>{currentOrder.shipping === 0 ? "Free" : `₹${currentOrder.shipping.toFixed(2)}`}</span></li>
                  <li className="d-flex justify-content-between border-top pt-2 mt-2 fw-bold text-dark"><span>Total:</span><span>₹{currentOrder.total.toFixed(2)}</span></li>
                </ul>
              </div>

              <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mt-4">
                <button
                  onClick={() => navigate("/products")}
                  className="btn btn-primary btn-lg px-4 fw-semibold shadow-sm"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate("/profile?tab=orders")}
                  className="btn btn-outline-secondary btn-lg px-4 fw-semibold shadow-sm"
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
