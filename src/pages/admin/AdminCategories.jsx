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
import { fetchCategories, createCategory, updateCategory, deleteCategory, restoreCategory } from '../../redux/reducers/categorySlice';

const AdminCategories = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.categories);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    // Fetch all categories by default
    dispatch(fetchCategories({ status: 'all' }));
  }, [dispatch]);

  // Refetch categories when status filter changes
  useEffect(() => {
    dispatch(fetchCategories({ status: statusFilter }));
  }, [dispatch, statusFilter]);

  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      dispatch(updateCategory({ id: editingCategory._id, ...formData }));
    } else {
      dispatch(createCategory(formData));
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch(deleteCategory(id));
    }
  };

  const handleRestore = (id) => {
    if (window.confirm('Are you sure you want to restore this category?')) {
      dispatch(restoreCategory(id));
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

  // Separate active/inactive and deleted categories
  const activeCategories = categories.filter(category => 
    category.status !== 'deleted' && 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const deletedCategories = categories.filter(category => 
    category.status === 'deleted' && 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort categories
  const sortCategories = (categories) => {
    return categories.sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });
  };

  const sortedActiveCategories = sortCategories([...activeCategories]);
  const sortedDeletedCategories = sortCategories([...deletedCategories]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  const renderCategoryTable = (categories, title, showActions = true) => (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0">{title} ({categories.length})</h5>
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
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('productCount')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Products {getSortIcon('productCount')}
                  </div>
                </th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 5 : 4} className="text-center text-muted">
                    No {title.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{category.description}</td>
                    <td>
                      <Badge
                        bg={
                          category.status === 'active' 
                            ? 'success' 
                            : category.status === 'inactive' 
                              ? 'warning' 
                              : 'danger'
                        }
                      >
                        {category.status}
                      </Badge>
                    </td>
                    <td>{category.productCount || 0}</td>
                    {showActions && (
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowModal(category)}
                          >
                            <FaEdit />
                          </Button>
                          {category.status !== 'deleted' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(category._id)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                          {category.status === 'deleted' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleRestore(category._id)}
                              title="Restore Category"
                            >
                              <FaUndo />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="h2 mb-0">Categories Management</h1>
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
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="mb-4">
            <Row>
              <Col md={8}>
                <Form.Control
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-100"
                />
              </Col>
              <Col md={4}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deleted">Deleted</option>
                </Form.Select>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>

      {/* Active/Inactive Categories */}
      {renderCategoryTable(sortedActiveCategories, 'Active Categories')}

      {/* Deleted Categories */}
      {sortedDeletedCategories.length > 0 && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-danger text-white">
            <h5 className="mb-0">Deleted Categories ({sortedDeletedCategories.length})</h5>
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
                    <th>Status</th>
                    <th>Products</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeletedCategories.map((category) => (
                    <tr key={category._id} className="table-danger">
                      <td>{category.name}</td>
                      <td>{category.description}</td>
                      <td>
                        <Badge bg="danger">
                          {category.status}
                        </Badge>
                      </td>
                      <td>{category.productCount || 0}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleRestore(category._id)}
                            title="Restore Category"
                          >
                            <FaUndo />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deleted">Deleted</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminCategories; 