import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/reducers/authSlice";
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
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import { loginUser } from "../../services/user/authService";
import { fetchCart } from "../../redux/reducers/cartSlice";
import { fetchWishlist } from "../../redux/reducers/wishlistSlice";

const apiBaseUrl =
  import.meta.env.VITE_USER_BACKEND_UR || "http://localhost:5000";

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for error messages from URL params or navigation state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get("error");

    if (errorParam === "rate_limit") {
      setServerError(
        "Too many authentication attempts. Please wait a while before trying again."
      );
    } else if (location.state?.message) {
      setServerError(location.state.message);
    }
    // Show success message from navigation state (e.g., after signup)
    if (location.state?.successMsg) {
      setSuccessMsg(location.state.successMsg);
      // Clear the message from history so it doesn't show again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

    // Basic validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setServerError("Please enter a valid email");
      return;
    }

    if (!password) {
      setServerError("Please enter your password");
      return;
    }

    setLoading(true);

    const result = await loginUser(email, password);

    if (result.success) {
      dispatch(
        loginSuccess({
          user: result.data.user,
          userAccessToken: result.data.token,
        })
      );
      // Fetch cart and wishlist after login
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      setSuccessMsg("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } else {
      // Remove any stale user data on login failure
      localStorage.removeItem("user");
      localStorage.removeItem("userAccessToken");
      setServerError(result.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-3">
        <Col md={8} lg={6} xl={5} className="text-center">
          <Link to="/" className="btn btn-outline-secondary mb-3">
            Home
          </Link>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold">Sign In</h2>
                <p className="text-muted">Login with your email and password</p>
              </div>
              <Button
                variant="outline-danger"
                className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={() =>
                  (window.location.href = `${apiBaseUrl}/auth/google`)
                }
              >
                <FaGoogle /> Sign in with Google
              </Button>
              {serverError && <Alert variant="danger">{serverError}</Alert>}
              {successMsg && <Alert variant="success">{successMsg}</Alert>}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaEnvelope className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </InputGroup>
                </Form.Group>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Link to="/forgot-password" className="small">
                    Forgot Password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Sign In"}
                </Button>
              </Form>
              <div className="text-center mt-4">
                <p className="mb-0">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-decoration-none">
                    Sign up
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserLogin;
