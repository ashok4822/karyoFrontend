import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";

const OrderFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <img src="/failure-illustration.svg" alt="Order Failed" style={{ width: 180, marginBottom: 24 }} />
      <h1>Payment Failed</h1>
      <p style={{ margin: "1rem 0 2rem" }}>
        Unfortunately, your payment could not be processed. Please try again or check your order details.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <Button onClick={() => navigate(-1)}>Retry Payment</Button>
        {orderId && <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>View Order Details</Button>}
      </div>
    </div>
  );
};

export default OrderFailure; 