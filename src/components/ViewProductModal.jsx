import React, { useState } from "react";
import { Modal, Button, Row, Col, Badge, Image } from "react-bootstrap";
import { X } from "lucide-react";

const ViewProductModal = ({ show, onHide, product }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  const getStatusBadge = (status) => {
    const map = {
      active: "success",
      inactive: "secondary",
    };
    return (
      <Badge bg={map[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get images - prioritize product-level images, fallback to variant images
  const getProductImages = () => {
    const productImages = [product.mainImage, ...(product.otherImages || [])].filter(Boolean);
    if (productImages.length > 0) {
      return productImages;
    }
    
    // Fallback to first variant's images
    const variants = product.variantDetails && product.variantDetails.length > 0 
      ? product.variantDetails 
      : product.variants || [];
    
    if (variants.length > 0 && variants[0].imageUrls && variants[0].imageUrls.length > 0) {
      return variants[0].imageUrls;
    }
    
    return [];
  };

  const allImages = getProductImages();

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Product Details</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Row>
          {/* Product Images */}
          <Col md={6}>
            <div className="mb-3">
              <h6>Product Images</h6>
              {allImages.length > 0 ? (
                <div>
                  {/* Main Image */}
                  <div className="mb-3">
                    <Image
                      src={allImages[selectedImage]}
                      alt={product.name}
                      fluid
                      style={{ 
                        maxHeight: "300px", 
                        objectFit: "contain",
                        border: "1px solid #dee2e6",
                        borderRadius: "8px"
                      }}
                    />
                  </div>
                  
                  {/* Thumbnail Images */}
                  {allImages.length > 1 && (
                    <div className="d-flex gap-2 flex-wrap">
                      {allImages.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            cursor: "pointer",
                            border: selectedImage === index ? "2px solid #0d6efd" : "1px solid #dee2e6",
                            borderRadius: "4px"
                          }}
                          onClick={() => setSelectedImage(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted">No images available</p>
              )}
            </div>
          </Col>

          {/* Product Information */}
          <Col md={6}>
            <div className="mb-3">
              <h4>{product.name}</h4>
              <p className="text-muted mb-3">{product.description || "No description available"}</p>
              
              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Status:</strong>
                  <p>{getStatusBadge(product.status)}</p>
                </Col>
                <Col sm={6}>
                  <strong>Total Stock:</strong>
                  <p>{product.totalStock || 0}</p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Category:</strong>
                  <p>{product.category?.name || "N/A"}</p>
                </Col>
                <Col sm={6}>
                  <strong>Brand:</strong>
                  <p>{product.brand || "N/A"}</p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Created:</strong>
                  <p>{formatDate(product.createdAt)}</p>
                </Col>
                <Col sm={6}>
                  <strong>Product ID:</strong>
                  <p className="text-muted small">{product._id}</p>
                </Col>
              </Row>
            </div>

            {/* Variants */}
            <div className="mb-3">
              <h6>Variants</h6>
              {(product.variantDetails && product.variantDetails.length > 0) || (product.variants && product.variants.length > 0) ? (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Colour</th>
                        <th>Capacity</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(product.variantDetails && product.variantDetails.length > 0
                        ? product.variantDetails
                        : product.variants || []).map((variant, index) => (
                        <tr key={index}>
                          <td>{variant.colour || "N/A"}</td>
                          <td>{variant.capacity || "N/A"}</td>
                          <td className="text-primary fw-bold">₹{variant.price}</td>
                          <td>
                            <span className={`badge ${variant.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                              {variant.stock || 0}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${variant.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                              {variant.status || 'active'}
                            </span>
                          </td>
                          <td>{variant.createdAt ? formatDate(variant.createdAt) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No variants available</p>
              )}
            </div>

            {/* Additional Images */}
            {product.otherImages && product.otherImages.length > 0 && (
              <div className="mb-3">
                <h6>Additional Images</h6>
                <div className="d-flex gap-2 flex-wrap">
                  {product.otherImages.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Additional ${index + 1}`}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewProductModal;