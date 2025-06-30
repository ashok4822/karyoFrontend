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
    
    // Clear current order after 10 seconds
    const timer = setTimeout(() => {
      dispatch(clearCurrentOrder());
    }, 10000);

    return () => clearTimeout(timer);
  }, [dispatch]);

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">No order details available.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="relative">
            {/* Animated Success Icon */}
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Celebration Dots */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="absolute -bottom-2 -left-4 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            <div className="absolute -bottom-2 -right-4 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎉 Order Placed Successfully!
          </h1>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-600 mb-2">
              Thank you for choosing us! Your order has been confirmed and is being processed.
            </p>
            <p className="text-lg text-gray-500">
              {currentOrder.paymentMethod === "cod" 
                ? `Please keep ₹${currentOrder.total.toFixed(2)} ready for cash on delivery.`
                : "You will receive an email confirmation shortly."
              }
            </p>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Order Summary</h2>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                #{currentOrder.orderNumber}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date(currentOrder.createdAt).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-lg text-gray-800">₹{currentOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Shipping Address</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-800 mb-1">
                  {currentOrder.shippingAddress.firstName} {currentOrder.shippingAddress.lastName}
                </div>
                <div className="text-gray-600 text-sm space-y-1">
                  <div>{currentOrder.shippingAddress.address}</div>
                  <div>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}</div>
                  <div>{currentOrder.shippingAddress.country}</div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div>📞 {currentOrder.shippingAddress.phone}</div>
                    <div>✉️ {currentOrder.shippingAddress.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Order Items</h3>
            <div className="space-y-3">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productVariant?.imageUrls?.[0] ? (
                      <img
                        src={item.productVariant.imageUrls[0]}
                        alt={item.productVariant.product?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate">
                      {item.productVariant?.product?.name || "Product Name"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.productVariant?.colour} - {item.productVariant?.capacity}
                    </p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <div className="text-right">
                  {currentOrder.discount ? (
                    <>
                      <div className="text-sm text-gray-400 line-through">₹{currentOrder.subtotal.toFixed(2)}</div>
                      <div className="font-medium text-green-600">₹{currentOrder.subtotalAfterDiscount.toFixed(2)}</div>
                    </>
                  ) : (
                    <span className="font-medium">₹{currentOrder.subtotal.toFixed(2)}</span>
                  )}
                </div>
              </div>
              
              {currentOrder.discount && (
                <div className="flex justify-between">
                  <span className="text-green-600">Discount ({currentOrder.discount.discountName}):</span>
                  <span className="text-green-600 font-medium">-₹{currentOrder.discount.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">{currentOrder.shipping === 0 ? "Free" : `₹${currentOrder.shipping.toFixed(2)}`}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-lg font-bold text-gray-800">₹{currentOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* COD Instructions */}
          {currentOrder.paymentMethod === "cod" && currentOrder.paymentInstructions && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cash on Delivery Instructions
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {currentOrder.paymentInstructions.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/profile/orders/${currentOrder._id}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Order Details
            </button>
            
            <button
              onClick={() => navigate("/")}
              className="bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Continue Shopping
            </button>
          </div>
          
          <p className="text-gray-500 text-sm">
            You will receive email updates about your order status
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 