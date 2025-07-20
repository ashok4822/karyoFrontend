import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  Modal,
  Tabs,
  Tab,
  Image,
  InputGroup,
} from 'react-bootstrap';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaImage,
  FaBox,
  FaTag,
  FaChartLine,
  FaExclamationTriangle,
  FaPlus,
  FaMinus,
  FaSave,
  FaTimes,
  FaUpload,
  FaCrop,
} from 'react-icons/fa';
import ImageCropper from '../../components/ImageCropper';
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from '../../utils/imageUtils';

const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.products);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showCropper, setShowCropper] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [cropperLoading, setCropperLoading] = useState(false);

  const [product, setProduct] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    comparePrice: 0,
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    status: 'active',
    stock: 0,
    images: [],
    variants: [],
    specifications: [],
    seo: {
      title: '',
      description: '',
      keywords: '',
    },
  });

  // Add a state for colour errors if you have inline editing, e.g.:
  // const [variantColourErrors, setVariantColourErrors] = useState([]);
  // Add a state for capacity errors if you have inline editing, e.g.:
  // const [variantCapacityErrors, setVariantCapacityErrors] = useState([]);

  useEffect(() => {
    dispatch({ type: 'FETCH_PRODUCT_DETAILS', payload: id });
  }, [dispatch, id]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setCurrentImageFile(file);
      setCurrentImageIndex(product.images.length);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedFile) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProduct({
        ...product,
        images: [...product.images, reader.result],
      });
    };
    reader.readAsDataURL(croppedFile);
    
    setShowCropper(false);
    setCurrentImageFile(null);
    setCurrentImageIndex(null);
  };

  const handleDeleteProduct = async () => {
    try {
      await dispatch({ type: 'DELETE_PRODUCT', payload: id });
      navigate('/admin/products');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      await dispatch({ type: 'UPDATE_PRODUCT', payload: product });
      // Show success message
    } catch (error) {
      console.error('Error updating product:', error);
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
            onClick={() => navigate('/admin/products')}
            className="d-flex align-items-center gap-2"
          >
            <FaArrowLeft /> Back to Products
          </Button>
        </Col>
        <Col xs="auto">
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleSaveChanges}
              className="d-flex align-items-center gap-2"
            >
              <FaSave /> Save Changes
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaTrash /> Delete Product
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
                    <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => {
                          // For existing images, we can't crop them directly
                          // This would require re-uploading
                          setError("To crop this image, please remove it and upload again");
                        }}
                        title="Crop Image"
                      >
                        <FaCrop />
                      </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        // Implement image delete logic
                      }}
                        title="Remove Image"
                    >
                      <FaTimes />
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Product Details */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="details" title="Details">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Product Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.name}
                          onChange={(e) =>
                            setProduct({ ...product, name: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>SKU</Form.Label>
                        <Form.Control
                          type="text"
                          value={product.sku}
                          onChange={(e) =>
                            setProduct({ ...product, sku: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Compare Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>₹</InputGroup.Text>
                          <Form.Control
                            type="number"
                            value={product.comparePrice}
                            onChange={(e) =>
                              setProduct({
                                ...product,
                                comparePrice: parseFloat(e.target.value),
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
                          value={product.category}
                          onChange={(e) =>
                            setProduct({ ...product, category: e.target.value })
                          }
                        >
                          <option value="">Select Category</option>
                          {/* Add category options */}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Brand</Form.Label>
                        <Form.Select
                          value={product.brand}
                          onChange={(e) =>
                            setProduct({ ...product, brand: e.target.value })
                          }
                        >
                          <option value="">Select Brand</option>
                          {/* Add brand options */}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={product.status}
                          onChange={(e) =>
                            setProduct({ ...product, status: e.target.value })
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
                          value={product.stock}
                          onChange={(e) =>
                            setProduct({
                              ...product,
                              stock: parseInt(e.target.value),
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={product.description}
                          onChange={(e) =>
                            setProduct({
                              ...product,
                              description: e.target.value,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="variants" title="Variants">
                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="d-flex align-items-center gap-1"
                    >
                      <FaPlus /> Add Variant
                    </Button>
                  </div>
                  {product.variants.map((variant, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={2}>
                            <Form.Group>
                              <Form.Label>Colour</Form.Label>
                              <Form.Control
                                type="text"
                                value={variant.colour || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const newVariants = [...product.variants];
                                  newVariants[index].colour = value;
                                  setProduct({ ...product, variants: newVariants });
                                  // Validate
                                  // setVariantColourErrors((prev) => prev.map((err, i) => i === index ? (!/^[A-Za-z\s.,'"!?-]{0,100}$/.test(value) ? 'Invalid colour. Only letters, spaces, and basic punctuation are allowed (max 100 characters).' : '') : err));
                                }}
                                placeholder="e.g., Black, White, Red"
                              />
                              {/* Then, below the input, display the error: */}
                              {/* {variantColourErrors[index] && <div className="text-danger small mt-1">{variantColourErrors[index]}</div>} */}
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Form.Group>
                              <Form.Label>Capacity</Form.Label>
                              <Form.Control
                                type="text"
                                value={variant.capacity || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const newVariants = [...product.variants];
                                  newVariants[index].capacity = value;
                                  setProduct({ ...product, variants: newVariants });
                                  // Validate
                                  // setVariantCapacityErrors((prev) => prev.map((err, i) => i === index ? (!/^\d+(\.\d+)*L$/.test(value) ? 'Invalid capacity. Must start with a number, can have dots (not at the beginning or end), and end with a capital L.' : '') : err));
                                }}
                                placeholder="e.g., 128GB, 256GB"
                              />
                              {/* Then, below the input, display the error: */}
                              {/* {variantCapacityErrors[index] && <div className="text-danger small mt-1">{variantCapacityErrors[index]}</div>} */}
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Form.Group>
                              <Form.Label>Price</Form.Label>
                              <InputGroup>
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                  type="number"
                                  value={variant.price || 0}
                                  onChange={(e) => {
                                    const newVariants = [...product.variants];
                                    newVariants[index].price = parseFloat(e.target.value) || 0;
                                    setProduct({ ...product, variants: newVariants });
                                  }}
                                  min="0"
                                  step="0.01"
                                />
                              </InputGroup>
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Form.Group>
                              <Form.Label>Stock</Form.Label>
                              <Form.Control
                                type="number"
                                value={variant.stock || 0}
                                onChange={(e) => {
                                  const newVariants = [...product.variants];
                                  newVariants[index].stock = parseInt(e.target.value) || 0;
                                  setProduct({ ...product, variants: newVariants });
                                }}
                                min="0"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2}>
                            <Form.Group>
                              <Form.Label>&nbsp;</Form.Label>
                              <Button
                                variant="danger"
                                className="w-100 d-flex align-items-center justify-content-center gap-1"
                                onClick={() => {
                                  const newVariants = product.variants.filter(
                                    (_, i) => i !== index
                                  );
                                  setProduct({ ...product, variants: newVariants });
                                }}
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

      {/* Image Cropper Modal */}
      <ImageCropper
        show={showCropper}
        onHide={() => {
          setShowCropper(false);
          setCurrentImageFile(null);
          setCurrentImageIndex(null);
        }}
        imageFile={currentImageFile}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Crop Product Image"
        loading={cropperLoading}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this product? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProduct}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProductDetails; 