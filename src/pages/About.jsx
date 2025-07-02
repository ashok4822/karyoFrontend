import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";

const About = () => (
  <Container className="py-5">
    <Row className="justify-content-center">
      <Col md={8} lg={6}>
        <Card className="shadow-lg border-0 rounded-4 p-4">
          <Card.Body>
            <h1 className="fw-bold mb-3 text-primary">About CARYO</h1>
            <p className="lead mb-4">
              Welcome to <strong>CARYO</strong>! We are your one-stop shop for high-quality backpacks and accessories, dedicated to providing you with the best products and customer experience.
            </p>
            <p>
              Our mission is to deliver stylish, durable, and functional products that fit your lifestyle. Whether you're a student, a professional, or an adventurer, CARYO has something for everyone.
            </p>
            <p>
              <strong>Contact us:</strong> info@caryo.com
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
);

export default About; 