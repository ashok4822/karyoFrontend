import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { X, Crop } from "lucide-react";
import { createVariant } from "../services/admin/adminProductService";
import ImageCropper from "./ImageCropper";
import { validateImageFile, createPreviewUrl, revokePreviewUrl } from "../utils/imageUtils";

const AddVariantModal = ({ show, onHide, onVariantAdded, product }) => {
  const [formData, setFormData] = useState({
    colour: "",
    capacity: "",
    price: "",
    stock: "",
    status: "active",
  });

  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [cropperLoading, setCropperLoading] = useState(false);

  // Reset form when modal opens/closes
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
    setImages([]);
    setImagePreview([]);
    setError("");
    setSuccess("");
    setShowCropper(false);
    setCurrentImageFile(null);
    setCurrentImageIndex(null);
    setCropperLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length < 3) {
      setError("Please select at least 3 images");
      return;
    }

    if (files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    setError("");
    setImages(files);

    // Create preview URLs
    const previews = files.map(file => createPreviewUrl(file));
    setImagePreview(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    if (newImages.length < 3) {
      setError("Minimum 3 images required");
    } else {
      setError("");
    }
    
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleImageCrop = (index) => {
    const file = images[index];
    
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
    const newImages = [...images];
    newImages[currentImageIndex] = croppedFile;
    setImages(newImages);
    
    // Update preview
    const newPreviews = [...imagePreview];
    newPreviews[currentImageIndex] = createPreviewUrl(croppedFile);
    setImagePreview(newPreviews);
    
    setShowCropper(false);
    setCurrentImageFile(null);
    setCurrentImageIndex(null);
  };

  const validateForm = () => {
    if (!formData.colour.trim()) {
      setError("Colour is required");
      return false;
    }
    if (!formData.capacity.trim()) {
      setError("Capacity is required");
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      setError("Valid price is required");
      return false;
    }
    if (!formData.stock || formData.stock < 0) {
      setError("Valid stock is required");
      return false;
    }
    if (images.length < 3) {
      setError("Minimum 3 images required");
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
      const formDataToSend = new FormData();
      
      // Add variant data
      formDataToSend.append("colour", formData.colour);
      formDataToSend.append("capacity", formData.capacity);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("status", formData.status);
      
      // Add images
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const response = await createVariant(product._id, formDataToSend);

      setSuccess("Variant added successfully!");
      setTimeout(() => {
        onVariantAdded();
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to add variant");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Variant</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <div className="mb-3">
            <h6>Product: {product.name}</h6>
            <p className="text-muted">Adding variant to existing product</p>
          </div>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Colour *</Form.Label>
                <Form.Control
                  type="text"
                  name="colour"
                  value={formData.colour}
                  onChange={handleInputChange}
                  placeholder="e.g., Red, Blue"
                  
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Capacity *</Form.Label>
                <Form.Control
                  type="text"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 128GB, 256GB"
                  
                />
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

          {/* Variant Images */}
          <div className="mb-3">
            <Form.Label>Variant Images * (Minimum 3)</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              
            />
            <Form.Text className="text-muted">
              Select at least 3 images for this variant. First image will be the main image.
            </Form.Text>
            
            {imagePreview.length > 0 && (
              <div className="mt-3">
                <h6>Selected Images:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="position-relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                      <div className="position-absolute top-0 end-0 d-flex gap-1" style={{ transform: "translate(50%, -50%)" }}>
                        <Button
                          type="button"
                          variant="warning"
                          size="sm"
                          onClick={() => handleImageCrop(index)}
                          title="Crop Image"
                        >
                          <Crop size={12} />
                        </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeImage(index)}
                          title="Remove Image"
                      >
                        <X size={12} />
                      </Button>
                      </div>
                      {index === 0 && (
                        <div className="position-absolute bottom-0 start-0 bg-primary text-white px-1 rounded">
                          <small>Main</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding Variant...
              </>
            ) : (
              "Add Variant"
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

export default AddVariantModal; 