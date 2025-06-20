import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
} from 'react-bootstrap';
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
} from 'react-icons/fa';

const AdminOrders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersPerPage = 10;

  useEffect(() => {
    dispatch({ type: 'FETCH_ORDERS' });
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await dispatch({ type: 'DELETE_ORDER', payload: orderId });
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesDate = dateFilter ? order.date.includes(dateFilter) : true;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'date') {
        return direction * (new Date(a.date) - new Date(b.date));
      }
      if (sortField === 'total') {
        return direction * (a.total - b.total);
      }
      return direction * a[sortField].localeCompare(b[sortField]);
    });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      processing: 'primary',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
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
          <h2 className="mb-0">Orders</h2>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/orders/new')}
            className="d-flex align-items-center gap-2"
          >
            Create Order
          </Button>
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
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
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
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Control
                type="date"
                value={dateFilter}
                onChange={handleDateFilter}
              />
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
              >
                <FaFilter /> Clear
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
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('orderNumber')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Order ID
                    <SortIcon field="orderNumber" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Date
                    <SortIcon field="date" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('customer.name')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Customer
                    <SortIcon field="customer.name" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Total
                    <SortIcon field="total" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="fw-medium">#{order.orderNumber}</div>
                  </td>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>
                    <div>{order.customer.name}</div>
                    <small className="text-muted">{order.customer.email}</small>
                  </td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaEye /> View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`/admin/orders/${order.id}/edit`)}
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

        {currentOrders.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No orders found</p>
          </div>
        )}

        {totalPages > 1 && (
          <Card.Footer className="bg-transparent border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {indexOfFirstOrder + 1} to{' '}
                {Math.min(indexOfLastOrder, filteredOrders.length)} of{' '}
                {filteredOrders.length} orders
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
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete order #{selectedOrder?.orderNumber}?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteOrder(selectedOrder?.id)}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders; 