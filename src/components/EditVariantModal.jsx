import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { X, Crop } from "lucide-react";
import ImageCropper from "./ImageCropper";
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from "../utils/imageUtils";
import { updateVariant } from "../services/admin/adminProductService";

const EditVariantModal = ({ show, onHide, onVariantUpdated, variant, product }) => {
  const [formData, setFormData] = useState({
    colour: "",
    capacity: "",
    price: "",
    stock: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [colourError, setColourError] = useState("");
  const [capacityError, setCapacityError] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef();
  const [showCropper, setShowCropper] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [cropperLoading, setCropperLoading] = useState(false);

  // Populate form when modal is opened
  useEffect(() => {
    if (variant && show) {
      setFormData({
        colour: variant.colour || "",
        capacity: variant.capacity || "",
        price: variant.price !== undefined && variant.price !== null ? String(variant.price) : "",
        stock: variant.stock !== undefined && variant.stock !== null ? String(variant.stock) : "",
        status: variant.status || "active",
      });
      setImagePreviews(variant.imageUrls || []);
      setSelectedImages([]);
    }
  }, [show]); // Only depend on show

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setFormData({
      colour: "",
      capacity: "",
      price: "",
      stock: "",
      status: "active",
    });
    setError("");
    setSuccess("");
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    // Generate previews
    const previews = files.map(file => createPreviewUrl(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleImageCrop = (index) => {
    const file = selectedImages[index];
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setCurrentImageFile(file);
    setCurrentImageIndex(index);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile) => {
    const newImages = [...selectedImages];
    newImages[currentImageIndex] = croppedFile;
    setSelectedImages(newImages);
    // Update preview
    const newPreviews = [...imagePreviews];
    newPreviews[currentImageIndex] = createPreviewUrl(croppedFile);
    setImagePreviews(newPreviews);
    setShowCropper(false);
    setCurrentImageFile(null);
    setCurrentImageIndex(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const trimmedColour = formData.colour.trim();
    if (!trimmedColour) {
      setError("Colour is required");
      return false;
    }
    if (!/^[A-Za-z\s.,'"!?-]{0,100}$/.test(trimmedColour)) {
      setColourError("Invalid colour. Only letters, spaces, and basic punctuation are allowed (max 100 characters).");
      return false;
    }
    setColourError("");
    const trimmedCapacity = formData.capacity.trim();
    if (!trimmedCapacity) {
      setError("Capacity is required");
      return false;
    }
    if (!/^\d+(\.\d+)*L$/.test(trimmedCapacity)) {
      setCapacityError("Invalid capacity. Must start with a number, can have dots (not at the beginning or end), and end with a capital L.");
      return false;
    }
    setCapacityError("");
    if (!formData.price || formData.price <= 0) {
      setError("Valid price is required");
      return false;
    }
    if (!formData.stock || formData.stock < 0) {
      setError("Valid stock is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();
      form.append("colour", formData.colour);
      form.append("capacity", formData.capacity);
      form.append("price", parseFloat(formData.price));
      form.append("stock", parseInt(formData.stock));
      form.append("status", formData.status);
      selectedImages.forEach((file) => {
        form.append("images", file);
      });
      const response = await updateVariant(product._id, variant._id, form);

      setSuccess("Variant updated successfully!");
      setTimeout(() => {
        onVariantUpdated();
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to update variant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Variant</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <div className="mb-3">
            <h6>Product: {product?.name}</h6>
            <p className="text-muted">Editing variant: {variant?.colour} {variant?.capacity}</p>
            <div className="alert alert-warning mt-2">
              Uploading new images will <b>replace</b> the old images for this variant.
            </div>
          </div>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Colour *</Form.Label>
                <Form.Control
                  type="text"
                  name="colour"
                  value={formData.colour}
                  onChange={e => {
                    handleInputChange(e);
                    setColourError("");
                  }}
                  placeholder="e.g., Red, Blue"
                  required
                />
                { colourError && <div className="text-danger small mt-1">{colourError}</div> }
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Capacity *</Form.Label>
                <Form.Control
                  type="text"
                  name="capacity"
                  value={formData.capacity}
                  onChange={e => {
                    handleInputChange(e);
                    setCapacityError("");
                  }}
                  placeholder="e.g., 1L, 1.5L"
                  required
                />
                { capacityError && <div className="text-danger small mt-1">{capacityError}</div> }
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price *</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Stock *</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Variant Images (min 3, will replace old images)</Form.Label>
                <Form.Control
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
                <div className="d-flex flex-wrap mt-2 gap-2">
                  {/* Show old images (from variant.imageUrls) as static previews, no icons */}
                  {variant && variant.imageUrls && variant.imageUrls.length > 0 && selectedImages.length === 0 && variant.imageUrls.map((src, idx) => (
                    <div key={idx} className="position-relative">
                      <img
                        src={src}
                        alt={`Old Preview ${idx + 1}`}
                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4, border: "1px solid #ccc" }}
                      />
                      {idx === 0 && (
                        <div className="position-absolute bottom-0 start-0 bg-primary text-white px-1 rounded">
                          <small>Main</small>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Show new images (selected in this session) with crop/remove icons */}
                  {selectedImages.length > 0 && imagePreviews.map((src, idx) => (
                    <div key={idx} className="position-relative">
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4, border: "1px solid #ccc" }}
                      />
                      <div className="position-absolute top-0 end-0 d-flex gap-1" style={{ transform: "translate(50%, -50%)" }}>
                        <Button
                          type="button"
                          variant="warning"
                          size="sm"
                          onClick={() => handleImageCrop(idx)}
                          title="Crop Image"
                        >
                          <Crop size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeImage(idx)}
                          title="Remove Image"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                      {idx === 0 && (
                        <div className="position-absolute bottom-0 start-0 bg-primary text-white px-1 rounded">
                          <small>Main</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating Variant...
              </>
            ) : (
              "Update Variant"
            )}
          </Button>
        </Modal.Footer>
      </Form>
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
        title="Crop Variant Image"
        loading={cropperLoading}
      />
    </Modal>
  );
};

export default EditVariantModal; 