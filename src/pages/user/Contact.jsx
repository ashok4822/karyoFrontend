import React, { useState } from "react";
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
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaComments,
  FaPaperPlane,
} from "react-icons/fa";
import userAxios from "../../lib/userAxios";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await userAxios.post('/contact', formData);
      
      setSuccessMsg(response.data.message || "Thank you for your message! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setServerError(
        error.response?.data?.message || "Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-primary" />,
      title: "Address",
      content: "123 Backpack Street, City, State 12345",
    },
    {
      icon: <FaPhone className="text-primary" />,
      title: "Phone",
      content: "(123) 456-7890",
    },
    {
      icon: <FaEnvelope className="text-primary" />,
      title: "Email",
      content: "info@caryo.com",
    },
    {
      icon: <FaClock className="text-primary" />,
      title: "Business Hours",
      content: "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM",
    },
  ];

  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-5">
        <Col lg={8} className="text-center">
          <h1 className="fw-bold text-primary mb-3">Contact Us</h1>
          <p className="lead text-muted">
            Have questions or need assistance? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Contact Information */}
        <Col lg={4} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <h4 className="fw-bold mb-4">Get in Touch</h4>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div key={index} className="d-flex align-items-start mb-4">
                    <div className="me-3 mt-1 fs-5">{info.icon}</div>
                    <div>
                      <h6 className="fw-semibold mb-1">{info.title}</h6>
                      <p className="text-muted mb-0 small">{info.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-top">
                <h6 className="fw-semibold mb-3">Follow Us</h6>
                <div className="d-flex gap-3">
                  <a href="#" className="text-decoration-none text-muted fs-5">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className="text-decoration-none text-muted fs-5">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="text-decoration-none text-muted fs-5">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" className="text-decoration-none text-muted fs-5">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Contact Form */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h4 className="fw-bold mb-4">Send us a Message</h4>
              
              {serverError && <Alert variant="danger">{serverError}</Alert>}
              {successMsg && <Alert variant="success">{successMsg}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaUser className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FaEnvelope className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          isInvalid={!!errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaComments className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Enter subject"
                      isInvalid={!!errors.subject}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.subject}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Message *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message here..."
                    isInvalid={!!errors.message}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Send Message
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* FAQ Section */}
      <Row className="mt-5">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h4 className="fw-bold mb-4 text-center">Frequently Asked Questions</h4>
              <Row>
                <Col md={6}>
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-2">How can I track my order?</h6>
                    <p className="text-muted small mb-0">
                      You can track your order by logging into your account and visiting the order history section, or by using the tracking number provided in your order confirmation email.
                    </p>
                  </div>
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-2">What is your return policy?</h6>
                    <p className="text-muted small mb-0">
                      We offer a 30-day return policy for all unused items in their original packaging. Please contact our customer service team to initiate a return.
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-2">Do you ship internationally?</h6>
                    <p className="text-muted small mb-0">
                      Currently, we ship to most countries worldwide. Shipping costs and delivery times vary by location. Check our shipping page for more details.
                    </p>
                  </div>
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-2">How can I contact customer support?</h6>
                    <p className="text-muted small mb-0">
                      You can reach our customer support team through this contact form, email us at support@caryo.com, or call us at (123) 456-7890 during business hours.
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact; 