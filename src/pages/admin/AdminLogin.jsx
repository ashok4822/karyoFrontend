import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/utils";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  InputGroup,
} from "react-bootstrap";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use axios instance for API call
      const { data } = await api.post("/admin/login", formData);
      localStorage.setItem("adminToken", data.token);
      // Optionally, store admin user info if needed
      // localStorage.setItem("adminUser", JSON.stringify(data.user));
      navigate("/admin");
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <div className="text-center mb-4">
              <h1 className="h2">Pack Palace Admin</h1>
              <p className="text-muted">Sign in to access the admin panel</p>
            </div>

            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 p-md-5">
                {error && (
                  <Alert variant="danger" className="mb-4">
                    <FaExclamationTriangle className="me-2" />
                    {error}
                  </Alert>
                )}

                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <InputGroup hasValidation>
                      <InputGroup.Text>
                        <FaUser className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter a valid email address.
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <InputGroup hasValidation>
                      <InputGroup.Text>
                        <FaLock className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        Please enter your password.
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      id="remember"
                      label="Remember me"
                    />
                    <Button
                      variant="link"
                      className="text-decoration-none p-0"
                      onClick={() => navigate("/admin/forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="me-2" /> Sign In
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <p className="text-muted mb-0">
                Having trouble?{" "}
                <Button
                  variant="link"
                  className="text-decoration-none p-0"
                  onClick={() => navigate("/admin/contact-support")}
                >
                  Contact Support
                </Button>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
