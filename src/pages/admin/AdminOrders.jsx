import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Pagination,
  Dropdown,
  Modal,
} from "react-bootstrap";
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import AdminLeftbar from "../../components/AdminLeftbar";
import {
  deleteOrderById,
  getAllOrders,
} from "../../services/admin/adminOrderService";

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdatingOrder, setStatusUpdatingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [total, setTotal] = useState(0);

  const ordersPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      console.log('Fetching orders with params:', {
        page: currentPage,
        limit: ordersPerPage,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        sortBy: sortField,
        sortOrder: sortDirection,
      });
      const result = await getAllOrders({
        page: currentPage,
        limit: ordersPerPage,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      if (result.success) {
        const { orders = [], totalPages = 1, total = 0 } = result.data;
        setOrders(orders);
        setTotalPages(totalPages);
        setTotal(total);
      } else {
        console.log('Error in result:', result);
        setError(result.error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm, sortField, sortDirection]);

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleDeleteOrder = async (orderId) => {
    const result = await deleteOrderById(orderId);

    if (result.success) {
      const ordersResult = await getAllOrders({
        page: currentPage,
        limit: ordersPerPage,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      if (ordersResult.success) {
        setOrders(ordersResult.data.orders || []);
        setShowDeleteModal(false);
      } else {
        console.error(
          "Failed to refresh orders after deletion:",
          ordersResult.error
        );
      }
    } else {
      console.error("Error deleting order:", result.error);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      processing: "primary",
      shipped: "info",
      delivered: "success",
      cancelled: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Calculate correct start and end indices for the current page
  const startOrder =
    orders.length === 0 ? 0 : (currentPage - 1) * ordersPerPage + 1;
  const endOrder =
    orders.length === 0 ? 0 : Math.min(currentPage * ordersPerPage, total);

  const handleClearAll = () => {
    setSearchInput("");
    setSearchTerm("");
    setStatusFilter("");
    setSortField("createdAt");
    setSortDirection("desc");
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />;
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
    <Container fluid className="py-5">
      <Row>
        <Col xs={12} md={3} lg={2} className="p-0">
          <AdminLeftbar />
        </Col>
        <Col xs={12} md={9} lg={10}>
          <Container className="py-5">
            <Row className="mb-4">
              <Col>
                <h2 className="mb-0">Orders</h2>
              </Col>
            </Row>

            {error && (
              <Alert variant="danger" className="mb-4">
                <FaExclamationTriangle className="me-2" />
                {error}
              </Alert>
            )}

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row className="g-3 align-items-center">
                  <Col md={6}>
                    <Form onSubmit={handleSearchSubmit}>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by order number, customer name, email, or product name..."
                          value={searchInput}
                          onChange={handleSearchInputChange}
                        />
                        {searchInput && (
                          <Button 
                            type="button" 
                            variant="outline-secondary"
                            onClick={handleClearSearch}
                            title="Clear search"
                          >
                            ×
                          </Button>
                        )}
                        <Button type="submit" variant="outline-primary">
                          Search
                        </Button>
                      </InputGroup>
                    </Form>
                    <small className="text-muted mt-1 d-block">
                      Search by order number, customer name, email, or product name
                    </small>
                  </Col>
                  {/* Remove the status filter dropdown from the admin orders table UI */}
                  <Col md={3}>
                    <Button
                      variant="outline-secondary"
                      className="w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={handleClearAll}
                    >
                      <FaFilter /> Clear All
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="cursor-pointer">
                        <button
                          type="button"
                          onClick={() => handleSort("orderNumber")}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            margin: 0,
                            font: "inherit",
                            color: "inherit",
                            cursor: "pointer",
                            width: "100%",
                            textAlign: "left",
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Order ID
                            {getSortIcon("orderNumber")}
                          </div>
                        </button>
                      </th>
                      <th className="cursor-pointer">
                        <button
                          type="button"
                          onClick={() => handleSort("createdAt")}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            margin: 0,
                            font: "inherit",
                            color: "inherit",
                            cursor: "pointer",
                            width: "100%",
                            textAlign: "left",
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Date
                            {getSortIcon("createdAt")}
                          </div>
                        </button>
                      </th>
                      <th>Customer</th>
                      <th>Products</th>
                      <th>Status</th>
                      <th className="cursor-pointer">
                        <button
                          type="button"
                          onClick={() => handleSort("total")}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            margin: 0,
                            font: "inherit",
                            color: "inherit",
                            cursor: "pointer",
                            width: "100%",
                            textAlign: "left",
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Total
                            {getSortIcon("total")}
                          </div>
                        </button>
                      </th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.flatMap((order) =>
                      (order.items || []).map((item, idx) => {
                        const variant = item.productVariantId || {};
                        const product = variant.product || {};
                        const imageUrl = variant.imageUrls && variant.imageUrls.length > 0
                          ? variant.imageUrls[0]
                          : product.mainImage || "";
                        return (
                          <tr key={`${order._id || order.id}-${item._id || idx}`}>
                            <td>
                              <div className="fw-medium">#{order.orderNumber}</div>
                            </td>
                            <td>
                              {(() => {
                                const d = order.date
                                  ? new Date(order.date)
                                  : order.createdAt
                                  ? new Date(order.createdAt)
                                  : null;
                                if (!d) return "-";
                                const day = String(d.getDate()).padStart(2, "0");
                                const month = String(d.getMonth() + 1).padStart(2, "0");
                                const year = d.getFullYear();
                                return `${day}/${month}/${year}`;
                              })()}
                            </td>
                            <td>
                              <div>
                                {order.user
                                  ? order.user.firstName || order.user.lastName
                                    ? `${order.user.firstName || ""} ${
                                        order.user.lastName || ""
                                      }`.trim()
                                    : order.user.username || order.user.email || "-"
                                  : "-"}
                              </div>
                              <small className="text-muted">
                                {order.user?.email || ""}
                              </small>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <img
                                  src={imageUrl}
                                  alt={product.name || "Product"}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    border: "1px solid #dee2e6"
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                                <div className="flex-grow-1">
                                  <div className="fw-medium small">
                                    {product.name || "Product Name"}
                                  </div>
                                  <div className="text-muted small">
                                    {variant.colour && variant.capacity
                                      ? `${variant.colour} - ${variant.capacity}`
                                      : variant.colour || variant.capacity || ""}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>{getStatusBadge(item.itemStatus || order.status)}</td>
                            <td>₹{(order.computedTotal !== undefined ? order.computedTotal : order.total)?.toFixed(2) ?? "-"}</td>
                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/admin/orders/${order._id || order.id}`
                                    )
                                  }
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaEye /> View
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowDeleteModal(true);
                                  }}
                                  className="d-flex align-items-center gap-1"
                                >
                                  <FaTrash /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              {orders.length === 0 && (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No orders found</p>
                </div>
              )}

              {totalPages > 1 && (
                <Card.Footer className="bg-transparent border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted">
                      Showing {startOrder} to {endOrder} of {total} orders
                    </div>
                    <Pagination className="mb-0">
                      <Pagination.Prev
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                          key={index + 1}
                          active={index + 1 === currentPage}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                </Card.Footer>
              )}
            </Card>

            {/* Returned Product Variants - Pending Verification */}
            <Card className="mb-4">
              <Card.Header className="bg-warning bg-opacity-10 fw-bold">Returned Products - Pending Verification</Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.flatMap((order) =>
                      (order.items || [])
                        .filter(
                          (item) => item.itemStatus === "returned"
                        )
                        .map((item, idx) => {
                          const variant = item.productVariantId || {};
                          const product = variant.product || {};
                          return (
                            <tr key={`returned-pending-${order._id || order.id}-${item._id || idx}`}>
                              <td>#{order.orderNumber}</td>
                              <td>{product.name || "Product Name"}</td>
                              <td>
                                {variant.colour && variant.capacity
                                  ? `${variant.colour} - ${variant.capacity}`
                                  : variant.colour || variant.capacity || "-"}
                              </td>
                              <td>
                                <Badge bg="warning" text="dark">Pending Verification</Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => navigate(`/admin/orders/${order._id || order.id}`)}
                                >
                                  <FaEye /> View Order
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                    {/* If no pending returned items */}
                    {orders.flatMap((order) => order.items || []).filter(item => item.itemStatus === "returned").length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted">No returned products pending verification</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Returned Product Variants - Verified */}
            <Card className="mb-4">
              <Card.Header className="bg-success bg-opacity-10 fw-bold">Returned Products - Verified</Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.flatMap((order) =>
                      (order.items || [])
                        .filter(
                          (item) => item.itemStatus === "return_verified"
                        )
                        .map((item, idx) => {
                          const variant = item.productVariantId || {};
                          const product = variant.product || {};
                          return (
                            <tr key={`returned-verified-${order._id || order.id}-${item._id || idx}`}>
                              <td>#{order.orderNumber}</td>
                              <td>{product.name || "Product Name"}</td>
                              <td>
                                {variant.colour && variant.capacity
                                  ? `${variant.colour} - ${variant.capacity}`
                                  : variant.colour || variant.capacity || "-"}
                              </td>
                              <td>
                                <Badge bg="success">Verified</Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => navigate(`/admin/orders/${order._id || order.id}`)}
                                >
                                  <FaEye /> View Order
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                    {/* If no verified returned items */}
                    {orders.flatMap((order) => order.items || []).filter(item => item.itemStatus === "return_verified").length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted">No verified returned products found</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Cancelled Product Variants Table */}
            <Card className="mb-4">
              <Card.Header className="bg-danger bg-opacity-10 fw-bold">Cancelled Product Variants</Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.flatMap((order) =>
                      (order.items || [])
                        .filter(
                          (item) =>
                            item.itemStatus === "cancelled" || item.cancelled === true
                        )
                        .map((item, idx) => {
                          const variant = item.productVariantId || {};
                          const product = variant.product || {};
                          return (
                            <tr key={`cancelled-${order._id || order.id}-${item._id || idx}`}>
                              <td>#{order.orderNumber}</td>
                              <td>{product.name || "Product Name"}</td>
                              <td>
                                {variant.colour && variant.capacity
                                  ? `${variant.colour} - ${variant.capacity}`
                                  : variant.colour || variant.capacity || "-"}
                              </td>
                              <td>{item.itemStatus || "cancelled"}</td>
                              <td className="text-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => navigate(`/admin/orders/${order._id || order.id}`)}
                                >
                                  <FaEye /> View Order
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                    {/* If no cancelled items */}
                    {orders.flatMap((order) => order.items || []).filter(item => item.itemStatus === "cancelled" || item.cancelled === true).length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted">No cancelled product variants found</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal
              show={showDeleteModal}
              onHide={() => setShowDeleteModal(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>Delete Order</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to delete order #
                {selectedOrder?.orderNumber}? This action cannot be undone.
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    handleDeleteOrder(selectedOrder?._id || selectedOrder?.id)
                  }
                >
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Status Update Modal */}
            <Modal
              show={showStatusModal}
              onHide={() => setShowStatusModal(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>Update Order Status</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Return</option>
                  </Form.Select>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!statusUpdatingOrder) return;
                    const orderId =
                      statusUpdatingOrder._id || statusUpdatingOrder.id;

                    const updateResult = await updateOrderStatus(
                      orderId,
                      newStatus
                    );

                    if (updateResult.success) {
                      const fetchResult = await getAllOrders({
                        page: currentPage,
                        limit: ordersPerPage,
                        status: statusFilter || undefined,
                        search: searchTerm || undefined,
                        sortBy: sortField,
                        sortOrder: sortDirection,
                      });

                      if (fetchResult.success) {
                        setOrders(fetchResult.data.orders || []);
                        setShowStatusModal(false);
                        showSuccessAlert(
                          "Success",
                          "Order status updated successfully!"
                        );
                      } else {
                        alert("Failed to refresh orders.");
                      }
                    } else {
                      alert(updateResult.error || "Failed to update status.");
                    }
                  }}
                >
                  Update Status
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminOrders;
