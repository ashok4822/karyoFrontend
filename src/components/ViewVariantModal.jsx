import React from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";

const ViewVariantModal = ({ show, onHide, variant, product }) => {
  console.log('ViewVariantModal props:', { show, variant, product });
  
  if (!show || !variant || !product) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary">
          Active
        </Badge>
      );
    }
    
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

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Variant Details</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="mb-3">
          <h5>Product: {product.name}</h5>
          <p className="text-muted">Variant: {variant.colour} {variant.capacity}</p>
        </div>

        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Colour:</strong>
              <p>{variant.colour || "N/A"}</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong>Capacity:</strong>
              <p>{variant.capacity || "N/A"}</p>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Price:</strong>
              <p className="text-primary fs-5">${variant.price || "N/A"}</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong>Stock:</strong>
              <p>
                <span className={`badge ${(variant.stock || 0) > 0 ? 'bg-success' : 'bg-danger'}`}>
                  {variant.stock || 0}
                </span>
              </p>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Status:</strong>
              <p>{getStatusBadge(variant.status)}</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong>Created:</strong>
              <p>{variant.createdAt ? formatDate(variant.createdAt) : "N/A"}</p>
            </div>
          </Col>
        </Row>

        {variant.imageUrls && Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0 && (
          <div className="mb-3">
            <strong>Variant Images:</strong>
            <div className="d-flex gap-2 flex-wrap mt-2">
              {variant.imageUrls.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Variant ${index + 1}`}
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
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewVariantModal; 