import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaShoppingCart, FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const primaryVariant = product.variants[0];

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (primaryVariant.stock > 0) {
      dispatch(addToCart({
        id: `${product.id}-${primaryVariant.id}`,
        productId: product.id,
        variantId: primaryVariant.id,
        name: product.name,
        price: primaryVariant.price,
        quantity: 1,
        image: primaryVariant.mainImage,
        color: primaryVariant.color,
        size: primaryVariant.size,
      }));
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-warning" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-warning" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-warning" />);
      }
    }

    return stars;
  };

  return (
    <Card className="h-100 product-card border-0 shadow-sm hover-shadow transition">
      <Link to={`/products/${product.id}`} className="text-decoration-none">
        <div className="position-relative overflow-hidden rounded-top">
          <Card.Img
            variant="top"
            src={primaryVariant.mainImage}
            alt={product.name}
            className="product-image"
            style={{ height: '250px', objectFit: 'cover' }}
          />
          {product.isFeatured && (
            <Badge
              bg="warning"
              text="dark"
              className="position-absolute top-0 start-0 m-3"
            >
              Featured
            </Badge>
          )}
          {primaryVariant.stock === 0 && (
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
              <Badge bg="danger" className="fs-6">Sold Out</Badge>
            </div>
          )}
        </div>
      </Link>
      
      <Card.Body className="d-flex flex-column">
        <Link to={`/products/${product.id}`} className="text-decoration-none">
          <Card.Title className="text-dark mb-2 h5">{product.name}</Card.Title>
        </Link>
        
        <Card.Text className="text-muted small mb-3 flex-grow-1">
          {product.description}
        </Card.Text>
        
        <div className="d-flex align-items-center mb-3">
          <div className="d-flex align-items-center me-2">
            {renderStars(product.rating)}
          </div>
          <small className="text-muted">
            {product.rating} ({product.reviewCount} reviews)
          </small>
        </div>
        
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 text-primary">${primaryVariant.price}</h5>
            <small className="text-muted">
              {primaryVariant.color} • {primaryVariant.size}
            </small>
          </div>
          
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={primaryVariant.stock === 0}
            className="d-flex align-items-center gap-1"
          >
            <FaShoppingCart />
            Add
          </Button>
        </div>
        
        {primaryVariant.stock > 0 && primaryVariant.stock <= 5 && (
          <small className="text-danger mt-2 d-block">
            Only {primaryVariant.stock} left in stock!
          </small>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
