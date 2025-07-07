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
import adminAxios from "../../lib/adminAxios";

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
      try {
        const params = {
          page: currentPage,
          limit: ordersPerPage,
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          sortBy: sortField,
          sortOrder: sortDirection,
        };
        const res = await adminAxios.get("/orders", { params });
        setOrders(res.data.orders || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch orders from server"
        );
      } finally {
        setLoading(false);
      }
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
    try {
      await adminAxios.delete(`/orders/${orderId}`);
      // Refresh orders list after delete
      const params = {
        page: currentPage,
        limit: ordersPerPage,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        sortBy: sortField,
        sortOrder: sortDirection,
      };
      const res = await adminAxios.get("/orders", { params });
      setOrders(res.data.orders || []);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting order:", error);
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
                  <Col md={4}>
                    <Form onSubmit={handleSearchSubmit}>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search orders..."
                          value={searchInput}
                          onChange={handleSearchInputChange}
                        />
                        <Button type="submit" variant="outline-primary">
                          <FaSearch />
                        </Button>
                      </InputGroup>
                    </Form>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={handleStatusFilter}
                      className="d-flex align-items-center gap-2"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Return</option>
                    </Form.Select>
                  </Col>

                  <Col md={2}>
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
                          style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}
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
                          style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Date
                            {getSortIcon("createdAt")}
                          </div>
                        </button>
                      </th>
                      <th>Customer</th>
                      <th className="cursor-pointer">
                        <button
                          type="button"
                          onClick={() => handleSort("total")}
                          style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Total
                            {getSortIcon("total")}
                          </div>
                        </button>
                      </th>
                      <th className="cursor-pointer">
                        <button
                          type="button"
                          onClick={() => handleSort("status")}
                          style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Status
                            {getSortIcon("status")}
                          </div>
                        </button>
                      </th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id || order.id}>
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
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
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
                        <td>₹{order.total?.toFixed(2) ?? "-"}</td>
                        <td>{getStatusBadge(order.status)}</td>
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
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setStatusUpdatingOrder(order);
                                setNewStatus(order.status);
                                setShowStatusModal(true);
                              }}
                              className="d-flex align-items-center gap-1"
                            >
                              <FaEdit /> Edit
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
                    ))}
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
                    try {
                      await adminAxios.put(
                        `/orders/${
                          statusUpdatingOrder._id || statusUpdatingOrder.id
                        }/status`,
                        { status: newStatus }
                      );
                      // Refresh orders list
                      const params = {
                        page: currentPage,
                        limit: ordersPerPage,
                        status: statusFilter || undefined,
                        search: searchTerm || undefined,
                        sortBy: sortField,
                        sortOrder: sortDirection,
                      };
                      const res = await adminAxios.get("/orders", { params });
                      setOrders(res.data.orders || []);
                      setShowStatusModal(false);
                    } catch (err) {
                      alert("Failed to update status");
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
