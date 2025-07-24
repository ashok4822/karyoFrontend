import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { clearCartState, clearCart } from "../../redux/reducers/cartSlice";
import {
  clearCurrentOrder,
  fetchOrderById,
} from "../../redux/reducers/orderSlice";
import "./OrderConfirmation.css"; // Optional for custom styles
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const OrderConfirmation = () => {
  const { currentOrder } = useSelector((state) => state.order);
  // Add log for debugging
  console.log("OrderConfirmation currentOrder:", currentOrder);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  console.log(
    "[DEBUG] Rendering OrderConfirmation page",
    location.pathname,
    orderId
  );
  const [isFreshOrder, setIsFreshOrder] = useState(false);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [orderId, dispatch]);

  useEffect(() => {
    // Check if this is a fresh order placement by looking for a query parameter
    const params = new URLSearchParams(location.search);
    const fresh = params.get("fresh");

    if (fresh === "true") {
      setIsFreshOrder(true);
      // Clear the fresh parameter from URL without reloading
      const newUrl = location.pathname;
      window.history.replaceState({}, "", newUrl);
      // Only clear cart and cart state if this is a fresh order
      dispatch(clearCart());
      dispatch(clearCartState());
    } else {
      setIsFreshOrder(false);
    }
  }, [dispatch, location]);

  const handleDownloadInvoice = () => {
    if (!currentOrder) return;
    const doc = new jsPDF();
    // Header Bar
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, 210, 22, "F");
    doc.setFontSize(22);
    doc.setTextColor(255);
    doc.setFont(undefined, "bold");
    doc.text("CARYO", 14, 15);
    doc.setFontSize(12);
    doc.setTextColor(255);
    doc.setFont(undefined, "normal");
    doc.text("INVOICE", 196, 15, { align: "right" });
    let y = 28;
    // Two-column Order/Shipping Info
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, "bold");
    doc.text("Order Details", 14, y);
    doc.text("Shipping Address", 120, y);
    doc.setFont(undefined, "normal");
    y += 6;
    // Left column: Order/payment info
    let leftY = y;
    doc.text(`Order Number: ${currentOrder.orderNumber}`, 14, leftY);
    leftY += 5;
    doc.text(
      `Order Date: ${new Date(currentOrder.createdAt).toLocaleDateString(
        "en-IN"
      )}`,
      14,
      leftY
    );
    leftY += 5;
    // Remove overall payment status and order status from header
    // doc.text(
    //   `Payment Method: ${
    //     currentOrder.paymentMethod === "cod"
    //       ? "Cash on Delivery"
    //       : "Online Payment"
    //   }`,
    //   14,
    //   leftY
    // );
    // leftY += 5;
    // doc.text(
    //   `Order Status: ${
    //     currentOrder.status
    //       ? currentOrder.status.charAt(0).toUpperCase() +
    //         currentOrder.status.slice(1)
    //       : "Pending"
    //   }`,
    //   14,
    //   leftY
    // );
    // leftY += 5;
    // Right column: Shipping info
    let rightY = y;
    doc.text(`${currentOrder.shippingAddress.recipientName}`, 120, rightY);
    rightY += 5;
    doc.text(`${currentOrder.shippingAddress.addressLine1}`, 120, rightY);
    rightY += 5;
    if (currentOrder.shippingAddress.addressLine2) {
      doc.text(`${currentOrder.shippingAddress.addressLine2}`, 120, rightY);
      rightY += 5;
    }
    doc.text(
      `${currentOrder.shippingAddress.city}, ${currentOrder.shippingAddress.state} ${currentOrder.shippingAddress.postalCode}`,
      120,
      rightY
    );
    rightY += 5;
    doc.text(`${currentOrder.shippingAddress.country}`, 120, rightY);
    rightY += 5;
    doc.text(`Phone: ${currentOrder.shippingAddress.phoneNumber}`, 120, rightY);
    y = Math.max(leftY, rightY) + 8;
    y += 8; // Add extra gap before the table
    // Order Items Table with status columns
    autoTable(doc, {
      startY: y,
      head: [
        [
          "#",
          "Product",
          "Variant",
          "Qty",
          "Unit Price (INR)",
          "Total (INR)",
          "Status",
          "Payment Status",
        ],
      ],
      body: currentOrder.items.map((item, idx) => {
        // Calculate offer and final price
        const offers = item.offers && item.offers.length > 0 ? item.offers : [];
        const offerNames = offers.map((offer) => offer.offerName).join(", ");
        const offerAmount = offers.reduce(
          (sum, offer) => sum + (offer.offerAmount || 0),
          0
        );
        const basePrice = item.price;
        const finalPrice =
          (basePrice * item.quantity - offerAmount) / item.quantity;
        // Compose variant string with offer
        let variantStr = `${item.productVariantId?.colour || ""}`;
        if (item.productVariantId?.capacity)
          variantStr += `, ${item.productVariantId.capacity}`;
        if (offerNames) variantStr += `\nOffer: ${offerNames}`;
        // Compose unit price cell
        let unitPriceCell = finalPrice.toFixed(2);
        if (offers.length > 0) {
          unitPriceCell += `\n(${basePrice.toFixed(2)})`;
        }
        // Compose total cell
        let totalCell = (finalPrice * item.quantity).toFixed(2);
        return [
          idx + 1,
          item.productVariantId?.product?.name || "Product",
          variantStr,
          item.quantity,
          unitPriceCell,
          totalCell,
          item.itemStatus
            ? item.itemStatus.charAt(0).toUpperCase() +
              item.itemStatus.slice(1).replace("_", " ")
            : "Status Unknown",
          item.itemPaymentStatus
            ? item.itemPaymentStatus.charAt(0).toUpperCase() +
              item.itemPaymentStatus.slice(1)
            : "Pending",
        ];
      }),
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      styles: { cellPadding: 2 },
      margin: { left: 14, right: 14 },
      didDrawCell: function (data) {
        // Highlight total row
        if (
          data.row.index === currentOrder.items.length - 1 &&
          data.column.index === 0
        ) {
          doc.setFillColor(232, 240, 254);
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;
    // Price Breakdown Table (with offer, discount, shipping, total)
    const { adjustedTotal, proportionalDiscount } =
      getAdjustedTotalAndDiscount();
    const subtotal = currentOrder.items
      .filter((item) => item.itemPaymentStatus !== "refunded")
      .reduce((sum, item) => {
        const offers = item.offers && item.offers.length > 0 ? item.offers : [];
        const offerAmount = offers.reduce(
          (sum, offer) => sum + (offer.offerAmount || 0),
          0
        );
        return sum + (item.price * item.quantity - offerAmount);
      }, 0);
    let priceTableRows = [];
    priceTableRows.push(["Subtotal", `INR ${subtotal.toFixed(2)}`]);
    if (proportionalDiscount > 0) {
      priceTableRows.push([
        "Discount (Proportional)",
        `-INR ${proportionalDiscount.toFixed(2)}`,
      ]);
    }
    priceTableRows.push([
      "Shipping",
      currentOrder.shipping === 0
        ? "Free"
        : `INR ${currentOrder.shipping.toFixed(2)}`,
    ]);
    priceTableRows.push(["Total", `INR ${adjustedTotal.toFixed(2)}`]);

    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Description", "Amount"]],
      body: priceTableRows,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fontStyle: "bold",
        fillColor: [245, 245, 245],
        textColor: 40,
      },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
    // Footer
    doc.setDrawColor(220);
    doc.line(14, y, 196, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Thank you for shopping with CARYO!", 14, y);
    doc.text("Contact: support@caryo.com", 196, y, { align: "right" });
    doc.save(`Invoice_Order_${currentOrder.orderNumber}.pdf`);
  };

  // Helper to calculate adjusted total (excluding refunded items, with proportional discount)
  const getAdjustedTotalAndDiscount = () => {
    if (!currentOrder || !currentOrder.items)
      return {
        adjustedTotal: 0,
        proportionalDiscount: 0,
        proportionalOffer: 0,
      };

    // Use post-offer values for allItemsTotal and nonRefundedItemsTotal
    const allItemsTotal = currentOrder.items.reduce((sum, item) => {
      const offerTotal = item.offers && item.offers.length > 0
        ? item.offers.reduce((sum, offer) => sum + (offer.offerAmount || 0), 0)
        : 0;
      return sum + (item.price * item.quantity - offerTotal);
    }, 0);

    const nonRefundedItemsTotal = currentOrder.items
      .filter((item) => item.itemPaymentStatus !== "refunded")
      .reduce((sum, item) => {
        const offerTotal = item.offers && item.offers.length > 0
          ? item.offers.reduce((sum, offer) => sum + (offer.offerAmount || 0), 0)
          : 0;
        return sum + (item.price * item.quantity - offerTotal);
      }, 0);

    // Discount
    const discount = currentOrder.discount
      ? Math.abs(currentOrder.discount.discountAmount || 0)
      : 0;
    const proportionalDiscount =
      allItemsTotal > 0
        ? (nonRefundedItemsTotal / allItemsTotal) * discount
        : 0;

    // Offers (already included in above, so this can be 0 or omitted)
    const proportionalOffer = 0;

    // Shipping
    const shipping = currentOrder.shipping || 0;

    // Final total
    const adjustedTotal = Math.max(
      0,
      nonRefundedItemsTotal -
        proportionalDiscount +
        shipping
    );

    console.log("Final Total: ", adjustedTotal);
    console.log("nonRefundedItemsTotal: ", nonRefundedItemsTotal);
    console.log("proportionalDiscount: ", proportionalDiscount);
    console.log("shipping: ", shipping);

    return { adjustedTotal, proportionalDiscount, proportionalOffer };
  };

  // Add a helper to check if payment failed (but not cancelled)
  const isPaymentFailed =
    currentOrder &&
    currentOrder.paymentStatus === "failed" &&
    currentOrder.status !== "cancelled";

  const isCancelled = currentOrder && currentOrder.status === "cancelled";

  if (!currentOrder) {
    return (
      <div className="order-confirmation-bg d-flex align-items-center justify-content-center min-vh-100 py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card shadow-lg rounded-4 border-0 p-4 text-center">
                <div className="order-success-icon mx-auto mb-3">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#dc3545"
                      strokeWidth="3"
                      fill="#f8d7da"
                    />
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      stroke="#dc3545"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
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

  // Show failed status and retry payment if payment failed (but not cancelled)
  if (isPaymentFailed) {
    return (
      <div className="order-confirmation-bg d-flex align-items-center justify-content-center min-vh-100 py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card shadow-lg rounded-4 border-0 p-4 text-center">
                <div className="order-failed-icon mx-auto mb-3">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#dc3545"
                      strokeWidth="3"
                      fill="#f8d7da"
                    />
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      stroke="#dc3545"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <h1 className="h4 fw-bold mb-2">Payment Failed</h1>
                <p className="text-muted mb-4">
                  Your payment was not successful. You can retry the payment or
                  view your order details.
                </p>
                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mt-4">
                  <button
                    onClick={() =>
                      navigate(`/checkout?retryOrderId=${currentOrder._id}`)
                    }
                    className="btn btn-danger btn-lg px-4 fw-semibold shadow-sm"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => navigate(`/profile?tab=orders`)}
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
  }

  return (
    <div className="order-confirmation-bg d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg rounded-4 border-0 p-4">
              {isFreshOrder && (
                <div className="text-center mb-4">
                  <div className="order-success-icon mx-auto mb-3">
                    <svg
                      width="48"
                      height="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#198754"
                        strokeWidth="3"
                        fill="#d1e7dd"
                      />
                      <path
                        d="M7 13l3 3 7-7"
                        stroke="#198754"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <h1 className="h3 fw-bold mb-2">
                    Order Placed Successfully!
                  </h1>
                  <p className="text-muted mb-2">
                    Thank you for your purchase. Your order is confirmed and
                    being processed.
                  </p>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                    <span className="badge bg-success bg-opacity-25 text-success fs-6">
                      Order #{currentOrder.orderNumber}
                    </span>
                    <span className="badge bg-primary bg-opacity-25 text-primary fs-6">
                      {currentOrder.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : "Online Payment"}
                    </span>
                  </div>
                </div>
              )}

              {!isFreshOrder && (
                <div className="text-center mb-4">
                  <h1 className="h3 fw-bold mb-2">Order Details</h1>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                    <span className="badge bg-success bg-opacity-25 text-success fs-6">
                      Order #{currentOrder.orderNumber}
                    </span>
                    <span className="badge bg-primary bg-opacity-25 text-primary fs-6">
                      {currentOrder.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : "Online Payment"}
                    </span>
                  </div>
                </div>
              )}

              {/* Show Cancelled badge and reason if order is cancelled */}
              {isCancelled && (
                <div className="text-center mb-3">
                  <span className="badge bg-danger bg-opacity-25 text-danger fs-5 px-3 py-2">
                    Cancelled
                  </span>
                  {currentOrder.cancellationReason && (
                    <div className="mt-2 text-danger small">
                      Reason: {currentOrder.cancellationReason}
                    </div>
                  )}
                </div>
              )}

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <h5 className="fw-semibold mb-3">Order Information</h5>
                  <ul className="list-unstyled text-muted small mb-0">
                    <li className="mb-2 d-flex justify-content-between">
                      <span>Order Date:</span>
                      <span className="fw-semibold text-dark">
                        {new Date(currentOrder.createdAt).toLocaleDateString(
                          "en-IN",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </span>
                    </li>
                    <li className="mb-2 d-flex justify-content-between">
                      <span>Total Amount:</span>
                      <span className="fw-bold text-dark">
                        INR {currentOrder.total.toFixed(2)}
                      </span>
                    </li>
                    <li className="mb-2 d-flex justify-content-between">
                      <span>Payment Method:</span>
                      <span className="fw-semibold text-dark">
                        {currentOrder.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : "Online Payment"}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5 className="fw-semibold mb-3">Shipping Address</h5>
                  <div className="bg-light rounded-3 p-3 small">
                    <div className="fw-semibold mb-1">
                      {currentOrder.shippingAddress.recipientName}
                    </div>
                    <div>{currentOrder.shippingAddress.addressLine1}</div>
                    {currentOrder.shippingAddress.addressLine2 && (
                      <div>{currentOrder.shippingAddress.addressLine2}</div>
                    )}
                    <div>
                      {currentOrder.shippingAddress.city},{" "}
                      {currentOrder.shippingAddress.state}{" "}
                      {currentOrder.shippingAddress.postalCode}
                    </div>
                    <div>{currentOrder.shippingAddress.country}</div>
                    <div className="mt-2 border-top pt-2">
                      {currentOrder.shippingAddress.phoneNumber}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="fw-semibold mb-3">Order Items</h5>
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light py-3">
                    <div className="row align-items-center text-muted small fw-semibold">
                      <div className="col-md-6">Product</div>
                      <div className="col-md-2 text-center">Quantity</div>
                      <div className="col-md-2 text-center">Price (INR)</div>
                      <div className="col-md-2 text-center">Status</div>
                    </div>
                  </div>
                  <ul className="list-group list-group-flush">
                    {currentOrder.items.map((item, index) => (
                      <li key={index} className="list-group-item px-3 py-3">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <Link
                              to={`/products/${item.productVariantId.product?._id}`}
                              className="d-flex align-items-center text-decoration-none"
                              style={{ color: "inherit" }}
                            >
                              <div className="order-item-img me-3 flex-shrink-0">
                                {item.productVariantId?.imageUrls?.[0] ? (
                                  <img
                                    src={item.productVariantId.imageUrls[0]}
                                    alt={item.productVariantId.product?.name}
                                    className="img-fluid rounded-3"
                                    style={{
                                      width: "60px",
                                      height: "60px",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="bg-secondary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
                                    style={{ width: "60px", height: "60px" }}
                                  ></div>
                                )}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark mb-1">
                                  {item.productVariantId?.product?.name ||
                                    "Product Name"}
                                </div>
                                <div className="text-muted small">
                                  {item.productVariantId?.colour}{" "}
                                  {item.productVariantId?.capacity &&
                                    `- ${item.productVariantId.capacity}`}
                                </div>
                                {/* Show offer(s) for this item if present */}
                                {item.offers && item.offers.length > 0 && (
                                  <div className="text-success small mt-1">
                                    {item.offers.map((offer, idx) => (
                                      <div key={idx}>
                                        Offer:{" "}
                                        <span className="fw-semibold">
                                          {offer.offerName}
                                        </span>{" "}
                                        -
                                        <span>
                                          {" "}
                                          -INR{" "}
                                          {offer.offerAmount?.toFixed(2) || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </div>
                          <div className="col-md-2 text-center">
                            <span className="badge bg-light text-dark border">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="col-md-2 text-center">
                            {/* Show base price and final price after offer */}
                            <div className="fw-semibold text-dark mb-1">
                              {item.offers && item.offers.length > 0 ? (
                                <>
                                  <span>
                                    {(
                                      (item.price -
                                        item.offers.reduce(
                                          (sum, offer) =>
                                            sum +
                                            (offer.offerAmount || 0) /
                                              item.quantity,
                                          0
                                        )) *
                                      item.quantity
                                    ).toFixed(2)}
                                  </span>
                                  <br />
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#888",
                                      fontSize: "0.9em",
                                    }}
                                  >
                                    {(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <>{(item.price * item.quantity).toFixed(2)}</>
                              )}
                            </div>
                          </div>
                          <div className="col-md-2 text-center">
                            <div className="mb-1">
                              <span
                                className={`badge ${
                                  item.itemStatus === "delivered"
                                    ? "bg-success"
                                    : item.itemStatus === "shipped"
                                    ? "bg-info"
                                    : item.itemStatus === "processing"
                                    ? "bg-warning"
                                    : item.itemStatus === "cancelled"
                                    ? "bg-danger"
                                    : "bg-secondary"
                                }`}
                              >
                                {item.itemStatus
                                  ? item.itemStatus.charAt(0).toUpperCase() +
                                    item.itemStatus.slice(1).replace("_", " ")
                                  : "Status Unknown"}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`badge ${
                                  item.itemPaymentStatus === "paid"
                                    ? "bg-success bg-opacity-10 text-success"
                                    : item.itemPaymentStatus === "refunded"
                                    ? "bg-info bg-opacity-10 text-info"
                                    : "bg-warning bg-opacity-10 text-warning"
                                }`}
                              >
                                {item.itemPaymentStatus
                                  ? item.itemPaymentStatus
                                      .charAt(0)
                                      .toUpperCase() +
                                    item.itemPaymentStatus.slice(1)
                                  : "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="fw-semibold mb-3">Price Breakdown</h5>
                <ul className="list-unstyled small mb-0">
                  <li className="d-flex justify-content-between mb-1">
                    <span>Subtotal:</span>
                    <span>
                      INR{" "}
                      {currentOrder.items
                        .filter((item) => item.itemPaymentStatus !== "refunded")
                        .reduce((sum, item) => {
                          const offerTotal =
                            item.offers && item.offers.length > 0
                              ? item.offers.reduce(
                                  (sum, offer) =>
                                    sum + (offer.offerAmount || 0),
                                  0
                                )
                              : 0;
                          return (
                            sum + (item.price * item.quantity - offerTotal)
                          );
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </li>
                  <li className="d-flex justify-content-between mb-1">
                    <span>Discount (Proportional):</span>
                    <span className="text-success">
                      -INR{" "}
                      {getAdjustedTotalAndDiscount().proportionalDiscount.toFixed(
                        2
                      )}
                    </span>
                  </li>
                  {currentOrder.discount && (
                    <li className="mb-1 text-muted">
                      <span>
                        Discount Availed:{" "}
                        <span className="fw-semibold text-dark">
                          {currentOrder.discount.discountName ||
                            currentOrder.discount.code ||
                            "Discount"}
                        </span>
                      </span>
                    </li>
                  )}
                  <li className="d-flex justify-content-between mb-1">
                    <span>Shipping:</span>
                    <span>
                      {currentOrder.shipping === 0
                        ? "Free"
                        : `INR ${currentOrder.shipping.toFixed(2)}`}
                    </span>
                  </li>
                  <li className="d-flex justify-content-between border-top pt-2 mt-2 fw-bold text-dark">
                    <span>Total (Excludes Refunded Items):</span>
                    <span>
                      INR{" "}
                      {(
                        currentOrder.items
                          .filter(
                            (item) => item.itemPaymentStatus !== "refunded"
                          )
                          .reduce((sum, item) => {
                            const offerTotal =
                              item.offers && item.offers.length > 0
                                ? item.offers.reduce(
                                    (sum, offer) =>
                                      sum + (offer.offerAmount || 0),
                                    0
                                  )
                                : 0;
                            return (
                              sum + (item.price * item.quantity - offerTotal)
                            );
                          }, 0) -
                        getAdjustedTotalAndDiscount().proportionalDiscount +
                        currentOrder.shipping
                      ).toFixed(2)}
                    </span>
                  </li>
                  {currentOrder.items.some(
                    (item) => item.itemPaymentStatus === "refunded"
                  ) && (
                    <li className="d-flex justify-content-between mb-1 text-danger small">
                      <span></span>
                      <span>
                        Note: Refunded items are excluded from the total and
                        discount is applied proportionally.
                      </span>
                    </li>
                  )}
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
                <button
                  onClick={handleDownloadInvoice}
                  className="btn btn-success btn-lg px-4 fw-semibold shadow-sm"
                >
                  Download Invoice (PDF)
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
