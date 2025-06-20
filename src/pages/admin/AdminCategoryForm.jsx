import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from 'react-bootstrap';
import {
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaImage,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';

const AdminCategoryForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { loading, error } = useSelector((state) => state.categories);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    image: null,
    slug: '',
  });

  const [validated, setValidated] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch category data if editing
      dispatch({ type: 'FETCH_CATEGORY', payload: id });
    }
  }, [dispatch, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      if (id) {
        await dispatch({
          type: 'UPDATE_CATEGORY',
          payload: { id, data: formDataToSend },
        });
      } else {
        await dispatch({
          type: 'CREATE_CATEGORY',
          payload: formDataToSend,
        });
      }
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
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
            onClick={() => navigate('/admin/categories')}
            className="d-flex align-items-center gap-2"
          >
            <FaArrowLeft /> Back to Categories
          </Button>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h2 className="h3 mb-4 text-center">
                {id ? 'Edit Category' : 'Add New Category'}
              </h2>

              {error && (
                <Alert variant="danger" className="mb-4">
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </Alert>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Category Name</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter category name"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a category name.
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Slug</Form.Label>
                  <Form.Control
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="category-slug"
                    required
                  />
                  <Form.Text className="text-muted">
                    This will be used in the URL. Auto-generated from the name.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter category description"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
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

                <Form.Group className="mb-4">
                  <Form.Label>Category Image</Form.Label>
                  <div className="d-flex gap-3 align-items-start">
                    <div className="flex-grow-1">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mb-2"
                      />
                      <Form.Text className="text-muted">
                        Recommended size: 800x600 pixels. Max file size: 2MB
                      </Form.Text>
                    </div>
                    {imagePreview && (
                      <div
                        className="border rounded p-2"
                        style={{ width: '100px', height: '100px' }}
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="img-fluid"
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      </div>
                    )}
                  </div>
                </Form.Group>

                <div className="d-flex gap-2 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/admin/categories')}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaTimes /> Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="d-flex align-items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Category
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminCategoryForm; 