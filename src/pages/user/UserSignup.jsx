import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
} from "react-icons/fa";
import api, { OTP_EXPIRY_SECONDS } from "../../lib/utils";
import { fetchCart } from "../../redux/reducers/cartSlice";
import { fetchWishlist } from "../../redux/reducers/wishlistSlice";
import { MESSAGES } from "../../constants/messages";

const apiBaseUrl =
  import.meta.env.VITE_USER_BACKEND_URL || "http://localhost:5000";

const UserSignup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [step, setStep] = useState(1); // 1: info, 2: otp
  const [otp, setOtp] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) {
      setFormData((prev) => ({
        ...prev,
        referralCode: ref,
        referralToken: ref,
      }));
    }
  }, [location.search]);

  useEffect(() => {
    // Clear OTP input whenever entering step 2 (OTP verification)
    if (step === 2) {
      setOtp("");
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError("");
  };

  const validateForm = () => {
    if (!formData.username.trim()) return MESSAGES.VALIDATION.USERNAME_REQUIRED;
    if (!formData.email.trim()) return MESSAGES.VALIDATION.EMAIL_REQUIRED;
    if (!/\S+@\S+\.\S+/.test(formData.email)) return MESSAGES.VALIDATION.INVALID_EMAIL_FORMAT;
    if (!formData.password) return MESSAGES.VALIDATION.PASSWORD_FIELD_REQUIRED;
    if (formData.password.length < 8)
      return MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH;
    if (formData.password !== formData.confirmPassword)
      return MESSAGES.VALIDATION.PASSWORDS_NO_MATCH;
    return null;
  };

  const handleRequestOtp = async (e, isResend = false) => {
    if (e) e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    const err = validateForm();
    if (err) return setServerError(err);
    setLoading(true);
    try {
      await api.post("auth/request-otp", {
        email: formData.email,
        username: formData.username,
      });
      setStep(2);
      setSuccessMsg(
        isResend ? MESSAGES.AUTH.OTP_RESENT : MESSAGES.AUTH.OTP_SENT
      );
      setTimer(OTP_EXPIRY_SECONDS);
    } catch (error) {
      setServerError(error.response?.data?.message || MESSAGES.AUTH.OTP_SEND_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setServerError(MESSAGES.VALIDATION.OTP_REQUIRED);
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        otp,
      };
      if (formData.referralToken) {
        payload.referralToken = formData.referralToken;
      } else if (formData.referralCode) {
        payload.referralCode = formData.referralCode;
      }
      const res = await api.post("auth/verify-otp", payload);
      // Do NOT save access token and user in Redux/localStorage after signup
      // Do NOT fetch cart and wishlist after signup
      // Redirect to login page after successful signup
      navigate("/login", {
        replace: true,
        state: { successMsg: MESSAGES.AUTH.SIGNUP_SUCCESS },
      });
    } catch (error) {
      setServerError(
        error.response?.data?.message || MESSAGES.AUTH.OTP_VERIFY_FAILED
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Get the referral token from the URL (if present)
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      window.location.href = `${apiBaseUrl}/auth/google?ref=${ref}`;
    } else {
      window.location.href = `${apiBaseUrl}/auth/google`;
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-3">
        <Col md={8} lg={6} className="text-center">
          <Link to="/" className="btn btn-outline-secondary mb-3">
            Home
          </Link>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <h1 className="h3 mb-3">Create an Account</h1>
                <p className="text-muted">
                  Join our community and start shopping today
                </p>
              </div>
              <Button
                variant="outline-danger"
                className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogleSignIn}
              >
                <FaGoogle /> Sign up with Google
              </Button>
              {serverError && <Alert variant="danger">{serverError}</Alert>}
              {successMsg && <Alert variant="success">{successMsg}</Alert>}
              {step === 1 && (
                <>
                  <Form onSubmit={handleRequestOtp}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="Enter your username"
                        />
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaEnvelope />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                        />
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                        />
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Referral Code (Optional)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="referralCode"
                          value={formData.referralCode}
                          onChange={handleChange}
                          placeholder="Enter referral code (optional)"
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Have a referral code? Enter it here to get rewards for
                        both you and your referrer!
                      </Form.Text>
                    </Form.Group>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? "Sending OTP..." : "Sign Up & Get OTP"}
                    </Button>
                  </Form>
                  <div className="text-center mt-3">
                    <span>Already have an account? </span>
                    <Link to="/login">Sign in</Link>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <Form onSubmit={handleVerifyOtp}>
                    <Form.Group className="mb-3">
                      <Form.Label>Enter OTP sent to your email</Form.Label>
                      <Form.Control
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          setServerError("");
                          setSuccessMsg("");
                        }}
                        placeholder="Enter OTP"
                      />
                    </Form.Group>
                    <Button
                      type="submit"
                      variant="success"
                      className="w-100"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Verify & Create Account"}
                    </Button>
                    <Button
                      variant="link"
                      className="w-100 mt-2"
                      onClick={() => setStep(1)}
                    >
                      Change Email/Password
                    </Button>
                    <div className="text-center mt-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={timer > 0}
                        onClick={(e) => handleRequestOtp(e, true)}
                      >
                        {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                      </Button>
                    </div>
                  </Form>
                  <div className="text-center mt-3">
                    <span>Already have an account? </span>
                    <Link to="/login">Sign in</Link>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserSignup;
