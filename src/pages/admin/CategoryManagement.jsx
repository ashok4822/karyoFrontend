import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  OverlayTrigger,
  Tooltip,
  Pagination,
} from 'react-bootstrap';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaMinusCircle,
  FaTimesCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
} from 'react-icons/fa';
import AdminLeftbar from '../../components/AdminLeftbar';
import adminAxios from '../../lib/adminAxios';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const categoriesPerPage = 5;
  const searchInputRef = useRef(null);

  const fetchCategories = async (page = 1, search = '', status = statusFilter, sort = sortOrder) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAxios.get(`/categories?page=${page}&limit=${categoriesPerPage}&search=${encodeURIComponent(search)}&status=${status}&sort=${sort}`);
      setCategories(res.data.categories);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
      setCurrentPage(res.data.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, searchTerm, statusFilter, sortOrder);
    // eslint-disable-next-line
  }, [currentPage, searchTerm, statusFilter, sortOrder]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleShowModal = (category = null) => {
    setSelectedCategory(category);
    setFormData(category ? { name: category.name, status: category.status } : { name: '', status: 'active' });
    setShowModal(true);
    setErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({ name: '', status: 'active' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setModalLoading(true);
    try {
      if (selectedCategory) {
        await adminAxios.put(`/categories/${selectedCategory._id}`, formData);
      } else {
        await adminAxios.post('/categories', formData);
      }
      handleCloseModal();
      fetchCategories(currentPage, searchTerm, statusFilter, sortOrder);
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving category');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminAxios.delete(`/categories/${selectedCategory._id}`);
      setShowDeleteModal(false);
      fetchCategories(currentPage, searchTerm, statusFilter, sortOrder);
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting category');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
    };
    return (
      <Badge pill bg={variants[status] || 'secondary'} className="d-flex align-items-center justify-content-center gap-1">
        {status === 'active' ? <FaCheckCircle className="me-1 text-success" /> : <FaMinusCircle className="me-1 text-secondary" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderActionButton = (icon, tooltip, onClick, variant, disabled = false) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span>
        <Button
          variant={variant}
          size="sm"
          className="me-2"
          onClick={onClick}
          disabled={disabled}
          style={{ minWidth: 36 }}
        >
          {icon}
        </Button>
      </span>
    </OverlayTrigger>
  );

  const renderPagination = () => (
    <Pagination className="mb-0">
      <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
      <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />
      {[...Array(totalPages)].map((_, idx) => (
        <Pagination.Item
          key={idx + 1}
          active={currentPage === idx + 1}
          onClick={() => setCurrentPage(idx + 1)}
        >
          {idx + 1}
        </Pagination.Item>
      ))}
      <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
      <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
    </Pagination>
  );

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  function formatDateTime(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  }

  if (loading) {
    return (
      <Container fluid className="py-5">
        <Row>
          <Col xs={12} md={3} lg={2} className="p-0">
            <AdminLeftbar />
          </Col>
          <Col xs={12} md={9} lg={10}>
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          </Col>
        </Row>
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
                <h2 className="mb-0">Categories</h2>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => handleShowModal()}
                  className="d-flex align-items-center gap-2"
                >
                  <FaPlus /> Add Category
                </Button>
              </Col>
            </Row>
            {error && (
              <Alert variant="danger" className="mb-4">
                <FaExclamationTriangle className="me-2" />
                {error}
              </Alert>
            )}
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by category name"
                    value={searchTerm}
                    onChange={handleSearch}
                    disabled={loading}
                    autoFocus
                  />
                  {searchTerm && (
                    <Button variant="outline-secondary" onClick={handleClearSearch} tabIndex={-1}>
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select value={statusFilter} onChange={handleStatusFilter}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
            </Row>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-0">
                <Table responsive hover striped className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Name</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">
                        <span className="d-flex align-items-center justify-content-center gap-1">
                          Created At
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 ms-1"
                            style={{ lineHeight: 1 }}
                            onClick={handleSortToggle}
                            tabIndex={-1}
                          >
                            {sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />}
                          </Button>
                        </span>
                      </th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-5">
                          <div className="mb-2">
                            <FaExclamationTriangle size={32} className="text-warning mb-2" />
                          </div>
                          <div>No categories found.</div>
                          <Button variant="primary" className="mt-3" onClick={() => handleShowModal()}>
                            <FaPlus className="me-1" /> Add Category
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      categories.map((category, idx) => (
                        <tr key={category._id} className="category-row">
                          <td>{(currentPage - 1) * categoriesPerPage + idx + 1}</td>
                          <td>{category.name}</td>
                          <td className="text-center">{getStatusBadge(category.status)}</td>
                          <td className="text-center">{formatDateTime(category.createdAt)}</td>
                          <td className="text-center">
                            {renderActionButton(<FaEdit />, 'Edit', () => handleShowModal(category), 'outline-primary', modalLoading || deleteLoading)}
                            {renderActionButton(<FaTrash />, 'Delete', () => { setSelectedCategory(category); setShowDeleteModal(true); }, 'outline-danger', modalLoading || deleteLoading)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>Total Categories: {total}</div>
              {renderPagination()}
            </div>
            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
              <Modal.Header closeButton>
                <Modal.Title>{selectedCategory ? 'Edit Category' : 'Add Category'}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      isInvalid={!!errors.name}
                      required
                      autoFocus
                      disabled={modalLoading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={modalLoading}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={handleCloseModal} disabled={modalLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={modalLoading}>
                      {modalLoading ? <Spinner size="sm" animation="border" className="me-1" /> : <FaSave className="me-1" />} Save
                    </Button>
                  </div>
                </Form>
              </Modal.Body>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Delete Category</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
                <FaTimesCircle size={40} className="text-danger mb-3" />
                <div className="mb-2 text-danger fw-bold">Are you sure you want to delete category <b>{selectedCategory?.name}</b>?</div>
                <div className="text-muted small">This action can be undone by re-adding the category.</div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? <Spinner size="sm" animation="border" className="me-1" /> : <FaTrash className="me-1" />} Delete
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default CategoryManagement;
