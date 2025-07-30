import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import { useSelector } from "react-redux";

const AdminNotFound = () => {
  const navigate = useNavigate();
  const admin = useSelector((state) => state.auth.admin);

  const handleGoToDashboard = () => {
    if (admin) {
      navigate("/admin");
    } else {
      navigate("/admin/login");
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <FaExclamationTriangle size={64} color="#dc3545" className="mb-3" />
      <h1 className="mb-2">404 - Page Not Found</h1>
      <p className="mb-4 text-muted">The admin page you are looking for does not exist.</p>
      <Button variant="primary" onClick={handleGoToDashboard}>Go to Admin Dashboard</Button>
    </div>
  );
};

export default AdminNotFound;