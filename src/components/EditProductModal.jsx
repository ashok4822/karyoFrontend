import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import adminAxios from "../lib/adminAxios";

const EditProductModal = ({ show, onHide, onProductUpdated, categories, product, variants = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [variantList, setVariantList] = useState(variants);
  const [nameError, setNameError] = useState("");
  const [brandError, setBrandError] = useState("");

  // Populate form when product changes
  useEffect(() => {
    if (product && show) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category: product.category?._id || "",
        brand: product.brand || "",
        status: product.status || "active",
      });
    }
  }, [product, show]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      brand: "",
      status: "active",
    });
    setError("");
    setSuccess("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Product name is required");
      return false;
    }
    if (!/^[\w\s.,'"!?-]{0,100}$/.test(trimmedName)) {
      setNameError("Invalid product name. Only letters, numbers, spaces, and basic punctuation are allowed (max 100 characters).");
      return false;
    }
    setNameError("");
    const trimmedBrand = formData.brand.trim();
    if (!trimmedBrand) {
      setError("Brand is required");
      return false;
    }
    if (!/^[A-Za-z\s.,'"!?-]{0,100}$/.test(trimmedBrand)) {
      setBrandError("Invalid brand name. Only letters, spaces, and basic punctuation are allowed (max 100 characters).");
      return false;
    }
    setBrandError("");
    if (!formData.category) {
      setError("Category is required");
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
      
      // Add product data
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("status", formData.status);

      const response = await adminAxios.put(`/products/${product._id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Product updated successfully!");
      setTimeout(() => {
        onProductUpdated();
        onHide();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Product</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={e => {
                    handleInputChange(e);
                    setNameError("");
                  }}
                  placeholder="Enter product name"
                  required
                />
                { nameError && <div className="text-danger small mt-1">{nameError}</div> }
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Brand *</Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={e => {
                    handleInputChange(e);
                    setBrandError("");
                  }}
                  placeholder="Enter brand name"
                  required
                />
                { brandError && <div className="text-danger small mt-1">{brandError}</div> }
              </Form.Group>
            </Col>
            
            <Col md={6}>
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

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
            />
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating Product...
              </>
            ) : (
              "Update Product"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditProductModal; 