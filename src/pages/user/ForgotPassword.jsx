import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { OTP_EXPIRY_SECONDS } from "../../lib/utils";
import { MESSAGES } from "../../constants/messages";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (step !== 2 && timer !== 0) {
      setTimer(0);
    }
  }, [step]);

  const handleRequestOtp = async (e, isResend = false) => {
    if (e) e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setServerError(MESSAGES.VALIDATION.INVALID_EMAIL);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("auth/request-password-reset-otp", { email });
      setSuccessMsg(isResend ? MESSAGES.AUTH.OTP_RESENT : MESSAGES.AUTH.OTP_SENT);
      setStep(2);
      if (res.data && res.data.expiresAt) {
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.round((res.data.expiresAt - now) / 1000) - 3);
        setTimer(secondsLeft);
      } else {
        setTimer(OTP_EXPIRY_SECONDS);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || MESSAGES.AUTH.OTP_SEND_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    if (!otp) {
      setServerError(MESSAGES.VALIDATION.OTP_REQUIRED);
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("auth/verify-password-reset-otp", { email, otp });
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
        setStep(3);
        setSuccessMsg(MESSAGES.AUTH.OTP_VERIFIED);
      } else {
        setServerError(MESSAGES.AUTH.RESET_TOKEN_FETCH_FAILED);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || MESSAGES.AUTH.OTP_VERIFY_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    if (!newPassword || newPassword.length < 8) {
      setServerError(MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH);
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerError(MESSAGES.VALIDATION.PASSWORDS_NO_MATCH);
      return;
    }
    if (!resetToken) {
      setServerError(MESSAGES.AUTH.RESET_TOKEN_MISSING);
      return;
    }
    setLoading(true);
    try {
      await api.post("auth/reset-password", { email, newPassword, resetToken });
      setSuccessMsg(MESSAGES.AUTH.RESET_SUCCESS);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setServerError(error.response?.data?.message || MESSAGES.AUTH.RESET_FAILED);
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
                <h2 className="fw-bold">Forgot Password</h2>
                <p className="text-muted">Reset your password with OTP</p>
              </div>
              {serverError && <Alert variant="danger">{serverError}</Alert>}
              {successMsg && <Alert variant="success">{successMsg}</Alert>}
              {step === 1 && (
                <Form onSubmit={handleRequestOtp}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </Form>
              )}
              {step === 2 && (
                <>
                  <Form onSubmit={handleVerifyOtp}>
                    <Form.Group className="mb-3">
                      <Form.Label>Enter OTP sent to your email</Form.Label>
                      <Form.Control
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        
                        disabled={timer === 0}
                      />
                    </Form.Group>
                    <Button type="submit" variant="success" className="w-100" disabled={loading || timer === 0}>
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <Button
                      variant="link"
                      className="w-100 mt-2"
                      onClick={() => setStep(1)}
                    >
                      Change Email
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
                </>
              )}
              {step === 3 && (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword; 