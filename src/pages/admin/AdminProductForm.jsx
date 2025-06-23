import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
  Modal,
  Tabs,
  Tab,
  Image,
} from 'react-bootstrap';
import {
  FaArrowLeft,
  FaSave,
  FaImage,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';

const AdminProductForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [validated, setValidated] = useState(false);
  const [nameError, setNameError] = useState("");
  const [brandError, setBrandError] = useState("");

  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    status: 'active',
    stock: '',
    images: [],
    variants: [],
    specifications: [],
    seo: {
      title: '',
      description: '',
      keywords: '',
    },
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Implement image upload logic
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct({
          ...product,
          images: [...product.images, reader.result],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Product name validation
    const trimmedName = product.name.trim();
    if (trimmedName && !/^[\w\s.,'"!?-]{0,100}$/.test(trimmedName)) {
      setNameError("Invalid product name. Only letters, numbers, spaces, and basic punctuation are allowed (max 100 characters).");
      setValidated(true);
      return;
    }
    setNameError("");

    // Brand validation
    const trimmedBrand = product.brand.trim();
    if (trimmedBrand && !/^[A-Za-z\s.,'"!?-]{0,100}$/.test(trimmedBrand)) {
      setBrandError("Invalid brand name. Only letters, spaces, and basic punctuation are allowed (max 100 characters).");
      setValidated(true);
      return;
    }
    setBrandError("");

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await dispatch({ type: 'CREATE_PRODUCT', payload: product });
      navigate('/admin/products');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = () => {
    setProduct({
      ...product,
      variants: [
        ...product.variants,
        {
          name: '',
          price: '',
          stock: '',
          sku: '',
        },
      ],
    });
  };

  const handleRemoveVariant = (index) => {
    const newVariants = product.variants.filter((_, i) => i !== index);
    setProduct({ ...product, variants: newVariants });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...product.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProduct({ ...product, variants: newVariants });
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/admin/products')}
            className="d-flex align-items-center gap-2"
          >
            <FaArrowLeft /> Back to Products
          </Button>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            className="d-flex align-items-center gap-2"
          >
            {loading ? (
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
                <FaSave /> Save Product
              </>
            )}
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      <Row className="g-4">
        {/* Product Images */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Product Images</h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowImageModal(true)}
                className="d-flex align-items-center gap-1"
              >
                <FaPlus /> Add Image
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column gap-3">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className="position-relative rounded overflow-hidden"
                    style={{ aspectRatio: '1' }}
                  >
                    <Image
                      src={image}
                      alt={`Product ${index + 1}`}
                      fluid
                      className="w-100 h-100 object-fit-cover"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-2"
                      onClick={() => {
                        const newImages = product.images.filter(
                          (_, i) => i !== index
                        );
                        setProduct({ ...product, images: newImages });
                      }}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Product Form */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="details" title="Details">
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Product Name</Form.Label>
                          <Form.Control
                            type="text"
                            required
                            value={product.name}
                            onChange={(e) => {
                              setProduct({ ...product, name: e.target.value });
                              setNameError("");
                            }}
                          />
                          {nameError && <div className="text-danger small mt-1">{nameError}</div>}
                          <Form.Control.Feedback type="invalid">
                            Please enter a product name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>SKU</Form.Label>
                          <Form.Control
                            type="text"
                            required
                            value={product.sku}
                            onChange={(e) =>
                              setProduct({ ...product, sku: e.target.value })
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter a SKU.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Price</Form.Label>
                          <InputGroup hasValidation>
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={product.price}
                              onChange={(e) =>
                                setProduct({
                                  ...product,
                                  price: e.target.value,
                                })
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              Please enter a valid price.
                            </Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Compare Price</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.comparePrice}
                              onChange={(e) =>
                                setProduct({
                                  ...product,
                                  comparePrice: e.target.value,
                                })
                              }
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Category</Form.Label>
                          <Form.Select
                            required
                            value={product.category}
                            onChange={(e) =>
                              setProduct({
                                ...product,
                                category: e.target.value,
                              })
                            }
                          >
                            <option value="">Select Category</option>
                            {/* Add category options */}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            Please select a category.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Brand</Form.Label>
                          <Form.Select
                            value={product.brand}
                            onChange={(e) => {
                              setProduct({ ...product, brand: e.target.value });
                              setBrandError("");
                            }}
                          >
                            <option value="">Select Brand</option>
                            {/* Add brand options */}
                          </Form.Select>
                          {brandError && <div className="text-danger small mt-1">{brandError}</div>}
                          <Form.Control.Feedback type="invalid">
                            Please enter a valid brand name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            value={product.status}
                            onChange={(e) =>
                              setProduct({
                                ...product,
                                status: e.target.value,
                              })
                            }
                          >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Stock</Form.Label>
                          <Form.Control
                            type="number"
                            required
                            min="0"
                            value={product.stock}
                            onChange={(e) =>
                              setProduct({
                                ...product,
                                stock: e.target.value,
                              })
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter a valid stock quantity.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            required
                            value={product.description}
                            onChange={(e) =>
                              setProduct({
                                ...product,
                                description: e.target.value,
                              })
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter a product description.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Tab>

                <Tab eventKey="variants" title="Variants">
                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleAddVariant}
                      className="d-flex align-items-center gap-1"
                    >
                      <FaPlus /> Add Variant
                    </Button>
                  </div>
                  {product.variants.map((variant, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Variant Name</Form.Label>
                              <Form.Control
                                type="text"
                                value={variant.name}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    'name',
                                    e.target.value
                                  )
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label>Price</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    'price',
                                    e.target.value
                                  )
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label>Stock</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) =>
                                  handleVariantChange(
                                    index,
                                    'stock',
                                    e.target.value
                                  )
                                }
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Form.Group>
                              <Form.Label>&nbsp;</Form.Label>
                              <Button
                                variant="danger"
                                className="w-100 d-flex align-items-center justify-content-center gap-1"
                                onClick={() => handleRemoveVariant(index)}
                              >
                                <FaTrash />
                              </Button>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </Tab>

                <Tab eventKey="seo" title="SEO">
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Meta Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.seo.title}
                          onChange={(e) =>
                            setProduct({
                              ...product,
                              seo: { ...product.seo, title: e.target.value },
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Meta Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={product.seo.description}
                          onChange={(e) =>
                            setProduct({
                              ...product,
                              seo: {
                                ...product.seo,
                                description: e.target.value,
                              },
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Keywords</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.seo.keywords}
                          onChange={(e) =>
                            setProduct({
                              ...product,
                              seo: { ...product.seo, keywords: e.target.value },
                            })
                          }
                        />
                        <Form.Text className="text-muted">
                          Separate keywords with commas
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Image Upload Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Product Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Choose Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowImageModal(false)}>
            Upload
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProductForm; 