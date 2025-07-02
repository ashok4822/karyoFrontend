import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Container, Navbar, Nav, Button, Row, Col } from "react-bootstrap";
import { FaShoppingCart, FaUser, FaSignOutAlt, FaHeart } from "react-icons/fa";
import {
  logout as logoutAction,
  logoutUser,
} from "../redux/reducers/authSlice";
import api from "../lib/utils";
import userAxios from "../lib/userAxios";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, userAccessToken } = useSelector((state) => state.auth);
  const wishlistCount = useSelector((state) => state.wishlist.items.length);
  const cartCount = useSelector((state) => state.cart.items.length);

  const handleLogout = async () => {
    try {
      await userAxios.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    }
    // Only clear user tokens/state
    localStorage.removeItem("userAccessToken");
    localStorage.removeItem("user");
    // Do NOT clear admin tokens
    dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <Navbar bg="light" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
            CARYO
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
              {user && userAccessToken && (
                <span className="fw-semibold text-primary me-2 d-flex align-items-center gap-2">
                  {user.username || user.email}
                  <img
                    src={user.profileImage || "/profile.png"}
                    alt="Profile"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/profile")}
                  />
                </span>
              )}
              <Link to="/wishlist" className="text-dark position-relative">
                <FaHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="text-dark position-relative me-3">
                <FaShoppingCart size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {cartCount}
                </span>
              </Link>
              {user && userAccessToken ? (
                <Button
                  variant="outline-danger"
                  className="d-flex align-items-center gap-2"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <FaSignOutAlt /> Logout
                </Button>
              ) : (
                <div className="d-flex gap-2">
                  {/* <Button as={Link} to="/login" variant="outline-primary">
                    Login
                  </Button>
                  <Button as={Link} to="/signup" variant="primary">
                    Register
                  </Button> */}
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white pt-5 pb-3 mt-auto">
        <Container>
          <Row className="mb-4">
            <Col md={4} className="mb-4 mb-md-0">
              <h4 className="fw-bold mb-3">CARYO</h4>
              <p className="text-muted small mb-3">
                Your one-stop shop for high-quality backpacks and accessories.
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="text-white-50 fs-5">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-white-50 fs-5">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-white-50 fs-5">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-white-50 fs-5">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </Col>
            <Col md={2} className="mb-4 mb-md-0">
              <h6 className="text-uppercase mb-3">Links</h6>
              <ul className="list-unstyled">
                <li>
                  <Link to="/" className="text-white-50 text-decoration-none">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    className="text-white-50 text-decoration-none"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-white-50 text-decoration-none"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-white-50 text-decoration-none"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </Col>
            <Col md={3} className="mb-4 mb-md-0">
              <h6 className="text-uppercase mb-3">Contact</h6>
              <ul className="list-unstyled text-white-50 small">
                <li className="mb-2">
                  <i className="fas fa-map-marker-alt me-2"></i>123 Backpack
                  Street, City
                </li>
                <li className="mb-2">
                  <i className="fas fa-phone me-2"></i>(123) 456-7890
                </li>
                <li>
                  <i className="fas fa-envelope me-2"></i>info@caryo.com
                </li>
              </ul>
            </Col>
            <Col md={3}>
              <h6 className="text-uppercase mb-3">Newsletter</h6>
              <form className="d-flex flex-column flex-sm-row gap-2">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Your email"
                />
                <Button variant="primary" type="submit">
                  Subscribe
                </Button>
              </form>
            </Col>
          </Row>
          <hr className="border-secondary opacity-50" />
          <div className="text-center text-white-50 small">
            &copy; 2024 CARYO. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Layout;
