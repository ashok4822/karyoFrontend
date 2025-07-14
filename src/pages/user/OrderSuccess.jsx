import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <img src="/success-illustration.svg" alt="Order Success" style={{ width: 180, marginBottom: 24 }} />
      <h1>Thank you for your purchase!</h1>
      <p style={{ margin: "1rem 0 2rem" }}>
        Your order was placed successfully. You will receive a confirmation email soon.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <Button onClick={() => navigate(`/orders/${orderId}`)}>View Order Details</Button>
        <Button variant="outline" onClick={() => navigate("/")}>Continue Shopping</Button>
      </div>
    </div>
  );
};

export default OrderSuccess; 