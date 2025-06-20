import React, { useState, useEffect } from 'react';
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
  Modal,
  Image,
} from 'react-bootstrap';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaImage,
  FaSave,
  FaTimes,
} from 'react-icons/fa';
import AdminLeftbar from '../../components/AdminLeftbar';

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.categories);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch({ type: 'FETCH_CATEGORIES' });
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!selectedCategory && !formData.image)
      newErrors.image = 'Image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (selectedCategory) {
        await dispatch({
          type: 'UPDATE_CATEGORY',
          payload: { id: selectedCategory.id, ...formData },
        });
      } else {
        await dispatch({ type: 'CREATE_CATEGORY', payload: formData });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      image: null,
      status: category.status,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await dispatch({ type: 'DELETE_CATEGORY', payload: selectedCategory.id });
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      image: null,
      status: 'active',
    });
    setErrors({});
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container fluid className="py-5">
        <Row>
          <Col xs={12} md={3} lg={2} className="p-0">
            <AdminLeftbar />
          </Col>
          <Col xs={12} md={9} lg={10}>
            <div className="text-center">
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
                  onClick={() => setShowModal(true)}
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

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <Image
                            src={category.image}
                            alt={category.name}
                            className="rounded"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        </td>
                        <td>{category.name}</td>
                        <td>{category.description}</td>
                        <td>{getStatusBadge(category.status)}</td>
                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleEdit(category)}
                              className="d-flex align-items-center gap-1"
                            >
                              <FaEdit /> Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setSelectedCategory(category);
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

              {filteredCategories.length === 0 && (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No categories found</p>
                </div>
              )}
            </Card>

            {/* Category Form Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>
                  {selectedCategory ? 'Edit Category' : 'Add Category'}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
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
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      isInvalid={!!errors.description}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Image</Form.Label>
                    <div className="d-flex gap-3 align-items-center">
                      {formData.image ? (
                        <div className="position-relative">
                          <Image
                            src={URL.createObjectURL(formData.image)}
                            alt="Preview"
                            className="rounded"
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'cover',
                            }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-1"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, image: null }))
                            }
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      ) : selectedCategory?.image ? (
                        <Image
                          src={selectedCategory.image}
                          alt="Current"
                          className="rounded"
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                          }}
                        />
                      ) : null}
                      <div>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          isInvalid={!!errors.image}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.image}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Recommended size: 500x500 pixels
                        </Form.Text>
                      </div>
                    </div>
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className="d-flex align-items-center gap-2"
                >
                  <FaSave /> Save Category
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Delete Category</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to delete {selectedCategory?.name}? This action
                cannot be undone.
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
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
