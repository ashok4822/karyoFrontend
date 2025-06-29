import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
} from 'react-bootstrap';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
} from 'react-icons/fa';
import AdminLeftbar from '../../components/AdminLeftbar';

const AdminDiscounts = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumAmount: '',
    maximumDiscount: '',
    validFrom: '',
    validTo: '',
    status: 'active',
  });

  // Mock data for now - replace with actual Redux state later
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setDiscounts([]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleShowModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        name: discount.name,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minimumAmount: discount.minimumAmount,
        maximumDiscount: discount.maximumDiscount,
        validFrom: discount.validFrom,
        validTo: discount.validTo,
        status: discount.status,
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minimumAmount: '',
        maximumDiscount: '',
        validFrom: '',
        validTo: '',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumAmount: '',
      maximumDiscount: '',
      validFrom: '',
      validTo: '',
      status: 'active',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with actual API call
    console.log('Form submitted:', formData);
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      // TODO: Replace with actual API call
      console.log('Delete discount:', id);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? (
      <FaSortUp />
    ) : (
      <FaSortDown />
    );
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
                <h2 className="mb-0">Discount Management</h2>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => handleShowModal()}
                  className="d-flex align-items-center gap-2"
                >
                  <FaPlus /> Add New Discount
                </Button>
              </Col>
            </Row>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Filters and Search */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search Discounts</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="Search by name or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Status Filter</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Discounts Table */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Discounts ({discounts.length})</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead>
                      <tr>
                        <th
                          className="cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Name {getSortIcon('name')}
                          </div>
                        </th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min Amount</th>
                        <th>Valid Period</th>
                        <th
                          className="cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Status {getSortIcon('status')}
                          </div>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            <div>
                              <FaSearch className="mb-2" style={{ fontSize: '2rem' }} />
                              <p>No discounts found.</p>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal()}
                              >
                                Create your first discount
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        discounts.map((discount) => (
                          <tr key={discount._id}>
                            <td>{discount.name}</td>
                            <td>{discount.description}</td>
                            <td>
                              <Badge bg={discount.discountType === 'percentage' ? 'info' : 'warning'}>
                                {discount.discountType}
                              </Badge>
                            </td>
                            <td>{discount.discountValue}</td>
                            <td>₹{discount.minimumAmount}</td>
                            <td>
                              {new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validTo).toLocaleDateString()}
                            </td>
                            <td>
                              <Badge bg={discount.status === 'active' ? 'success' : 'secondary'}>
                                {discount.status}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleShowModal(discount)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(discount._id)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Container>
        </Col>
      </Row>

      {/* Add/Edit Discount Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDiscount ? 'Edit Discount' : 'Add New Discount'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type *</Form.Label>
                  <Form.Select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Value *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Amount</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Discount</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid From *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid To *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDiscount ? 'Update Discount' : 'Create Discount'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminDiscounts; 