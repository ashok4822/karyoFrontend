import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { Plus, X, Upload, Crop } from "lucide-react";
import {
  createProduct,
  getAllProducts,
} from "../services/admin/adminProductService";
import { getAllActiveCategories } from "../services/admin/adminCategoryService";
import ImageCropper from "./ImageCropper";
import {
  validateImageFile,
  createPreviewUrl,
  revokePreviewUrl,
} from "../utils/imageUtils";

const AddProductModal = ({ show, onHide, onProductAdded, categories }) => {
  console.log("AddProductModal received categories:", categories);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    status: "active",
  });

  const [variants, setVariants] = useState([
    {
      colour: "",
      capacity: "",
      price: "",
      stock: "",
      status: "active",
      images: [],
    },
  ]);

  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVariants, setShowVariants] = useState(false);
  const [colourErrors, setColourErrors] = useState([]);
  const [capacityErrors, setCapacityErrors] = useState([]);
  const [nameError, setNameError] = useState("");
  const [brandError, setBrandError] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [croppingForVariant, setCroppingForVariant] = useState(null);
  const [cropperLoading, setCropperLoading] = useState(false);

  // Reset form when modal opens/closes
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
    setVariants([
      {
        colour: "",
        capacity: "",
        price: "",
        stock: "",
        status: "active",
        images: [],
      },
    ]);
    setImages([]);
    setImagePreview([]);
    setError("");
    setSuccess("");
    setShowVariants(false);
    setColourErrors([]);
    setCapacityErrors([]);
    setNameError("");
    setBrandError("");
    setShowCropper(false);
    setCurrentImageFile(null);
    setCroppingForVariant(null);
    setCropperLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        colour: "",
        capacity: "",
        price: "",
        stock: "",
        status: "active",
        images: [],
      },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (!showVariants) {
      // Product-level images
      if (files.length < 3) {
        setError("Please select at least 3 images");
        return;
      }
    }

    if (files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    setError("");
    setImages(files);

    // Create preview URLs
    const previews = files.map((file) => createPreviewUrl(file));
    setImagePreview(previews);
  };

  const handleVariantImageChange = (variantIndex, e) => {
    const files = Array.from(e.target.files);

    if (files.length < 3) {
      setError("Please select at least 3 images for this variant");
      return;
    }

    if (files.length > 10) {
      setError("Maximum 10 images allowed per variant");
      return;
    }

    setError("");

    const newVariants = [...variants];
    newVariants[variantIndex].images = files;
    setVariants(newVariants);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);

    if (!showVariants && newImages.length < 3) {
      setError("Minimum 3 images required");
    } else {
      setError("");
    }

    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].images = newVariants[variantIndex].images.filter(
      (_, i) => i !== imageIndex
    );

    if (newVariants[variantIndex].images.length < 3) {
      setError("Minimum 3 images required for this variant");
    } else {
      setError("");
    }

    setVariants(newVariants);
  };

  const handleImageCrop = (variantIndex, imageIndex) => {
    const newVariants = [...variants];
    const file = newVariants[variantIndex].images[imageIndex];

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setCurrentImageFile(file);
    setCroppingForVariant({ variantIndex, imageIndex });
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile) => {
    if (croppingForVariant) {
      const { variantIndex, imageIndex } = croppingForVariant;
      const newVariants = [...variants];
      newVariants[variantIndex].images[imageIndex] = croppedFile;
      setVariants(newVariants);
    } else {
      // Product-level image cropping
      const newImages = [...images];
      const imageIndex = images.findIndex((img) => img === currentImageFile);
      if (imageIndex !== -1) {
        newImages[imageIndex] = croppedFile;
        setImages(newImages);

        // Update preview
        const newPreviews = [...imagePreview];
        newPreviews[imageIndex] = createPreviewUrl(croppedFile);
        setImagePreview(newPreviews);
      }
    }

    setShowCropper(false);
    setCurrentImageFile(null);
    setCroppingForVariant(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Product name is required");
      return false;
    }
    if (!formData.category) {
      setError("Category is required");
      return false;
    }
    if (!formData.brand.trim()) {
      setError("Brand is required");
      return false;
    }

    // Validate images based on whether variants are enabled
    if (!showVariants) {
      if (images.length < 3) {
        setError("Minimum 3 images required");
        return false;
      }
    }

    // Validate variants only if they are shown
    if (showVariants) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.colour.trim()) {
          setError(`Colour is required for variant ${i + 1}`);
          return false;
        }
        if (!variant.capacity.trim()) {
          setError(`Capacity is required for variant ${i + 1}`);
          return false;
        }
        if (!variant.price || variant.price <= 0) {
          setError(`Valid price is required for variant ${i + 1}`);
          return false;
        }
        if (!variant.stock || variant.stock < 0) {
          setError(`Valid stock is required for variant ${i + 1}`);
          return false;
        }
        if (!variant.images || variant.images.length < 3) {
          setError(`Minimum 3 images required for variant ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  // Test function to check authentication and categories
  const testConnection = async () => {
    try {
      console.log("Testing connection...");

      // Check if admin token exists
      const adminToken = localStorage.getItem("adminAccessToken");
      console.log("Admin token exists:", !!adminToken);
      console.log(
        "Admin token (first 20 chars):",
        adminToken ? adminToken.substring(0, 20) + "..." : "None"
      );

      // Test categories endpoint
      console.log("Testing categories endpoint...");
      const categoriesResponse = await getAllActiveCategories();
      console.log("Categories response:", categoriesResponse);
      console.log("Categories data:", categoriesResponse.data);
      console.log("Categories data type:", typeof categoriesResponse.data);

      // Handle different response structures
      const categoriesArray =
        categoriesResponse.data.categories || categoriesResponse.data;
      console.log("Categories array:", categoriesArray);
      console.log("Categories array length:", categoriesArray?.length);
      console.log(
        "Categories endpoint working:",
        categoriesArray?.length || 0,
        "categories found"
      );

      // Test products endpoint
      console.log("Testing products endpoint...");
      const productsResponse = await getAllProducts();
      console.log("Products response:", productsResponse);
      console.log("Products data:", productsResponse.data);
      console.log("Products data type:", typeof productsResponse.data);

      // Handle different response structures for products
      const productsArray =
        productsResponse.data.products || productsResponse.data;
      console.log("Products array:", productsArray);
      console.log("Products array length:", productsArray?.length);
      console.log(
        "Products endpoint working:",
        productsArray?.length || 0,
        "products found"
      );

      // Test if we can access the categories prop
      console.log("Categories prop in component:", categories);
      console.log("Categories prop length:", categories?.length);

      // Test if categories are available for the dropdown
      if (categories && categories.length > 0) {
        console.log(
          "✅ Categories available for dropdown:",
          categories.map((c) => ({ id: c._id, name: c.name }))
        );
      } else {
        console.log("❌ No categories available for dropdown");
      }

      alert("✅ Connection test successful! Check console for details.");
    } catch (error) {
      console.error("Connection test failed:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      alert(
        `❌ Connection test failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Product name validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setNameError("Product name is required.");
      return;
    }
    if (!/^[\w\s.,'"!?-]{0,100}$/.test(trimmedName)) {
      setNameError(
        "Invalid product name. Only letters, numbers, spaces, and basic punctuation are allowed (max 100 characters)."
      );
      return;
    }
    setNameError("");

    // Brand name validation
    const trimmedBrand = formData.brand.trim();
    if (!trimmedBrand) {
      setBrandError("Brand is required.");
      return;
    }
    if (!/^[A-Za-z\s.,'"!?-]{0,100}$/.test(trimmedBrand)) {
      setBrandError(
        "Invalid brand name. Only letters, spaces, and basic punctuation are allowed (max 100 characters)."
      );
      return;
    }
    setBrandError("");

    // Validate all variant colours
    const newColourErrors = variants.map((variant, index) => {
      const trimmed = (variant.colour || "").trim();
      if (!trimmed) return "Colour is required.";
      if (!/^[A-Za-z\s.,'"!?-]{0,100}$/.test(trimmed))
        return "Invalid colour. Only letters, spaces, and basic punctuation are allowed (max 100 characters).";
      return "";
    });
    setColourErrors(newColourErrors);
    // Validate all variant capacities
    const newCapacityErrors = variants.map((variant, index) => {
      const trimmed = (variant.capacity || "").trim();
      if (!trimmed) return "Capacity is required.";
      if (!/^\d+(\.\d+)*L$/.test(trimmed))
        return "Invalid capacity. Must start with a number, can have dots (not at the beginning or end), and end with a capital L.";
      return "";
    });
    setCapacityErrors(newCapacityErrors);
    if (
      newColourErrors.some((err) => err) ||
      newCapacityErrors.some((err) => err)
    )
      return;

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

      // Debug logging
      console.log("Form data being sent:", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        status: formData.status,
        showVariants,
        imagesCount: images.length,
        variantsCount: variants.length,
      });

      // Add variants as JSON string only if variants are shown
      if (showVariants) {
        // Remove images from variants before sending as JSON
        const variantsWithoutImages = variants.map((v) => ({
          colour: v.colour,
          capacity: v.capacity,
          price: v.price,
          stock: v.stock,
          status: v.status,
        }));
        formDataToSend.append(
          "variants",
          JSON.stringify(variantsWithoutImages)
        );

        console.log("Variants being sent:", variantsWithoutImages);

        // Add variant images
        variants.forEach((variant, variantIndex) => {
          console.log(
            `Adding ${variant.images.length} images for variant ${variantIndex}`
          );
          variant.images.forEach((image, imageIndex) => {
            formDataToSend.append(`variantImages_${variantIndex}`, image);
          });
        });
      } else {
        // Add product-level images
        console.log(`Adding ${images.length} product-level images`);
        images.forEach((image, index) => {
          console.log(
            `Adding image ${index + 1}:`,
            image.name,
            image.type,
            image.size
          );
          formDataToSend.append("images", image);
        });
      }

      console.log("Sending request to /products...");
      const response = await createProduct(formDataToSend);

      console.log("Product created successfully:", response.data);
      setSuccess("Product added successfully!");
      setTimeout(() => {
        onProductAdded();
        onHide();
      }, 1500);
    } catch (err) {
      console.error("Product creation error:", err);
      console.error("Error response:", err.response?.data);

      // Show detailed error information
      if (err.response?.data) {
        const errorData = err.response.data;
        let errorMessage = errorData.message || "Failed to add product";

        // Add additional error details if available
        if (errorData.missingFields) {
          errorMessage += `\nMissing fields: ${errorData.missingFields.join(
            ", "
          )}`;
        }

        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage += `\nValidation errors: ${errorData.errors.join(", ")}`;
        }

        if (errorData.imagesReceived !== undefined) {
          errorMessage += `\nImages received: ${errorData.imagesReceived}`;
        }

        if (errorData.nonImageFiles && errorData.nonImageFiles.length > 0) {
          errorMessage += `\nNon-image files: ${errorData.nonImageFiles.join(
            ", "
          )}`;
        }

        setError(errorMessage);
      } else {
        setError(
          "Failed to add product. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Product</Modal.Title>
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
                  onChange={(e) => {
                    handleInputChange(e);
                    setNameError("");
                  }}
                  placeholder="Enter product name"
                />
                {nameError && (
                  <div className="text-danger small mt-1">{nameError}</div>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No categories available
                    </option>
                  )}
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
                  onChange={(e) => {
                    handleInputChange(e);
                    setBrandError("");
                  }}
                  placeholder="Enter brand name"
                />
                {brandError && (
                  <div className="text-danger small mt-1">{brandError}</div>
                )}
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

          {/* Debug Section - Remove in production */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="mb-3 p-3 bg-light border rounded">
              <h6>Debug Info (Development Only)</h6>
              <div className="small">
                <div>Name: "{formData.name}"</div>
                <div>Category: "{formData.category}"</div>
                <div>Brand: "{formData.brand}"</div>
                <div>Description: "{formData.description}"</div>
                <div>Status: "{formData.status}"</div>
                <div>Show Variants: {showVariants ? 'Yes' : 'No'}</div>
                <div>Product Images: {images.length}</div>
                <div>Variants: {variants.length}</div>
                {showVariants && variants.map((v, i) => (
                  <div key={i} className="ms-3">
                    Variant {i + 1}: {v.colour} | {v.capacity} | ${v.price} | {v.stock} | {v.images.length} images
                  </div>
                ))}
              </div>
              <Button 
                type="button" 
                variant="outline-info" 
                size="sm" 
                onClick={testConnection}
                className="mt-2"
              >
                Test Connection
              </Button>
            </div>
          )} */}

          {/* Variants Section - Optional */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Variants</Form.Label>
              <Button
                type="button"
                variant={showVariants ? "outline-secondary" : "outline-primary"}
                size="sm"
                onClick={() => setShowVariants(!showVariants)}
              >
                {showVariants ? "Hide Variants" : "Add Variants"}
              </Button>
            </div>

            {showVariants && (
              <>
                <div className="d-flex justify-content-end mb-2">
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    onClick={addVariant}
                  >
                    <Plus size={16} /> Add Variant
                  </Button>
                </div>

                {variants.map((variant, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Variant {index + 1}</h6>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>

                    {/* Variant Basic Information Group */}
                    <div className="mb-3">
                      <h6 className="text-primary mb-2">Basic Information</h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Colour *</Form.Label>
                            <Form.Control
                              type="text"
                              value={variant.colour}
                              onChange={(e) => {
                                handleVariantChange(
                                  index,
                                  "colour",
                                  e.target.value
                                );
                                setColourErrors((prev) =>
                                  prev.map((err, i) => (i === index ? "" : err))
                                );
                              }}
                              placeholder="e.g., Red, Blue"
                            />
                          </Form.Group>
                          {colourErrors[index] && (
                            <div className="text-danger small mt-1">
                              {colourErrors[index]}
                            </div>
                          )}
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Capacity *</Form.Label>
                            <Form.Control
                              type="text"
                              value={variant.capacity}
                              onChange={(e) => {
                                handleVariantChange(
                                  index,
                                  "capacity",
                                  e.target.value
                                );
                                setCapacityErrors((prev) =>
                                  prev.map((err, i) => (i === index ? "" : err))
                                );
                              }}
                              placeholder="e.g., 1L, 1.5L"
                            />
                          </Form.Group>
                          {capacityErrors[index] && (
                            <div className="text-danger small mt-1">
                              {capacityErrors[index]}
                            </div>
                          )}
                        </Col>
                      </Row>
                    </div>

                    {/* Variant Pricing & Inventory Group */}
                    <div className="mb-3">
                      <h6 className="text-success mb-2">Pricing & Inventory</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Price *</Form.Label>
                            <Form.Control
                              type="number"
                              value={variant.price}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "price",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Stock *</Form.Label>
                            <Form.Control
                              type="number"
                              value={variant.stock}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "stock",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              min="0"
                            />
                          </Form.Group>
                        </Col>

                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                              value={variant.status}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "status",
                                  e.target.value
                                )
                              }
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    {/* Variant Images Group */}
                    <div className="mt-3">
                      <h6 className="text-info mb-2">Images</h6>
                      <Form.Label>Variant Images * (Minimum 3)</Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleVariantImageChange(index, e)}
                      />
                      <Form.Text className="text-muted">
                        Select at least 3 images for this variant. First image
                        will be the main image.
                      </Form.Text>

                      {variant.images && variant.images.length > 0 && (
                        <div className="mt-3">
                          <h6>Selected Images for Variant {index + 1}:</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {variant.images.map((image, imageIndex) => (
                              <div
                                key={imageIndex}
                                className="position-relative"
                              >
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Variant ${index + 1} Preview ${
                                    imageIndex + 1
                                  }`}
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                                <div
                                  className="position-absolute top-0 end-0 d-flex gap-1"
                                  style={{ transform: "translate(50%, -50%)" }}
                                >
                                  <Button
                                    type="button"
                                    variant="warning"
                                    size="sm"
                                    onClick={() =>
                                      handleImageCrop(index, imageIndex)
                                    }
                                    title="Crop Image"
                                  >
                                    <Crop size={12} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      removeVariantImage(index, imageIndex)
                                    }
                                    title="Remove Image"
                                  >
                                    <X size={12} />
                                  </Button>
                                </div>
                                {imageIndex === 0 && (
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
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Images Section - Only show if variants are not enabled (removed this section) */}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding Product...
              </>
            ) : (
              "Add Product"
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
          setCroppingForVariant(null);
        }}
        imageFile={currentImageFile}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title={
          croppingForVariant
            ? `Crop Variant ${croppingForVariant.variantIndex + 1} Image`
            : "Crop Product Image"
        }
        loading={cropperLoading}
      />
    </Modal>
  );
};

export default AddProductModal;
