import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, InputGroup, Form, Badge, Spinner, Table, Alert } from "react-bootstrap";
import { FaGift, FaUsers, FaTrophy, FaCopy, FaShareAlt, FaLink, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import userAxios from "../../lib/userAxios";
import { format } from "date-fns";

const ReferralProgram = () => {
  const [referralData, setReferralData] = useState({
    referralCode: null,
    referralCount: 0,
    totalReferralRewards: 0,
  });
  const [referralHistory, setReferralHistory] = useState([]);
  const [referralStats, setReferralStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReferralData();
    fetchReferralHistory();
    fetchReferralStats();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await userAxios.get("/api/user/referral/code");
      setReferralData(response.data.data);
    } catch (error) {
      setError("Error fetching referral data");
    }
  };

  const fetchReferralHistory = async () => {
    try {
      const response = await userAxios.get("/api/user/referral/history");
      setReferralHistory(response.data.data);
    } catch (error) {
      setError("Error fetching referral history");
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await userAxios.get("/api/user/referral/stats");
      setReferralStats(response.data.data);
    } catch (error) {
      setError("Error fetching referral stats");
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await userAxios.post("/api/user/referral/generate-code");
      setReferralData(prev => ({
        ...prev,
        referralCode: response.data.data.referralCode,
      }));
      setCopyMsg("Referral code generated!");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to generate referral code");
    }
  };

  const generateReferralLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await userAxios.post("/api/user/referral/generate-link");
      setReferralLink(response.data.data.referralLink);
      setCopyMsg("Referral link generated!");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (error) {
      setError("Failed to generate referral link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (error) {
      setError("Failed to copy to clipboard");
    }
  };

  const shareReferral = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on CARYO!",
          text: `Use my referral code: ${text}`,
          url: text.includes("http") ? text : window.location.origin,
        });
      } catch (error) {
        // fallback to copy
        copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "completed") return <Badge bg="success"><FaCheckCircle className="me-1" />Completed</Badge>;
    if (status === "pending") return <Badge bg="secondary"><FaClock className="me-1" />Pending</Badge>;
    if (status === "expired") return <Badge bg="danger"><FaTimesCircle className="me-1" />Expired</Badge>;
    return <Badge bg="light">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: 900 }}>
      {/* Hero Section */}
      <div className="text-center mb-5">
        <FaGift size={48} className="text-primary mb-3" />
        <h1 className="fw-bold mb-2">Referral Program</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: 600 }}>
          Invite friends and earn rewards! Share your referral code and get exclusive discounts.
        </p>
      </div>

      {/* Stats Row */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="shadow-sm text-center border-0">
            <Card.Body>
              <FaUsers size={32} className="mb-2 text-primary" />
              <div className="fw-bold" style={{ fontSize: 28 }}>{referralData.referralCount}</div>
              <div className="text-muted">Total Referrals</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm text-center border-0">
            <Card.Body>
              <FaTrophy size={32} className="mb-2 text-success" />
              <div className="fw-bold" style={{ fontSize: 28 }}>{referralData.totalReferralRewards}</div>
              <div className="text-muted">Total Rewards</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm text-center border-0">
            <Card.Body>
              <FaCheckCircle size={32} className="mb-2 text-info" />
              <div className="fw-bold" style={{ fontSize: 28 }}>
                {referralStats.statusBreakdown?.completed || 0}/{referralData.referralCount || 0}
              </div>
              <div className="text-muted">Success Rate</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Referral Code & Link */}
      <Row className="mb-5 g-3">
        <Col md={6}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <FaGift className="text-primary me-2" />
                <span className="fw-bold">Your Referral Code</span>
              </div>
              {referralData.referralCode ? (
                <div className="d-flex align-items-center mb-2">
                  <Form.Control
                    value={referralData.referralCode}
                    readOnly
                    className="fw-bold text-primary text-center me-2"
                    style={{ maxWidth: 180, fontFamily: 'monospace', fontSize: 20 }}
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => copyToClipboard(referralData.referralCode)}
                    title="Copy referral code"
                  >
                    <FaCopy />
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => shareReferral(referralData.referralCode)}
                    title="Share referral code"
                  >
                    <FaShareAlt />
                  </Button>
                </div>
              ) : (
                <Button onClick={generateReferralCode} variant="primary">
                  Generate Referral Code
                </Button>
              )}
              {copyMsg && <div className="text-success mt-2 small">{copyMsg}</div>}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center mb-2">
                <FaLink className="text-primary me-2" />
                <span className="fw-bold">Referral Link</span>
              </div>
              <InputGroup>
                <Form.Control
                  value={referralLink || "Generate a referral link to share"}
                  readOnly
                  className="text-center"
                />
                <Button
                  variant="outline-primary"
                  onClick={generateReferralLink}
                  disabled={generatingLink}
                >
                  {generatingLink ? <Spinner size="sm" /> : "Generate Link"}
                </Button>
                {referralLink && (
                  <>
                    <Button
                      variant="outline-secondary"
                      onClick={() => copyToClipboard(referralLink)}
                      title="Copy referral link"
                    >
                      <FaCopy />
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => shareReferral(referralLink)}
                      title="Share referral link"
                    >
                      <FaShareAlt />
                    </Button>
                  </>
                )}
              </InputGroup>
              {copyMsg && <div className="text-success mt-2 small">{copyMsg}</div>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* How It Works */}
      <h4 className="fw-bold mb-3 text-center">How It Works</h4>
      <Row className="mb-5 g-3 justify-content-center">
        <Col md={4}>
          <Card className="shadow-sm border-0 text-center h-100">
            <Card.Body>
              <div className="mb-3">
                <FaShareAlt size={32} className="text-primary" />
              </div>
              <div className="fw-bold mb-1">Share Your Code</div>
              <div className="text-muted small">Share your referral code or link with friends and family.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 text-center h-100">
            <Card.Body>
              <div className="mb-3">
                <FaUsers size={32} className="text-success" />
              </div>
              <div className="fw-bold mb-1">They Register</div>
              <div className="text-muted small">When they register using your code, the referral is tracked.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 text-center h-100">
            <Card.Body>
              <div className="mb-3">
                <FaTrophy size={32} className="text-warning" />
              </div>
              <div className="fw-bold mb-1">Earn Rewards</div>
              <div className="text-muted small">You both receive exclusive discount coupons as rewards.</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Referral History */}
      <h4 className="fw-bold mb-3 text-center">Referral History</h4>
      <Card className="shadow-sm border-0 mb-5">
        <Card.Body>
          {referralHistory.length === 0 ? (
            <div className="text-center text-muted py-4">
              No referral history yet. Start sharing your referral code!
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table responsive hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Reward Coupon</th>
                  </tr>
                </thead>
                <tbody>
                  {referralHistory.map((referral) => {
                    const firstName = referral.referred?.firstName;
                    const lastName = referral.referred?.lastName;
                    const username = referral.referred?.username;
                    const email = referral.referred?.email;
                    let displayName = "";
                    if (firstName || lastName) {
                      displayName = `${firstName || ""} ${lastName || ""}`.trim();
                    } else if (username) {
                      displayName = username;
                    } else if (email) {
                      displayName = email;
                    } else {
                      displayName = "-";
                    }
                    return (
                      <tr key={referral._id}>
                        <td>{displayName}</td>
                        <td>{email || "-"}</td>
                        <td>{getStatusBadge(referral.status)}</td>
                        <td>{format(new Date(referral.createdAt), "dd/MM/yyyy HH:mm:ss")}</td>
                        <td>{format(new Date(referral.expiresAt), "dd/MM/yyyy HH:mm:ss")}</td>
                        <td>
                          {referral.rewardCoupon ? (
                            <Badge bg="success">
                              {referral.rewardCoupon.code} ({referral.rewardCoupon.discountValue}
                              {referral.rewardCoupon.discountType === "percentage" ? "%" : "₹"})
                            </Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      {error && <Alert variant="danger">{error}</Alert>}
    </Container>
  );
};

export default ReferralProgram; 