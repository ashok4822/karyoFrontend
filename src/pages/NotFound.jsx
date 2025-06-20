import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaHome, FaSearch, FaArrowLeft } from 'react-icons/fa';

const NotFound = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center text-center">
        <Col md={8} lg={6}>
          <div className="mb-4">
            <h1 className="display-1 fw-bold text-primary">404</h1>
            <h2 className="h3 mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              Oops! The page you're looking for doesn't exist or has been moved.
              Let's get you back on track.
            </p>
          </div>

          <div className="d-flex justify-content-center gap-3 mb-5">
            <Button
              variant="primary"
              as={Link}
              to="/"
              className="d-flex align-items-center gap-2"
            >
              <FaHome />
              Go Home
            </Button>
            <Button
              variant="outline-primary"
              as={Link}
              to="/products"
              className="d-flex align-items-center gap-2"
            >
              <FaSearch />
              Browse Products
            </Button>
            <Button
              variant="link"
              onClick={() => window.history.back()}
              className="d-flex align-items-center gap-2"
            >
              <FaArrowLeft />
              Go Back
            </Button>
          </div>

          <div className="bg-light rounded p-4">
            <h3 className="h5 mb-3">Need Help?</h3>
            <p className="text-muted mb-0">
              If you believe this is an error, please{' '}
              <Link to="/contact" className="text-primary">
                contact our support team
              </Link>
              .
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
