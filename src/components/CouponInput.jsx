import React, { useState } from "react";
import { validateCouponCode } from "../services/user/userService";
import { Button, Form, Spinner, Alert } from "react-bootstrap";

const CouponInput = ({ orderAmount, appliedCoupon, onApply, onRemove }) => {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();
    setError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter a coupon code");
      return;
    }
    if (!/^[A-Z0-9_\-]{3,20}$/.test(code)) {
      setError("Code must be 3-20 characters, uppercase letters, numbers, - or _ only");
      return;
    }
    setLoading(true);
    try {
      const res = await validateCouponCode(code, orderAmount);
      console.log("Coupon validation response:", res);
      console.log("Discount data:", res.data);
      if (res && res.data && res.data.discount) {
        onApply(res.data.discount);
        setCouponCode("");
      } else {
        setError("Invalid coupon code");
      }
    } catch (err) {
      setError(err?.message || "Invalid coupon code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <Form onSubmit={handleApply} className="d-flex gap-2 align-items-center">
        <Form.Control
          size="sm"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          style={{ maxWidth: 180 }}
          disabled={!!appliedCoupon || loading}
        />
        <Button
          size="sm"
          variant="outline-primary"
          type="submit"
          disabled={!!appliedCoupon || loading}
        >
          {loading ? <Spinner size="sm" animation="border" /> : "Apply"}
        </Button>
        {appliedCoupon && (
          <Button
            size="sm"
            variant="outline-danger"
            onClick={onRemove}
            disabled={loading}
          >
            Remove
          </Button>
        )}
      </Form>
      {error && <Alert variant="danger" className="mt-2 py-1 px-2">{error}</Alert>}
      {appliedCoupon && (
        <Alert variant="success" className="mt-2 py-1 px-2">
          Coupon <b>{appliedCoupon.code}</b> applied: {appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}
        </Alert>
      )}
    </div>
  );
};

export default CouponInput; 