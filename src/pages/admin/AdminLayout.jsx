import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Navbar,
  Nav,
  Offcanvas,
  Button,
  Dropdown,
  Badge,
} from 'react-bootstrap';
import {
  FaBars,
  FaTimes,
  FaHome,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaTags,
  FaCog,
  FaBell,
  FaEnvelope,
  FaUser,
  FaSignOutAlt,
  FaChartLine,
} from 'react-icons/fa';

const AdminLayout = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', icon: <FaHome />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FaBox />, label: 'Products' },
    { path: '/admin/orders', icon: <FaShoppingCart />, label: 'Orders' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Customers' },
    { path: '/admin/categories', icon: <FaTags />, label: 'Categories' },
    { path: '/admin/offers', icon: <FaTags />, label: 'Offers' },
    { path: '/admin/coupons', icon: <FaTags />, label: 'Coupons' },
    { path: '/admin/referrals', icon: <FaUsers />, label: 'Referrals' },
    { path: '/admin/settings', icon: <FaCog />, label: 'Settings' },
  ];

  const handleLogout = async () => {
    try {
      // Call admin logout endpoint if available
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Admin logout error", err);
    }
    // Only clear admin tokens/state
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("admin");
    // Do NOT clear user tokens
    // If you use redux for admin, dispatch admin logout here
    navigate('/admin/login');
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Top Navbar */}
      <Navbar
        bg="white"
        className="border-bottom shadow-sm py-2"
        expand="lg"
        fixed="top"
      >
        <Container fluid>
          <Button
            variant="link"
            className="text-dark p-0 me-3 d-lg-none"
            onClick={() => setShowSidebar(true)}
          >
            <FaBars size={20} />
          </Button>

          <Navbar.Brand as={Link} to="/admin" className="fw-bold">
            Pack Palace Admin
          </Navbar.Brand>

          <div className="d-flex align-items-center ms-auto">
            <Nav className="me-3">
              <Nav.Link className="position-relative">
                <FaBell />
                <Badge
                  bg="danger"
                  className="position-absolute top-0 start-100 translate-middle rounded-circle"
                  style={{ fontSize: '0.5rem' }}
                >
                  3
                </Badge>
              </Nav.Link>
              <Nav.Link className="position-relative">
                <FaEnvelope />
                <Badge
                  bg="danger"
                  className="position-absolute top-0 start-100 translate-middle rounded-circle"
                  style={{ fontSize: '0.5rem' }}
                >
                  5
                </Badge>
              </Nav.Link>
            </Nav>

            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                className="text-dark text-decoration-none d-flex align-items-center"
              >
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                  style={{ width: '32px', height: '32px' }}
                >
                  <FaUser />
                </div>
                <span className="d-none d-md-inline">Admin User</span>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/admin/profile">
                  <FaUser className="me-2" /> Profile
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/admin/settings">
                  <FaCog className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      {/* Sidebar */}
      <div className="d-flex">
        {/* Desktop Sidebar */}
        <div
          className="d-none d-lg-flex flex-column flex-shrink-0 bg-white border-end"
          style={{ width: '280px', height: '100vh', position: 'fixed', top: '56px' }}
        >
          <div className="p-3">
            <div className="d-flex align-items-center mb-4">
              <FaChartLine className="text-primary me-2" size={24} />
              <span className="h5 mb-0">Admin Panel</span>
            </div>

            <Nav className="flex-column">
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  className={`d-flex align-items-center py-2 ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  {item.icon}
                  <span className="ms-2">{item.label}</span>
                </Nav.Link>
              ))}
            </Nav>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          className="d-lg-none"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Admin Panel</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column">
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  className={`d-flex align-items-center py-2 ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                  onClick={() => setShowSidebar(false)}
                >
                  {item.icon}
                  <span className="ms-2">{item.label}</span>
                </Nav.Link>
              ))}
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <div
          className="flex-grow-1"
          style={{ marginLeft: '280px', marginTop: '56px', padding: '20px' }}
        >
          <Container fluid>
            <Outlet />
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 