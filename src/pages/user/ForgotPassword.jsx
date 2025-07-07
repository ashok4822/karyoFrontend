import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { OTP_EXPIRY_SECONDS } from "../../lib/utils";
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
      setServerError("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("auth/request-password-reset-otp", { email });
      setSuccessMsg(
        isResend ? "OTP resent to your email." : "OTP sent to your email."
      );
      setStep(2);
      if (res.data && res.data.expiresAt) {
        const now = Date.now();
        const secondsLeft = Math.max(
          0,
          Math.round((res.data.expiresAt - now) / 1000)
        );
        setTimer(secondsLeft);
      } else {
        setTimer(OTP_EXPIRY_SECONDS);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    if (!otp) {
      setServerError("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("auth/verify-password-reset-otp", {
        email,
        otp,
      });
      setSuccessMsg("OTP verified. Please enter your new password.");
      setStep(3);
      setTimer(0);
      if (res.data && res.data.resetToken) {
        setResetToken(res.data.resetToken);
      } else {
        setServerError("Failed to get reset token. Please try again.");
      }
    } catch (error) {
      setServerError(
        error.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");
    if (!newPassword || newPassword.length < 8) {
      setServerError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerError("Passwords do not match");
      return;
    }
    if (!resetToken) {
      setServerError("Reset token missing. Please verify OTP again.");
      return;
    }
    setLoading(true);
    try {
      await api.post("auth/reset-password", { email, newPassword, resetToken });
      setSuccessMsg("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setServerError(error.response?.data?.message || "Password reset failed");
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
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={loading}
                  >
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
                    <Button
                      type="submit"
                      variant="success"
                      className="w-100"
                      disabled={loading || timer === 0}
                    >
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
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={loading}
                  >
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
