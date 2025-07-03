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
import userAxios from "../lib/userAxios";

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
      await userAxios.post("auth/logout");
      dispatch(logoutAction());
      navigate("/");
    } catch (error) {
      // Optionally show error
    }
  };

  return (
    <div>
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
                src="/herobg2.png"
                alt="Laptop Backpack PNGTree"
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
          {(() => {
            const featured = products?.slice(0, 4) || [];
            const placeholders = [
              {
                id: "placeholder-1",
                name: "Classic Backpack",
                description: "A timeless design for everyday use.",
                image:
                  "https://assets.myntassets.com/w_412,q_60,dpr_2,fl_progressive/assets/images/25008014/2023/10/31/44ffa8e6-8486-4b3a-b8a0-429e17dd040b1698729990869-Skybags-Unisex-Nexus-Laptop-Backpack-with-USB-Charging-Port--1.jpg",
                price: "49.99",
              },
              {
                id: "placeholder-2",
                name: "Urban Explorer",
                description: "Perfect for city adventures.",
                image:
                  "https://assets.ajio.com/medias/sys_master/root/20240318/YcAB/65f7fba905ac7d77bbc04d9f/-473Wx593H-4933997520-multi-MODEL.jpg?w=500",
                price: "59.99",
              },
              {
                id: "placeholder-3",
                name: "Travel Pro",
                description: "Spacious and durable for travel.",
                image:
                  "https://rukminim2.flixcart.com/image/750/900/xif0q/backpack/o/5/x/-original-imagrdzau2u87b9e.jpeg?q=90&crop=false?w=500",
                price: "79.99",
              },
              {
                id: "placeholder-4",
                name: "Campus Pack",
                description: "Ideal for students and professionals.",
                image:
                  "https://images-cdn.ubuy.co.in/64af8f8d0d0024473d1062d4-vecave-school-backpack-black-waterproof.jpg?w=500",
                price: "39.99",
              },
            ];
            
            return Array.from({ length: 4 }, (_, i) => {
              if (featured[i]) {
                const product = featured[i];
                return (
                  <Col key={`product-${product.id || i}`}>
                    <Card className="h-100 shadow-sm hover-shadow">
                      <Card.Img
                        variant="top"
                        src={
                          product.variants?.[0]?.mainImage ||
                          placeholders[i].image
                        }
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
                            $
                            {product.variants?.[0]?.price ||
                              placeholders[i].price}
                          </span>
                          <Button variant="outline-primary" size="sm">
                            Add to Cart
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              } else {
                const ph = placeholders[i];
                return (
                  <Col key={`placeholder-${ph.id || i}`}>
                    <Card className="h-100 shadow-sm hover-shadow">
                      <Card.Img
                        variant="top"
                        src={ph.image}
                        alt={ph.name}
                        className="object-fit-cover"
                        style={{ height: "200px" }}
                      />
                      <Card.Body>
                        <Card.Title className="h6">{ph.name}</Card.Title>
                        <Card.Text className="text-muted small">
                          {ph.description}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 mb-0">${ph.price}</span>
                          <Button variant="outline-primary" size="sm" disabled>
                            Add to Cart
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              }
            });
          })()}
        </Row>
      </Container>

      {/* View Our Range Of Products Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">View Our Range Of Products</h2>
        <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
          {[1, 2, 3, 4].map((i) => (
            <Col key={i} className="d-flex justify-content-center">
              <Card
                className="h-100 shadow-sm"
                style={{ width: "100%", maxWidth: 250 }}
              >
                <Card.Img
                  variant="top"
                  src={`https://media.herschel.nz/cdn-cgi/image/fit=scale-down,f=auto,w=1600/products/3c9094fd-cf63-4a8e-9306-adb0485969f6/11405_00055_1.jpg?w=500`}
                  alt={`Bag ${i}`}
                  className="object-fit-cover"
                  style={{ height: "200px" }}
                />
                <Card.Body className="text-center">
                  <Card.Title>Bag Model {i}</Card.Title>
                  <Card.Text className="text-muted small">
                    Category {i}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* New Launches Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">New Launches</h2>
        <Row xs={2} sm={2} md={4} lg={4} className="g-4 justify-content-center">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col key={i} className="d-flex justify-content-center">
              <Card
                className="h-100 shadow-sm"
                style={{ width: "100%", maxWidth: 220 }}
              >
                <Card.Img
                  variant="top"
                  src={`https://genietravel.com/cdn/shop/files/45DegreeAngle2_3731809d-b075-4bb8-a531-e8447b894615_1200x.jpg?v=1737027793?w=500`}
                  alt={`New Launch Bag ${i}`}
                  className="object-fit-cover"
                  style={{ height: "180px" }}
                />
                <Card.Body className="text-center">
                  <Card.Title>New Bag {i}</Card.Title>
                  <Card.Text className="text-muted small">
                    Just Launched
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Hand Picked Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Hand Picked</h2>
        <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
          {[1, 2, 3, 4].map((i) => (
            <Col key={i} className="d-flex justify-content-center">
              <Card
                className="h-100 shadow-sm"
                style={{ width: "100%", maxWidth: 250 }}
              >
                <Card.Img
                  variant="top"
                  src={`https://bagsinbulk.com/cdn/shop/files/2950_blue_1350x1350.jpg?v=1746648008?w=500`}
                  alt={`Hand Picked Bag ${i}`}
                  className="object-fit-cover"
                  style={{ height: "200px" }}
                />
                <Card.Body className="text-center">
                  <Card.Title>Hand Picked {i}</Card.Title>
                  <Card.Text className="text-muted small">
                    Editor's Choice
                  </Card.Text>
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
    </div>
  );
};

export default Index;
