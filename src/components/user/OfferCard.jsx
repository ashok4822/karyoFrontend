import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { FaGift, FaTag, FaUsers } from "react-icons/fa";

const OfferCard = ({ offer, onApply, showApplyButton = true }) => {
  const getOfferTypeIcon = (type) => {
    switch (type) {
      case "product":
        return <FaTag className="text-primary" />;
      case "category":
        return <FaGift className="text-success" />;
      case "referral":
        return <FaUsers className="text-info" />;
      default:
        return <FaGift className="text-success" />;
    }
  };

  const getOfferTypeLabel = (type) => {
    switch (type) {
      case "product":
        return "Product Offer";
      case "category":
        return "Category Offer";
      case "referral":
        return "Referral Offer";
      default:
        return "Offer";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy format
  };

  const calculateDiscountText = () => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}% OFF`;
    } else {
      return `₹${offer.discountValue} OFF`;
    }
  };

  const isExpired = new Date() > new Date(offer.validTo);

  return (
    <Card className={`h-100 ${isExpired ? "opacity-50" : ""}`}>
      {isExpired && (
        <div
          className="position-absolute top-0 end-0 p-2"
          style={{ zIndex: 10 }}
        >
          <Badge bg="danger" className="fs-6">
            Expired
          </Badge>
        </div>
      )}

      <Card.Header className="border-0 pb-0">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {getOfferTypeIcon(offer.offerType)}
            <Badge bg="outline-secondary" className="fs-6 text-dark">
              {getOfferTypeLabel(offer.offerType)}
            </Badge>
          </div>
          <div className="text-end">
            <div className="h3 fw-bold text-success mb-0">
              {calculateDiscountText()}
            </div>
          </div>
        </div>
        <Card.Title className="h5 mt-2 mb-1">{offer.name}</Card.Title>
        <Card.Text className="text-muted small mb-0">
          {offer.description}
        </Card.Text>
      </Card.Header>

      <Card.Body className="pt-2">
        <div className="small">
          {offer.minimumAmount > 0 && (
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Min. Order:</span>
              <span className="fw-medium">₹{offer.minimumAmount}</span>
            </div>
          )}

          {offer.maximumDiscount && offer.discountType === "percentage" && (
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Max. Discount:</span>
              <span className="fw-medium">₹{offer.maximumDiscount}</span>
            </div>
          )}

          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Valid From:</span>
            <span className="fw-medium">{formatDate(offer.validFrom)}</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Valid Until:</span>
            <span className="fw-medium">{formatDate(offer.validTo)}</span>
          </div>

          {offer.maxUsage && (
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">Usage:</span>
              <span className="fw-medium">
                {offer.usageCount || 0} / {offer.maxUsage}
              </span>
            </div>
          )}
        </div>

        {/* {showApplyButton && !isExpired && onApply && (
          <Button
            variant="success"
            className="w-100 mt-3"
            onClick={() => onApply(offer)}
          >
            Apply Offer
          </Button>
        )} */}
      </Card.Body>
    </Card>
  );
};

export default OfferCard;
