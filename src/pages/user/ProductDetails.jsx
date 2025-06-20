import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Form,
  InputGroup,
  Breadcrumb,
  Table,
  Modal,
  Image as RBImage,
} from 'react-bootstrap';
import {
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaTruck,
  FaUndo,
  FaShieldAlt,
  FaExclamationTriangle,
  FaMinus,
  FaPlus,
  FaArrowLeft,
  FaTag,
} from 'react-icons/fa';
import { fetchProductsFromBackend } from '../../redux/reducers/productSlice';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    dispatch(fetchProductsFromBackend());
  }, [dispatch]);

  const product = products.find((p) => p._id === id);

  // Redirect if blocked or unavailable
  useEffect(() => {
    if (product && (product.blocked || product.unavailable)) {
      navigate('/products');
    }
  }, [product, navigate]);

  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    if (newQuantity >= 1 && (!product || product.stock === undefined || newQuantity <= product.stock)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.blocked || product.unavailable) {
      navigate('/products');
      return;
    }
    if (product.stock === 0) return;
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        productId: product.id,
        quantity,
      },
    });
  };

  const handleAddToWishlist = () => {
    if (!product || product.blocked || product.unavailable) {
      navigate('/products');
      return;
    }
    dispatch({
      type: 'ADD_TO_WISHLIST',
      payload: product.id,
    });
  };

  const handleApplyCoupon = () => {
    if (!couponInput) return;
    const found = product.coupons?.find(c => c.code.toLowerCase() === couponInput.toLowerCase());
    if (found) {
      setActiveCoupon(found);
      setCouponError('');
    } else {
      setActiveCoupon(null);
      setCouponError('Invalid coupon code');
    }
  };

  // Related products (same category, not self, max 4)
  const relatedProducts = products.filter(
    (p) => p.category === product?.category && p.id !== product?.id && !p.blocked && !p.unavailable
  ).slice(0, 4);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          Product not found
        </Alert>
        <Button variant="link" onClick={() => navigate('/products')}>
          <FaArrowLeft className="me-2" />
          Back to Products
        </Button>
      </Container>
    );
  }

  // Price after coupon
  let finalPrice = product.price;
  if (activeCoupon && activeCoupon.discount > 0) {
    finalPrice = Math.round(product.price * (1 - activeCoupon.discount / 100));
  }

  return (
    <Container className="py-4">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item onClick={() => navigate('/')} linkAs="button">Home</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/products')} linkAs="button">Products</Breadcrumb.Item>
        <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Button variant="link" className="mb-3 p-0" onClick={() => navigate('/products')}>
        <FaArrowLeft className="me-2" />
        Back to Products
      </Button>

      <Row>
        {/* Images with zoom and thumbnails */}
        <Col md={6} className="mb-4">
          <Row>
            <Col xs={2} className="d-flex flex-column align-items-center gap-2">
              {product.images?.map((img, idx) => (
                <RBImage
                  key={idx}
                  src={img}
                  alt={`thumb-${idx}`}
                  thumbnail
                  style={{ cursor: 'pointer', border: selectedImage === idx ? '2px solid #0d6efd' : 'none', width: 60, height: 60, objectFit: 'cover' }}
                  onClick={() => setSelectedImage(idx)}
                />
              ))}
            </Col>
            <Col xs={10}>
              <div style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setShowZoom(true)}>
                <RBImage
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.name}
                  fluid
                  style={{ height: 400, objectFit: 'cover', borderRadius: 8 }}
                />
                {product.isNew && (
                  <Badge bg="primary" className="position-absolute top-0 start-0 m-3">New</Badge>
                )}
                {product.stock === 0 && (
                  <Badge bg="danger" className="position-absolute top-0 end-0 m-3">Sold Out</Badge>
                )}
              </div>
              <Modal show={showZoom} onHide={() => setShowZoom(false)} centered size="lg">
                <Modal.Body className="p-0">
                  <RBImage
                    src={product.images?.[selectedImage] || product.image}
                    alt={product.name}
                    fluid
                    style={{ width: '100%', objectFit: 'contain', background: '#222' }}
                  />
                </Modal.Body>
              </Modal>
            </Col>
          </Row>
        </Col>

        {/* Product Info */}
        <Col md={6}>
          <h1 className="h2 mb-2">{product.name}</h1>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="d-flex align-items-center">
              {[...Array(5)].map((_, index) => (
                <FaStar
                  key={index}
                  className={index < Math.floor(product.rating) ? 'text-warning' : 'text-muted'}
                />
              ))}
              <span className="ms-2">({product.reviews} reviews)</span>
            </div>
            <Button variant="link" className="p-0" onClick={handleAddToWishlist}>
              <FaHeart className="text-danger" />
            </Button>
          </div>
          <p className="text-muted mb-2">{product.description}</p>

          {/* Price, discount, coupon */}
          <div className="mb-3">
            <h3 className="h4 mb-2">Price</h3>
            <div className="d-flex align-items-center gap-2">
              <span className="h3 mb-0 text-primary">${finalPrice}</span>
              {product.comparePrice && (
                <span className="text-muted text-decoration-line-through">${product.comparePrice}</span>
              )}
              {product.discount > 0 && (
                <Badge bg="danger">-{product.discount}% OFF</Badge>
              )}
              {activeCoupon && (
                <Badge bg="success"><FaTag className="me-1" />{activeCoupon.code} Applied</Badge>
              )}
            </div>
            <div className="mt-2">
              <Form className="d-flex gap-2" onSubmit={e => { e.preventDefault(); handleApplyCoupon(); }}>
                <Form.Control
                  size="sm"
                  placeholder="Apply coupon code"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  style={{ maxWidth: 160 }}
                  disabled={!!activeCoupon}
                />
                <Button size="sm" variant="outline-primary" type="submit" disabled={!!activeCoupon}>
                  Apply
                </Button>
                {activeCoupon && (
                  <Button size="sm" variant="outline-danger" onClick={() => { setActiveCoupon(null); setCouponInput(''); }}>
                    Remove
                  </Button>
                )}
              </Form>
              {couponError && <div className="text-danger small mt-1">{couponError}</div>}
              {product.coupons && product.coupons.length > 0 && !activeCoupon && (
                <div className="text-muted small mt-1">
                  Available coupons: {product.coupons.map(c => <span key={c.code}><Badge bg="info" className="me-1">{c.code}</Badge></span>)}
                </div>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="mb-3">
            <span className={product.stock === 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
              {product.stock === 0 ? 'Sold Out' : `In Stock: ${product.stock}`}
            </span>
          </div>

          {/* Specs / Highlights */}
          {product.specs && product.specs.length > 0 && (
            <div className="mb-3">
              <h4 className="h6 mb-2">Product Highlights</h4>
              <Table size="sm" borderless className="mb-0">
                <tbody>
                  {product.specs.map((spec, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold text-muted" style={{ width: 120 }}>{spec.key}</td>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="mb-4">
            <h4 className="h6 mb-2">Quantity</h4>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity === 1 || product.stock === 0}
                >
                  <FaMinus />
                </Button>
                <span className="mx-3">{quantity}</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={product.stock === 0 || quantity === product.stock}
                >
                  <FaPlus />
                </Button>
              </div>
              <Button
                variant="primary"
                className="px-4"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <FaShoppingCart className="me-2" />
                {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
              </Button>
            </div>
          </div>

          {/* Delivery, Returns, Security */}
          <div className="border-top pt-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <FaTruck className="text-primary fs-4" />
              <div>
                <h4 className="h6 mb-1">Free Shipping</h4>
                <p className="text-muted small mb-0">On orders over $100</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 mb-3">
              <FaUndo className="text-primary fs-4" />
              <div>
                <h4 className="h6 mb-1">Easy Returns</h4>
                <p className="text-muted small mb-0">30-day return policy</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <FaShieldAlt className="text-primary fs-4" />
              <div>
                <h4 className="h6 mb-1">Secure Shopping</h4>
                <p className="text-muted small mb-0">Your data is protected</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <h3 className="h5 mb-4">Related Products</h3>
          <Row className="g-4">
            {relatedProducts.map((rel) => (
              <Col key={rel.id} xs={12} sm={6} md={3}>
                <Card className="h-100 border-0 shadow-sm" style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${rel.id}`)}>
                  <Card.Img
                    src={rel.image}
                    alt={rel.name}
                    style={{ height: 160, objectFit: 'cover' }}
                  />
                  <Card.Body>
                    <Card.Title className="h6 mb-1">{rel.name}</Card.Title>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fw-bold text-primary">${rel.price}</span>
                      {rel.discount > 0 && <Badge bg="danger">-{rel.discount}%</Badge>}
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <FaStar key={idx} className={idx < Math.floor(rel.rating) ? 'text-warning' : 'text-muted'} />
                      ))}
                      <span className="ms-1 text-muted small">({rel.reviews})</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
};

export default ProductDetails;
