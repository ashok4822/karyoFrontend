import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminAxios from '../../lib/adminAxios';
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
} from 'react-bootstrap';
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
} from 'react-icons/fa';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVerifyReturnModal, setShowVerifyReturnModal] = useState(false);

  const [order, setOrder] = useState({
    id: '',
    orderNumber: '',
    date: '',
    status: '',
    total: 0,
    customer: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    items: [],
    payment: {
      method: '',
      status: '',
      transactionId: '',
    },
    shipping: {
      method: '',
      trackingNumber: '',
      estimatedDelivery: '',
    },
  });

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminAxios.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminAxios.put(`/orders/${id}/status`, { status: selectedStatus });
      // Refetch order details to update UI
      const res = await adminAxios.get(`/orders/${id}`);
      setOrder(res.data.order);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // Implement invoice download logic
    console.log('Downloading invoice...');
  };

  // Helper to get discount amount as a number
  const getDiscountAmount = () => {
    if (order.discount && typeof order.discount === 'object' && order.discount.discountAmount != null && !isNaN(order.discount.discountAmount)) {
      return Number(order.discount.discountAmount);
    }
    if (typeof order.discount === 'number' && !isNaN(order.discount)) {
      return order.discount;
    }
    return 0;
  };

  // Helper to get user-friendly shipping status label
  const getShippingStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
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
            onClick={() => navigate('/admin/orders')}
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
            <Button
              variant="outline-primary"
              onClick={handleDownloadInvoice}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload /> Invoice
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
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Order #{order.orderNumber}</h5>
              <Badge
                bg={
                  order.status === 'completed'
                    ? 'success'
                    : order.status === 'processing'
                    ? 'primary'
                    : order.status === 'shipped'
                    ? 'info'
                    : order.status === 'cancelled'
                    ? 'danger'
                    : 'warning'
                }
              >
                {order.status}
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => {
                      const variant = item.productVariantId || {};
                      const product = variant.product || {};
                      return (
                        <tr key={item._id || variant._id || idx}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={variant.imageUrls?.[0] || ''}
                                alt={product.name || ''}
                                className="rounded me-3"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                              <div>
                                <h6 className="mb-0">{product.name || '-'}</h6>
                                <small className="text-muted">
                                  SKU: {variant.sku || '-'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>₹{item.price ?? '-'}</td>
                          <td>{item.quantity ?? '-'}</td>
                          <td className="text-end">
                            ₹{item.price && item.quantity ? (item.price * item.quantity).toFixed(2) : '-' }
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
                      <td className="text-end">₹{order.subtotal?.toFixed(2) ?? order.total?.toFixed(2) ?? '-'}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Discount</strong>
                      </td>
                      <td className="text-end">-₹{getDiscountAmount().toFixed(2)}</td>
                    </tr>
                    {order.discount && (order.discount.discountName || order.discount.code) && (
                      <tr>
                        <td colSpan="4" className="text-end text-muted">
                          Discount Availed: <strong>{order.discount.discountName || order.discount.code}</strong>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Shipping</strong>
                      </td>
                      <td className="text-end">₹0.00</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Total</strong>
                      </td>
                      <td className="text-end">
                        <strong>₹{order.total?.toFixed(2) ?? '-'}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              {/* Show cancellation/return reason for cancelled/returned orders */}
              {order.cancellationReason && (order.status === 'cancelled' || order.status === 'returned') && (
                <div className="mt-3">
                  <span className="text-muted">
                    {order.status === 'cancelled' ? 'Order Cancellation Reason: ' : 'Order Return Reason: '}
                    {order.cancellationReason}
                  </span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Order Details Sidebar */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            {/* Customer Information */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent">
                <h5 className="mb-0">Customer Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                    <FaUser className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-0">
                      {order.user
                        ? (order.user.firstName || order.user.lastName)
                          ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
                          : order.user.username || order.user.email || "-"
                        : "-"}
                    </h6>
                    <small className="text-muted">{order.user?.email || ''}</small>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <FaPhone className="text-muted me-2" />
                  <span>{order.user?.mobileNo || '-'}</span>
                </div>
                <div className="d-flex align-items-start">
                  <FaMapMarkerAlt className="text-muted me-2 mt-1" />
                  <span>{order.user?.address || '-'}</span>
                </div>
              </Card.Body>
            </Card>

            {/* Payment Information */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent">
                <h5 className="mb-0">Payment Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                    <FaCreditCard className="text-success" />
                  </div>
                  <div>
                    <h6 className="mb-0">{order.payment?.method || '-'}</h6>
                    <small className="text-muted">
                      Transaction ID: {order.payment?.transactionId || '-' }
                    </small>
                  </div>
                </div>
                <Badge
                  bg={order.payment?.status === 'paid' ? 'success' : 'warning'}
                >
                  {order.payment?.status || '-'}
                </Badge>
              </Card.Body>
            </Card>

            {/* Shipping Information */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent">
                <h5 className="mb-0">Shipping Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                    <FaTruck className="text-info" />
                  </div>
                  <div>
                    <h6 className="mb-0">{getShippingStatusLabel(order.shipping?.status)}</h6>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Order Actions */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent">
                <h5 className="mb-0">Order Actions</h5>
              </Card.Header>
              <Card.Body>
                <Button
                  variant="primary"
                  className="w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowStatusModal(true)}
                >
                  <FaEdit /> Update Status
                </Button>
                <Button
                  variant="outline-primary"
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => navigate(`/admin/orders/${id}/edit`)}
                >
                  <FaEdit /> Edit Order
                </Button>
                {order.status === 'returned' && (
                  <>
                    <Button
                      variant="success"
                      className="w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => setShowVerifyReturnModal(true)}
                    >
                      <FaCheck /> Verify Return Request
                    </Button>
                    <Modal show={showVerifyReturnModal} onHide={() => setShowVerifyReturnModal(false)}>
                      <Modal.Header closeButton>
                        <Modal.Title>Confirm Return Verification</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        Are you sure you want to verify this return request? This action cannot be undone.
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowVerifyReturnModal(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="success"
                          onClick={async () => {
                            try {
                              await adminAxios.put(`/orders/${id}/verify-return`);
                              // Refetch order details to update UI
                              const res = await adminAxios.get(`/orders/${id}`);
                              setOrder(res.data.order);
                              setShowVerifyReturnModal(false);
                            } catch (err) {
                              alert('Failed to verify return request');
                            }
                          }}
                        >
                          Confirm Verify
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
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
            <Form.Select
              value={selectedStatus}
              onChange={handleStatusChange}
            >
              <option value="">Select a status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
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
    </Container>
  );
};

export default AdminOrderDetails;