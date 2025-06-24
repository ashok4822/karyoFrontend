import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/reducers/authSlice";
import userAxios from "../../lib/userAxios";
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

const UserLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setServerError("Please enter a valid email");
      return;
    }
    if (!password) {
      setServerError("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const res = await userAxios.post("auth/login", { email, password });
      dispatch(
        loginSuccess({ user: res.data.user, userAccessToken: res.data.token })
      );
      setSuccessMsg("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      setServerError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
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
                  (window.location.href = "http://localhost:5000/auth/google")
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
