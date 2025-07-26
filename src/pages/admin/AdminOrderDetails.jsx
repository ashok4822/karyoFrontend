import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
} from "../../utils/sweetAlert";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Spinner,
  Alert,
  Form,
  Modal,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaPrint,
  FaDownload,
  FaEdit,
  FaTruck,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
} from "react-icons/fa";
import {
  getOrderById,
  updateOrderItemPaymentStatus,
  updateOrderItemStatus,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../services/admin/adminOrderService";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVerifyReturnModal, setShowVerifyReturnModal] = useState(false);
  const [showVerifyWithoutRefundModal, setShowVerifyWithoutRefundModal] =
    useState(false);
  const [showRejectReturnModal, setShowRejectReturnModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [order, setOrder] = useState({
    id: "",
    orderNumber: "",
    date: "",
    status: "",
    total: 0,
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    items: [],
    payment: {
      method: "",
      status: "",
      transactionId: "",
    },
    shipping: {
      method: "",
      trackingNumber: "",
      estimatedDelivery: "",
    },
  });

  // Per-item status state for dropdowns
  const [itemStatusStates, setItemStatusStates] = useState({});

  // Initialize itemStatusStates when order loads
  useEffect(() => {
    if (order && order.items && Array.isArray(order.items)) {
      const initialStates = {};
      order.items.forEach((item) => {
        initialStates[item._id] = item.itemStatus || "pending";
      });
      setItemStatusStates(initialStates);
    }
  }, [order]);

  // Per-item payment status state for dropdowns
  const [itemPaymentStatusStates, setItemPaymentStatusStates] = useState({});

  // Initialize itemPaymentStatusStates when order loads
  useEffect(() => {
    if (order && order.items && Array.isArray(order.items)) {
      const initialStates = {};
      order.items.forEach((item) => {
        initialStates[item._id] = item.itemPaymentStatus || "pending";
      });
      setItemPaymentStatusStates(initialStates);
    }
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");

      const result = await getOrderById(id);

      console.log("AdminOrder Details result: ", result.data);

      if (result.success) {
        setOrder(result.data.order);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handlePaymentStatusChange = (e) => {
    setSelectedPaymentStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    const result = await updateOrderStatus(id, selectedStatus);

    if (result.success) {
      // Refetch updated order details
      const orderResult = await getOrderById(id);

      if (orderResult.success) {
        setOrder(orderResult.data.order);
      }

      setShowStatusModal(false);
      showSuccessAlert("Success", "Order status updated successfully!");
    } else {
      console.error("Error updating order status:", result.error);
      showErrorAlert(
        "Error",
        result.error || "Failed to update order status. Please try again."
      );
    }
  };

  const handleUpdatePaymentStatus = async () => {
    const result = await updatePaymentStatus(id, selectedPaymentStatus);

    if (result.success) {
      const orderResult = await getOrderById(id);

      if (orderResult.success) {
        setOrder(orderResult.data.order);
      }

      setShowPaymentStatusModal(false);
      showSuccessAlert("Success", "Payment status updated successfully!");
    } else {
      console.error("Error updating payment status:", result.error);
      showErrorAlert(
        "Error",
        result.error || "Failed to update payment status. Please try again."
      );
    }
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // Implement invoice download logic
    console.log("Downloading invoice...");
  };

  // Helper to get discount amount as a number
  const getDiscountAmount = () => {
    if (
      order.discount &&
      typeof order.discount === "object" &&
      order.discount.discountAmount != null &&
      !isNaN(order.discount.discountAmount)
    ) {
      return Number(order.discount.discountAmount);
    }
    if (typeof order.discount === "number" && !isNaN(order.discount)) {
      return order.discount;
    }
    return 0;
  };

  // Helper to calculate adjusted total (excluding refunded items, with proportional discount)
  const getAdjustedTotalAndDiscount = () => {
    const allItemsTotal = order.items.reduce(
      (sum, item) =>
        sum +
        (item.price * item.quantity -
          (item.offers
            ? item.offers.reduce((s, offer) => s + (offer.offerAmount || 0), 0)
            : 0)),
      0
    );
    const nonRefundedItemsTotal = order.items
      .filter((item) => item.itemPaymentStatus !== "refunded")
      .reduce(
        (sum, item) =>
          sum +
          (item.price * item.quantity -
            (item.offers
              ? item.offers.reduce((s, offer) => s + (offer.offerAmount || 0), 0)
              : 0)),
        0
      );
    const discount = getDiscountAmount();
    const proportionalDiscount =
      allItemsTotal > 0
        ? (nonRefundedItemsTotal / allItemsTotal) * discount
        : 0;
    const adjustedTotal = Math.max(
      0,
      nonRefundedItemsTotal - proportionalDiscount + (order.shippingCharge || 0)
    );
    return { adjustedTotal, proportionalDiscount };
  };

  // Helper to get user-friendly shipping status label
  const getShippingStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "processing":
        return "Processing";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : "-";
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <Button
            variant="outline-secondary"
            onClick={() => navigate("/admin/orders")}
            className="d-flex align-items-center gap-2"
          >
            <FaArrowLeft /> Back to Orders
          </Button>
        </Col>
        <Col xs="auto">
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={handlePrintOrder}
              className="d-flex align-items-center gap-2"
            >
              <FaPrint /> Print
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      <Row className="g-4">
        {/* Order Summary */}
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Order #{order.orderNumber}</h5>
              <span
                className="fw-bold text-uppercase text-primary"
                style={{ fontSize: "1rem" }}
              >
                {order.paymentMethod === "cod"
                  ? "COD"
                  : order.paymentMethod === "online"
                  ? "Online"
                  : order.paymentMethod === "wallet"
                  ? "Wallet"
                  : "-"}
              </span>
            </Card.Header>
            {/* Customer Information (detailed, below order number) */}
            <div className="px-4 pt-3 pb-2">
              <div className="d-flex align-items-center mb-2 gap-3">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40 }}
                >
                  <FaUser className="text-primary" size={22} />
                </div>
                <div
                  className="d-flex flex-wrap align-items-center gap-4"
                  style={{ fontSize: "1.05rem", rowGap: "0.5rem" }}
                >
                  <span className="fw-bold">
                    {order.user
                      ? order.user.firstName || order.user.lastName
                        ? `${order.user.firstName || ""} ${
                            order.user.lastName || ""
                          }`.trim()
                        : order.user.username || order.user.email || "-"
                      : "-"}
                  </span>
                  <span className="text-muted d-flex align-items-center">
                    <FaEnvelope className="me-1" />
                    {order.user?.email || "-"}
                  </span>
                  <span className="text-muted d-flex align-items-center">
                    <FaPhone className="me-1" />
                    {order.user?.mobileNo || "-"}
                  </span>
                  <span className="text-muted d-flex align-items-center">
                    <FaMapMarkerAlt className="me-1" />
                    {order.user?.address || "-"}
                  </span>
                </div>
              </div>
              {/* Shipping Address Section */}
              <div className="mt-3 p-3 bg-light rounded border">
                <div className="fw-bold mb-2 d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2 text-primary" /> Shipping
                  Address
                </div>
                {order.shippingAddress ? (
                  <div style={{ lineHeight: 1.6 }}>
                    <div>
                      <strong>Name:</strong>{" "}
                      {order.shippingAddress.recipientName}
                    </div>
                    <div>
                      <strong>Address:</strong>{" "}
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.addressLine2
                        ? `, ${order.shippingAddress.addressLine2}`
                        : ""}
                    </div>
                    <div>
                      <strong>City:</strong> {order.shippingAddress.city}
                    </div>
                    <div>
                      <strong>State:</strong> {order.shippingAddress.state}
                    </div>
                    <div>
                      <strong>Postal Code:</strong>{" "}
                      {order.shippingAddress.postalCode}
                    </div>
                    <div>
                      <strong>Country:</strong> {order.shippingAddress.country}
                    </div>
                    <div>
                      <strong>Phone:</strong>{" "}
                      {order.shippingAddress.phoneNumber}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted">No shipping address found.</div>
                )}
              </div>
            </div>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Offer</th> {/* NEW COLUMN */}
                      <th>Price</th>
                      <th>Quantity</th>
                      <th className="text-end">Total</th>
                      <th>Status</th>
                      <th>Payment Status</th>
                      <th>Reason</th>
                      <th>Update Status</th>
                      <th>Update Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => {
                      const variant = item.productVariantId || {};
                      const product = variant.product || {};
                      const isCancelled = item.cancelled;
                      const itemStatus = item.itemStatus || "pending";
                      const itemPaymentStatus =
                        item.itemPaymentStatus || "pending";
                      // Calculate total offer amount for this item
                      const offerAmount = item.offers && item.offers.length > 0
                        ? item.offers.reduce((sum, offer) => sum + (offer.offerAmount || 0), 0)
                        : 0;
                      // Calculate final price per unit after offer
                      const finalUnitPrice = item.price && item.quantity
                        ? (item.price * item.quantity - offerAmount) / item.quantity
                        : item.price;
                      // Calculate final total after offer
                      const finalTotal = item.price && item.quantity
                        ? (item.price * item.quantity - offerAmount)
                        : 0;
                      return (
                        <tr
                          key={item._id || variant._id || idx}
                          style={
                            isCancelled &&
                            ((order.paymentMethod !== "online" && order.paymentMethod !== "wallet") || itemPaymentStatus === "refunded")
                              ? { opacity: 0.5, textDecoration: "line-through" }
                              : {}
                          }
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={variant.imageUrls?.[0] || ""}
                                alt={product.name || ""}
                                className="rounded me-3"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                }}
                              />
                              <div>
                                <h6 className="mb-0">{product.name || "-"}</h6>
                              </div>
                            </div>
                          </td>
                          {/* Offer column */}
                          <td>
                            {item.offers && item.offers.length > 0 ? (
                              item.offers.map((offer, idx) => (
                                <div key={idx}>
                                  <span className="text-success small">
                                    {offer.offerName}: -₹{offer.offerAmount?.toFixed(2) || 0}
                                  </span>
                                </div>
                              ))
                            ) : (
                              "-"
                            )}
                          </td>
                          {/* Price column */}
                          <td>
                            {item.offers && item.offers.length > 0 ? (
                              <>
                                ₹{finalUnitPrice.toFixed(2)}
                                <br />
                                <span style={{ textDecoration: "line-through", color: "#888", fontSize: "0.9em" }}>
                                  ₹{item.price}
                                </span>
                              </>
                            ) : (
                              <>₹{item.price}</>
                            )}
                          </td>
                          <td>{item.quantity ?? "-"}</td>
                          {/* Total column */}
                          <td className="text-end">
                            ₹{finalTotal.toFixed(2)}
                          </td>
                          <td>
                            {isCancelled ? (
                              <Badge bg="danger">Cancelled</Badge>
                            ) : itemStatus === "return_verified" ? (
                              <Badge bg="success">Return Verified</Badge>
                            ) : itemStatus === "returned" ||
                              (item.returned &&
                                itemStatus !== "return_verified") ? (
                              <Badge bg="warning">Return Requested</Badge>
                            ) : ["delivered"].includes(itemStatus) ? (
                              <Badge bg="info">Delivered</Badge>
                            ) : (
                              <Badge bg="success">
                                {itemStatus.charAt(0).toUpperCase() +
                                  itemStatus.slice(1)}
                              </Badge>
                            )}
                          </td>
                          <td>
                            <Badge
                              bg={
                                itemPaymentStatus === "paid"
                                  ? "success"
                                  : itemPaymentStatus === "failed"
                                  ? "danger"
                                  : itemPaymentStatus === "refunded"
                                  ? "info"
                                  : "warning"
                              }
                            >
                              {itemPaymentStatus.charAt(0).toUpperCase() +
                                itemPaymentStatus.slice(1)}
                            </Badge>
                          </td>
                          <td>
                            {isCancelled && item.cancellationReason ? (
                              <span className="text-danger small">
                                {item.cancellationReason}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            <Form.Select
                              value={itemStatusStates[item._id] || itemStatus}
                              onChange={(e) =>
                                setItemStatusStates((s) => ({
                                  ...s,
                                  [item._id]: e.target.value,
                                }))
                              }
                              size="sm"
                              disabled={isCancelled}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="returned">Returned</option>
                              <option value="return_verified">
                                Return Verified
                              </option>
                            </Form.Select>
                            <Button
                              variant="primary"
                              size="sm"
                              className="mt-1"
                              disabled={
                                isCancelled ||
                                (itemStatusStates[item._id] || itemStatus) ===
                                  itemStatus
                              }
                              onClick={async () => {
                                const status = itemStatusStates[item._id];

                                const result = await updateOrderItemStatus(
                                  order._id,
                                  item._id,
                                  status
                                );

                                if (result.success) {
                                  const orderResult = await getOrderById(
                                    order._id
                                  );

                                  if (orderResult.success) {
                                    setOrder(orderResult.data.order);
                                  }

                                  showSuccessAlert(
                                    "Success",
                                    "Item status updated successfully!"
                                  );
                                } else {
                                  showErrorAlert(
                                    "Error",
                                    result.error ||
                                      "Failed to update item status."
                                  );
                                }
                              }}
                            >
                              Update
                            </Button>
                          </td>
                          <td>
                            <Form.Select
                              value={
                                itemPaymentStatusStates?.[item._id] ||
                                itemPaymentStatus
                              }
                              onChange={(e) =>
                                setItemPaymentStatusStates((s) => ({
                                  ...s,
                                  [item._id]: e.target.value,
                                }))
                              }
                              size="sm"
                              disabled={
                                isCancelled &&
                                ((order.paymentMethod !== "online" && order.paymentMethod !== "wallet") ||
                                  itemPaymentStatus === "refunded")
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </Form.Select>
                            <Button
                              variant="primary"
                              size="sm"
                              className="mt-1"
                              disabled={
                                (isCancelled &&
                                  ((order.paymentMethod !== "online" && order.paymentMethod !== "wallet") ||
                                    itemPaymentStatus === "refunded")) ||
                                (itemPaymentStatusStates?.[item._id] ||
                                  itemPaymentStatus) === itemPaymentStatus
                              }
                              onClick={async () => {
                                const paymentStatus =
                                  itemPaymentStatusStates[item._id];

                                const result =
                                  await updateOrderItemPaymentStatus(
                                    order._id,
                                    item._id,
                                    paymentStatus
                                  );

                                if (result.success) {
                                  const orderResult = await getOrderById(
                                    order._id
                                  );

                                  if (orderResult.success) {
                                    setOrder(orderResult.data.order);
                                  }

                                  showSuccessAlert(
                                    "Success",
                                    "Item payment status updated successfully!"
                                  );
                                } else {
                                  showErrorAlert(
                                    "Error",
                                    result.error ||
                                      "Failed to update item payment status."
                                  );
                                }
                              }}
                            >
                              Update
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Subtotal</strong>
                      </td>
                      <td className="text-end">
                        ₹
                        {order.items
                          .filter(
                            (item) =>
                              !item.cancelled &&
                              item.itemPaymentStatus !== "refunded"
                          )
                          .reduce(
                            (sum, item) =>
                              sum +
                              (item.price * item.quantity -
                                (item.offers
                                  ? item.offers.reduce((s, offer) => s + (offer.offerAmount || 0), 0)
                                  : 0)),
                            0
                          )
                          .toFixed(2)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Discount (Proportional)</strong>
                      </td>
                      <td className="text-end">
                        -₹
                        {getAdjustedTotalAndDiscount().proportionalDiscount.toFixed(
                          2
                        )}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    {order.discount &&
                      (order.discount.discountName || order.discount.code) && (
                        <tr>
                          <td colSpan="6" className="text-end text-muted">
                            Discount Availed:{" "}
                            <strong>
                              {order.discount.discountName ||
                                order.discount.code}
                            </strong>
                          </td>
                        </tr>
                      )}
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Shipping</strong>
                      </td>
                      <td className="text-end">
                        {order.shippingCharge === 0
                          ? "₹0.00"
                          : `₹${order.shippingCharge.toFixed(2)}`}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Total (Excludes Refunded Items)</strong>
                      </td>
                      <td className="text-end">
                        <strong>
                          ₹
                          {getAdjustedTotalAndDiscount().adjustedTotal.toFixed(
                            2
                          )}
                        </strong>
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    {order.items.some(
                      (item) => item.itemPaymentStatus === "refunded"
                    ) && (
                      <tr>
                        <td colSpan="6" className="text-end text-danger small">
                          Note: Refunded items are excluded from the total and
                          discount is applied proportionally.
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </Table>
              </div>
              {/* Show cancellation/return reason for cancelled/returned orders */}
              {order.cancellationReason &&
                (order.status === "cancelled" ||
                  order.status === "returned" ||
                  order.status === "return_verified" ||
                  order.status === "rejected") && (
                  <div className="mt-3">
                    <span className="text-muted">
                      {order.status === "cancelled"
                        ? "Order Cancellation Reason: "
                        : order.status === "rejected"
                        ? "Return Rejection Reason: "
                        : "Order Return Reason: "}
                      {order.cancellationReason}
                    </span>
                  </div>
                )}

              {/* Show return verification information */}
              {order.status === "return_verified" && (
                <div className="mt-3">
                  <div className="alert alert-success">
                    <strong>Return Verified:</strong> This return request has
                    been verified by admin.
                    {order.paymentStatus === "refunded" && (
                      <div className="mt-1">
                        <strong>Refund Processed:</strong> ₹
                        {order.total?.toFixed(2)} has been refunded to
                        customer's wallet.
                        {(order.paymentMethod === "cod" || order.paymentMethod === "wallet") && (
                          <div className="mt-1 small">
                            <em>
                              This refund was provided as a goodwill gesture for
                              the {order.paymentMethod === "cod" ? "COD" : "wallet"} order.
                            </em>
                          </div>
                        )}
                      </div>
                    )}
                    {order.paymentStatus !== "refunded" && (
                      <div className="mt-1">
                        <strong>No Refund:</strong> This return was verified
                        without processing a refund.
                        <div className="mt-1 small">
                          <em>
                            Typically used when customer did not accept the
                            product during delivery.
                          </em>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show return rejection information */}
              {order.status === "rejected" && (
                <div className="mt-3">
                  <div className="alert alert-danger">
                    <strong>Return Rejected:</strong> This return request has
                    been rejected by admin.
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>New Status</Form.Label>
            <Form.Select value={selectedStatus} onChange={handleStatusChange}>
              <option value="">Select a status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
              <option value="return_verified">Return Verified</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payment Status Update Modal */}
      <Modal
        show={showPaymentStatusModal}
        onHide={() => setShowPaymentStatusModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Payment Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info mb-3">
            <strong>Note:</strong> This option is only available for Cash on
            Delivery (COD) orders. Online and wallet payments are pre-paid.
          </div>
          <Form.Group>
            <Form.Label>Payment Status</Form.Label>
            <Form.Select
              value={selectedPaymentStatus}
              onChange={handlePaymentStatusChange}
            >
              <option value="">Select payment status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Form.Select>
          </Form.Group>
          <div className="mt-3">
            <small className="text-muted">
              <strong>Status Descriptions:</strong>
              <ul className="mb-0 mt-1">
                <li>
                  <strong>Pending:</strong> Payment is expected upon delivery
                </li>
                <li>
                  <strong>Paid:</strong> Customer has paid the amount
                </li>
                <li>
                  <strong>Failed:</strong> Customer refused to pay or payment
                  failed
                </li>
                <li>
                  <strong>Refunded:</strong> Amount has been refunded to
                  customer
                </li>
              </ul>
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPaymentStatusModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdatePaymentStatus}
            disabled={!selectedPaymentStatus}
          >
            Update Payment Status
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrderDetails;
