import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loadUser, logout as logoutAction } from "../redux/reducers/authSlice";
import api from "../lib/utils";
import {
  Container,
  Navbar,
  Nav,
  Button,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { FaShoppingCart, FaUser, FaSearch, FaSignOutAlt } from "react-icons/fa";

const Index = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { products } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await api.post("auth/logout");
      dispatch(logoutAction());
      navigate("/");
    } catch (error) {
      // Optionally show error
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navigation Bar */}
      <Navbar bg="light" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
            Pack Palace
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/products">
                Products
              </Nav.Link>
              <Nav.Link as={Link} to="/about">
                About
              </Nav.Link>
              <Nav.Link as={Link} to="/contact">
                Contact
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search products..."
                />
                <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" />
              </div>
              <Link to="/cart" className="text-dark position-relative">
                <FaShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  0
                </span>
              </Link>
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outline-danger"
                    className="d-flex align-items-center gap-2"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <FaSignOutAlt /> Logout
                  </Button>
                </>
              ) : (
                <div className="d-flex gap-2">
                  <Button as={Link} to="/login" variant="outline-primary">
                    Login
                  </Button>
                  <Button as={Link} to="/register" variant="primary">
                    Register
                  </Button>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Discover Your Perfect Backpack
              </h1>
              <p className="lead mb-4">
                Explore our collection of high-quality backpacks designed for
                every adventure. From urban commuters to outdoor enthusiasts,
                we've got you covered.
              </p>
              <Button
                as={Link}
                to="/products"
                variant="light"
                size="lg"
                className="fw-bold"
              >
                Shop Now
              </Button>
            </Col>
            <Col lg={6} className="d-none d-lg-block">
              <img
                src="/hero-image.jpg"
                alt="Featured Backpack"
                className="img-fluid rounded-3 shadow"
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Featured Products Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Featured Products</h2>
        <Row xs={1} md={2} lg={4} className="g-4">
          {products?.slice(0, 4).map((product) => (
            <Col key={product.id}>
              <Card className="h-100 shadow-sm hover-shadow">
                <Card.Img
                  variant="top"
                  src={product.variants[0].mainImage}
                  alt={product.name}
                  className="object-fit-cover"
                  style={{ height: "200px" }}
                />
                <Card.Body>
                  <Card.Title className="h6">{product.name}</Card.Title>
                  <Card.Text className="text-muted small">
                    {product.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h5 mb-0">
                      ${product.variants[0].price}
                    </span>
                    <Button variant="outline-primary" size="sm">
                      Add to Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Features Section */}
      <div className="bg-light py-5">
        <Container>
          <Row className="g-4">
            <Col md={4}>
              <div className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <FaShoppingCart size={24} className="text-primary" />
                </div>
                <h3 className="h5">Free Shipping</h3>
                <p className="text-muted mb-0">
                  Free shipping on all orders over $50
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <FaUser size={24} className="text-primary" />
                </div>
                <h3 className="h5">24/7 Support</h3>
                <p className="text-muted mb-0">
                  Our support team is always here to help
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <FaSearch size={24} className="text-primary" />
                </div>
                <h3 className="h5">Easy Returns</h3>
                <p className="text-muted mb-0">30-day money back guarantee</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <Container>
          <Row>
            <Col md={4}>
              <h5 className="mb-3">Pack Palace</h5>
              <p className="text-muted">
                Your one-stop shop for high-quality backpacks and accessories.
              </p>
            </Col>
            <Col md={2}>
              <h5 className="mb-3">Quick Links</h5>
              <ul className="list-unstyled">
                <li>
                  <Link to="/" className="text-muted text-decoration-none">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    className="text-muted text-decoration-none"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-muted text-decoration-none">
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-muted text-decoration-none"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </Col>
            <Col md={3}>
              <h5 className="mb-3">Contact Us</h5>
              <ul className="list-unstyled text-muted">
                <li>123 Backpack Street</li>
                <li>City, State 12345</li>
                <li>Phone: (123) 456-7890</li>
                <li>Email: info@packpalace.com</li>
              </ul>
            </Col>
            <Col md={3}>
              <h5 className="mb-3">Newsletter</h5>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                />
                <Button variant="primary">Subscribe</Button>
              </div>
            </Col>
          </Row>
          <hr className="my-4" />
          <div className="text-center text-muted">
            <small>&copy; 2024 Pack Palace. All rights reserved.</small>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Index;
