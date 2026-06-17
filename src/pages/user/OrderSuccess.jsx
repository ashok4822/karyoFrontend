import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button } from "../../components/ui/button";
import { clearCart, clearCartState } from "../../redux/reducers/cartSlice";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orderId } = useParams();

  // Clear the cart when landing on success page
  useEffect(() => {
    dispatch(clearCart());
    dispatch(clearCartState());
  }, [dispatch]);

  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <img src="/success-illustration.svg" alt="Order Success" style={{ width: 180, marginBottom: 24 }} />
      <h1>Thank you for your purchase!</h1>
      <p style={{ margin: "1rem 0 2rem" }}>
        Your order was placed successfully. You will receive a confirmation email soon.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <Button onClick={() => navigate(`/order-confirmation/${orderId}`)}>View Order Details</Button>
        <Button variant="outline" onClick={() => navigate("/")}>Continue Shopping</Button>
      </div>
    </div>
  );
};

export default OrderSuccess;