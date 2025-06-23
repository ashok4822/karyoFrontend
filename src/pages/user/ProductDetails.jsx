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
  ProgressBar,
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
  FaSearchPlus,
  FaTimes,
  FaCheck,
} from 'react-icons/fa';
import userAxios from '../../lib/userAxios';
import { fetchProductsFromBackend } from '../../redux/reducers/productSlice';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { products } = useSelector(state => state.products);
  
  // Local state
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showZoom, setShowZoom] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        setProductError(null);
        
        console.log('ProductDetails: Fetching product with ID:', id);
        console.log('ProductDetails: Available products in Redux store:', products);
        
        // First try to get from Redux store
        const productFromStore = products.find(p => p._id === id);
        if (productFromStore) {
          console.log('ProductDetails: Found product in Redux store:', productFromStore);
          setProduct(productFromStore);
          
          // Set default selected variant (first available one)
          if (productFromStore.variants && productFromStore.variants.length > 0) {
            setSelectedVariant(productFromStore.variants[0]);
          }
          
          // Check if product is blocked or unavailable
          if (productFromStore.blocked || productFromStore.unavailable || productFromStore.status !== 'active') {
            navigate('/products');
            return;
          }
          
          // Fetch related products
          fetchRelatedProducts(productFromStore);
          
          setProductLoading(false);
          return;
        }
        
        // If not in store, try API call
        console.log('ProductDetails: Making API call to fetch product:', id);
        const response = await userAxios.get(`/products/${id}`);
        const productData = response.data;
        
        console.log('ProductDetails: API response status:', response.status);
        console.log('ProductDetails: Received product data:', productData);
        console.log('ProductDetails: Product data structure:', {
          hasVariants: !!productData.variants,
          variantsLength: productData.variants?.length,
          hasVariantDetails: !!productData.variantDetails,
          variantDetailsLength: productData.variantDetails?.length,
          hasMainImage: !!productData.mainImage,
          hasOtherImages: !!productData.otherImages,
          otherImagesLength: productData.otherImages?.length
        });
        
        // Check if product is blocked or unavailable
        if (productData.blocked || productData.unavailable || productData.status !== 'active') {
          navigate('/products');
          return;
        }
        
        setProduct(productData);
        
        // Set default selected variant (first available one)
        if (productData.variantDetails && productData.variantDetails.length > 0) {
          setSelectedVariant(productData.variantDetails[0]);
        } else if (productData.variants && productData.variants.length > 0) {
          setSelectedVariant(productData.variants[0]);
        }
        
        // Fetch related products
        fetchRelatedProducts(productData);
        
      } catch (error) {
        console.error('Error fetching product:', error);
        setProductError('Failed to load product details');
        
        // If API fails, try to get from Redux store as fallback
        const productFromStore = products.find(p => p._id === id);
        if (productFromStore) {
          setProduct(productFromStore);
          if (productFromStore.variants && productFromStore.variants.length > 0) {
            setSelectedVariant(productFromStore.variants[0]);
          }
        } else {
          // If not found anywhere, redirect to products page
          navigate('/products');
        }
      } finally {
        setProductLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, products, navigate, dispatch]);

  // Fetch related products
  const fetchRelatedProducts = async (currentProduct) => {
    try {
      if (currentProduct.category) {
        const response = await userAxios.get('/products', {
          params: {
            category: currentProduct.category._id,
            limit: 4,
            exclude: currentProduct._id
          }
        });
        setRelatedProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  // Quantity handlers
  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    const maxStock = getCurrentStock();
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (product.blocked || product.unavailable || product.status !== 'active') {
      navigate('/products');
      return;
    }
    
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', {
      product: product._id,
      variant: selectedVariant?._id,
      quantity
    });
  };

  // Add to wishlist handler
  const handleAddToWishlist = () => {
    // TODO: Implement wishlist functionality
    console.log('Adding to wishlist:', product._id);
  };

  // Coupon application handler
  const handleApplyCoupon = () => {
    setCouponError('');
    
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    // Mock coupon validation
    const mockCoupons = [
      { code: 'SAVE10', discount: 10 },
      { code: 'SAVE20', discount: 20 },
      { code: 'WELCOME', discount: 15 }
    ];
    
    const coupon = mockCoupons.find(c => c.code.toLowerCase() === couponInput.toLowerCase());
    
    if (coupon) {
      setActiveCoupon(coupon);
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  // Variant selection handler
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity when variant changes
    setSelectedImage(0); // Reset to show the new variant's image
  };

  // Zoom effect handlers
  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  // Get variants from variantDetails (from backend aggregation)
  const getVariants = () => {
    if (!product) {
      console.log('getVariants: product is null');
      return [];
    }
    
    console.log('getVariants: product data structure:', {
      hasVariantDetails: !!product.variantDetails,
      variantDetailsLength: product.variantDetails?.length,
      hasVariants: !!product.variants,
      variantsLength: product.variants?.length,
      productKeys: Object.keys(product),
      variantDetailsData: product.variantDetails
    });
    
    // Use variantDetails from backend aggregation
    if (product.variantDetails && product.variantDetails.length > 0) {
      console.log('getVariants: using product.variantDetails:', product.variantDetails);
      return product.variantDetails;
    }
    
    // Fallback to variants if variantDetails is not available
    if (product.variants && product.variants.length > 0) {
      console.log('getVariants: using product.variants (fallback):', product.variants);
      return product.variants;
    }
    
    console.log('getVariants: no variants found');
    return [];
  };

  // Get the current price based on selected variant or product
  const getCurrentPrice = () => {
    if (!product) return 0;
    
    if (selectedVariant) {
      return selectedVariant.price;
    }
    
    // If no variant selected, get the lowest price from available variants
    const variants = getVariants();
    if (variants.length > 0) {
      return Math.min(...variants.map(v => v.price));
    }
    
    // Fallback to product price
    return product.price || 0;
  };

  // Get the current stock based on selected variant or product
  const getCurrentStock = () => {
    if (!product) return 0;
    
    if (selectedVariant) {
      return selectedVariant.stock;
    }
    
    // If no variant selected, sum all variant stocks
    const variants = getVariants();
    if (variants.length > 0) {
      return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    
    // Fallback to product total stock
    return product.totalStock || 0;
  };

  // Calculate final price with discount and coupon
  const getFinalPrice = () => {
    if (!product) return '0.00';
    
    const basePrice = getCurrentPrice();
    if (!basePrice) return '0.00';
    
    let finalPrice = basePrice;
    
    // Apply product discount
    if (product.discount > 0) {
      finalPrice = finalPrice * (1 - product.discount / 100);
    }
    
    // Apply coupon discount
    if (activeCoupon) {
      finalPrice = finalPrice * (1 - activeCoupon.discount / 100);
    }
    
    return finalPrice.toFixed(2);
  };

  // Get all images from variants, use first as main image
  const getAllImages = () => {
    if (!product) return [];
    
    // Helper function to construct full image URL
    const getFullImageUrl = (imageUrl) => {
      if (!imageUrl) return null;
      if (imageUrl.startsWith('http')) return imageUrl;
      // If the image is a relative path, prepend backend URL
      return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${imageUrl}`;
    };
    
    // If product has variantDetails (from backend aggregation), get images from there
    if (product.variantDetails && product.variantDetails.length > 0) {
      // Flatten all imageUrls from all variantDetails
      const allVariantImages = product.variantDetails.flatMap(variant => 
        (variant.imageUrls || []).map(img => getFullImageUrl(img))
      ).filter(Boolean);
      if (allVariantImages.length > 0) {
        return allVariantImages;
      }
    }
    
    // If product has variants (fallback), get images from variants
    if (product.variants && product.variants.length > 0) {
      // Flatten all imageUrls from all variants
      const allVariantImages = product.variants.flatMap(variant => 
        (variant.imageUrls || []).map(img => getFullImageUrl(img))
      ).filter(Boolean);
      if (allVariantImages.length > 0) {
        return allVariantImages;
      }
    }
    
    // If no variants or no variant images, use product-level images
    const productImages = [];
    if (product.mainImage) {
      productImages.push(getFullImageUrl(product.mainImage));
    }
    if (product.otherImages && product.otherImages.length > 0) {
      productImages.push(...product.otherImages.map(img => getFullImageUrl(img)));
    }
    
    return productImages.filter(Boolean);
  };

  // Get the selected variant's primary image
  const getSelectedVariantImage = () => {
    if (!selectedVariant || !selectedVariant.imageUrls || selectedVariant.imageUrls.length === 0) {
      return null;
    }
    
    const imageUrl = selectedVariant.imageUrls[0];
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${imageUrl}`;
  };

  // Get all images with selected variant image prioritized
  const getDisplayImages = () => {
    const selectedVariantImage = getSelectedVariantImage();
    
    if (selectedVariantImage && selectedVariant && selectedVariant.imageUrls && selectedVariant.imageUrls.length > 0) {
      // Return only the selected variant's images
      return selectedVariant.imageUrls.map(imageUrl => {
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${imageUrl}`;
      }).filter(Boolean);
    }
    
    // Fallback to all images if no variant is selected or variant has no images
    const allImages = getAllImages();
    return allImages;
  };

  // 1. Set first variant as selected on product load
  useEffect(() => {
    console.log('useEffect triggered - product:', {
      hasProduct: !!product,
      hasVariantDetails: !!product?.variantDetails,
      variantDetailsLength: product?.variantDetails?.length,
      hasVariants: !!product?.variants,
      variantsLength: product?.variants?.length,
      variantDetails: product?.variantDetails
    });
    
    if (product && product.variantDetails && product.variantDetails.length > 0) {
      console.log('Setting first variant as selected:', product.variantDetails[0]);
      setSelectedVariant(product.variantDetails[0]);
      setSelectedImage(0); // Reset to show the selected variant's image
    } else if (product && product.variants && product.variants.length > 0) {
      console.log('Setting first variant as selected (fallback):', product.variants[0]);
      setSelectedVariant(product.variants[0]);
      setSelectedImage(0); // Reset to show the selected variant's image
    } else {
      console.log('No variants found or product not loaded yet');
    }
  }, [product]);

  // Loading state
  if (productLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading product details...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (productError) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{productError}</p>
          <Button variant="outline-danger" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  // Product not found or blocked
  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Product Not Available</Alert.Heading>
          <p>This product is no longer available or has been removed.</p>
          <Button variant="outline-warning" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  // Calculate stock and sold out status only after product is loaded
  const variants = getVariants();
  const currentStock = getCurrentStock();
  const isSoldOut = currentStock === 0;

  // Get images only when product is available
  const images = getDisplayImages();
  const mainImage = images[0];
  const sideImages = images.slice(1);

  // Debug logging
  console.log('Product data:', {
    _id: product._id,
    name: product.name,
    mainImage: product.mainImage,
    otherImages: product.otherImages,
    variantDetails: product.variantDetails?.map(v => ({
      _id: v._id,
      colour: v.colour,
      capacity: v.capacity,
      imageUrls: v.imageUrls,
      price: v.price,
      stock: v.stock
    })),
    variants: product.variants?.map(v => ({
      _id: v._id,
      colour: v.colour,
      capacity: v.capacity,
      imageUrls: v.imageUrls,
      price: v.price,
      stock: v.stock
    }))
  });
  console.log('Processed images:', {
    totalImages: images.length,
    mainImage,
    sideImages
  });

  // Related products (same category, not self, max 4)
  const getRelatedProducts = () => {
    if (!product || !product.category) return [];
    
    return products
      .filter(p => p._id !== product._id && p.category?._id === product.category._id)
      .slice(0, 4);
  };

  return (
    <Container className="py-4">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          Products
        </Breadcrumb.Item>
        {product.category && (
          <Breadcrumb.Item 
            onClick={() => navigate(`/products?category=${product.category._id}`)} 
            style={{ cursor: 'pointer' }}
          >
            {product.category.name}
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        {/* Product Images */}
        <Col md={6} className="mb-4">
          <Row>
            <Col xs={3} sm={2} className="d-flex flex-column justify-content-center align-items-center gap-2" style={{ minHeight: 400, background: '#f8f9fa', borderRadius: '8px 0 0 8px', border: '1px solid #e9ecef', borderRight: 0 }}>
              {images.map((img, idx) => (
                <RBImage
                  key={`all-image-${idx}`}
                  src={img || '/placeholder.svg'}
                  alt={`thumb-${idx}`}
                  thumbnail
                  style={{ 
                    cursor: 'pointer', 
                    border: selectedImage === idx ? '2px solid #0d6efd' : 'none', 
                    width: 60, 
                    height: 60, 
                    objectFit: 'cover',
                    boxShadow: selectedImage === idx ? '0 0 0 2px #0d6efd' : undefined
                  }}
                  onClick={() => setSelectedImage(idx)}
                  onError={(e) => {
                    e.target.src = '/placeholder.svg';
                  }}
                />
              ))}
            </Col>
            <Col xs={9} sm={10}>
              <div 
                style={{ 
                  position: 'relative', 
                  cursor: 'zoom-in',
                  overflow: 'hidden',
                  borderRadius: '0 8px 8px 0',
                  border: '1px solid #e9ecef',
                  borderLeft: 0
                }} 
                onClick={() => setShowZoom(true)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              >
                <RBImage
                  src={images[selectedImage] || mainImage || '/placeholder.svg'}
                  alt={product.name}
                  fluid
                  style={{ height: 400, objectFit: 'cover', borderRadius: 8 }}
                  onError={(e) => {
                    e.target.src = '/placeholder.svg';
                  }}
                />
                
                {/* Zoom Overlay */}
                {isZoomed && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${images[selectedImage] || mainImage || '/placeholder.svg'})`,
                      backgroundSize: '300%',
                      backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                      backgroundRepeat: 'no-repeat',
                      borderRadius: 8,
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                  />
                )}
                
                {product.isNew && (
                  <Badge bg="primary" className="position-absolute top-0 start-0 m-3">New</Badge>
                )}
                {isSoldOut && (
                  <Badge bg="danger" className="position-absolute top-0 end-0 m-3">Sold Out</Badge>
                )}
                {product.discount > 0 && (
                  <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-3">
                    -{product.discount}%
                  </Badge>
                )}
                <div className="position-absolute bottom-0 end-0 m-3">
                  <Button variant="light" size="sm" onClick={(e) => { e.stopPropagation(); setShowZoom(true); }}>
                    <FaSearchPlus />
                  </Button>
                </div>
              </div>
              
              {/* Zoom Modal */}
              <Modal show={showZoom} onHide={() => setShowZoom(false)} centered size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>{product.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                  <RBImage
                    src={images[selectedImage] || mainImage || '/placeholder.svg'}
                    alt={product.name}
                    fluid
                    style={{ width: '100%', objectFit: 'contain', background: '#f8f9fa' }}
                    onError={(e) => {
                      console.log('Zoom modal image failed to load:', e.target.src);
                      e.target.src = '/placeholder.svg';
                    }}
                  />
                </Modal.Body>
              </Modal>
            </Col>
          </Row>

          {/* Variant Selection - moved here below images */}
          {(() => {
            console.log('Rendering variant selection UI:', {
              variantsLength: variants.length,
              variants: variants,
              selectedVariant: selectedVariant
            });
            
            return variants.length > 0 && (
              <div className="mb-4 mt-4">
                <h5 className="mb-3">Select Variant</h5>
                {/* Mini Variant Display */}
                <div className="row g-5 mb-3">
                  {variants.map((variant) => {
                    const isActive = variant.status === 'active';
                    const isInStock = variant.stock > 0;
                    return (
                      <div key={variant._id} className="col-12 col-sm-6 col-lg-4 mb-3">
                        <div 
                          className={`card h-100 ${(isActive && isInStock) ? 'cursor-pointer' : 'opacity-50'} ${selectedVariant?._id === variant._id ? 'border-primary' : 'border-light'} shadow-sm rounded-3`} 
                          onClick={(isActive && isInStock) ? () => handleVariantSelect(variant) : undefined}
                          style={{ cursor: (isActive && isInStock) ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                          onMouseEnter={(isActive && isInStock) ? (e) => e.currentTarget.style.transform = 'translateY(-2px)' : undefined}
                          onMouseLeave={(isActive && isInStock) ? (e) => e.currentTarget.style.transform = 'translateY(0)' : undefined}
                        >
                          <div className="card-body p-2 d-flex flex-column justify-content-between h-100">
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                              <div className="d-flex gap-1 flex-wrap align-items-center">
                                {variant.colour && (
                                  <Badge bg="light" text="dark" className="small mb-1">
                                    {variant.colour}
                                  </Badge>
                                )}
                                {variant.capacity && (
                                  <Badge bg="light" text="dark" className="small mb-1">
                                    {variant.capacity}
                                  </Badge>
                                )}
                              </div>
                              <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                                {selectedVariant?._id === variant._id && isActive && (
                                  <Badge bg="primary" className="small mb-1">
                                    <FaCheck size={10} />
                                  </Badge>
                                )}
                                {!isActive && (
                                  <Badge bg="secondary" className="small mb-1">Inactive</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-center mb-2">
                              <span className="h6 text-primary fw-bold mb-0" style={{ fontSize: '1rem' }}>${variant.price}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
                              <small className={`${variant.stock > 0 ? 'text-success' : 'text-danger'} fw-semibold`} style={{ fontSize: '0.95rem' }}>
                                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                              </small>
                              {variant.stock === 0 && (
                                <Badge bg="danger" className="small mb-1">Sold Out</Badge>
                              )}
                            </div>
                            {/* Variant Images (if available) */}
                            {variant.imageUrls && variant.imageUrls.length > 0 && (
                              <div className="mt-2 text-center">
                                <img 
                                  src={variant.imageUrls[0].startsWith('http') ? variant.imageUrls[0] : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${variant.imageUrls[0]}`}
                                  alt={`${variant.colour} ${variant.capacity}`}
                                  className="img-fluid rounded mx-auto d-block"
                                  style={{ height: '60px', objectFit: 'cover', width: '100%', maxWidth: 100 }}
                                  onError={(e) => {
                                    e.target.src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Selected Variant Details */}
                {selectedVariant && (
                  <div className="alert alert-info">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Selected:</strong> {selectedVariant.colour} {selectedVariant.capacity} - ${selectedVariant.price}
                        <br />
                        <small className="text-muted">
                          Stock: {selectedVariant.stock} units
                        </small>
                      </div>
                      <div className="d-flex gap-2">
                        {selectedVariant.colour && (
                          <Badge bg="light" text="dark">{selectedVariant.colour}</Badge>
                        )}
                        {selectedVariant.capacity && (
                          <Badge bg="light" text="dark">{selectedVariant.capacity}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Col>

        {/* Product Info */}
        <Col md={6}>
          <h1 className="h2 mb-2">{product.name}</h1>
          {product.category && (
            <div className="mb-2">
              <span className="badge bg-secondary small">{product.category.name || product.category}</span>
            </div>
          )}
          
          {/* Ratings and Reviews */}
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="d-flex align-items-center">
              {[...Array(5)].map((_, index) => (
                <FaStar
                  key={`main-product-star-${index}`}
                  className={index < Math.floor(product.rating || 4.5) ? 'text-warning' : 'text-muted'}
                  size={16}
                />
              ))}
              <span className="ms-2 text-muted">({product.reviews || 128} reviews)</span>
            </div>
            <Button variant="link" className="p-0" onClick={handleAddToWishlist}>
              <FaHeart className="text-danger" size={20} />
            </Button>
          </div>

          <p className="text-muted mb-3">{product.description}</p>

          {/* Price, Discount, Coupon */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="h3 text-primary fw-bold">${getFinalPrice()}</span>
              <span className="text-muted text-decoration-line-through ms-2">$99.99</span>
              {activeCoupon && (
                <Badge bg="success">
                  <FaCheck className="me-1" />
                  {activeCoupon.code} (-{activeCoupon.discount}%)
                </Badge>
              )}
            </div>
            
            {/* Show price range if multiple variants */}
            {(() => {
              
              if (variants.length > 1) {
                const prices = variants.map(v => v.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return minPrice !== maxPrice && (
                  <div className="text-muted small">
                    Price range: ${minPrice} - ${maxPrice}
                  </div>
                );
              }
              return null;
            })()}

            {/* Coupon Application */}
            <div className="mb-3">
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
                  <Button 
                    size="sm" 
                    variant="outline-danger" 
                    onClick={() => { setActiveCoupon(null); setCouponInput(''); }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </Form>
              {couponError && <div className="text-danger small mt-1">{couponError}</div>}
              {product.coupons && product.coupons.length > 0 && !activeCoupon && (
                <div className="text-muted small mt-1">
                  Available coupons: {product.coupons.map(c => 
                    <Badge key={c.code} bg="info" className="me-1">{c.code}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className={selectedVariant && selectedVariant.stock === 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                {selectedVariant
                  ? (selectedVariant.stock === 0 ? 'Sold Out' : `In Stock: ${selectedVariant.stock}`)
                  : (product.totalStock === 0 ? 'Sold Out' : `In Stock: ${product.totalStock}`)}
              </span>
              {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
                <Badge bg="warning" text="dark">Low Stock</Badge>
              )}
              {!selectedVariant && currentStock <= 5 && currentStock > 0 && (
                <Badge bg="warning" text="dark">Low Stock</Badge>
              )}
            </div>
            
            {/* Show variant-specific stock if variant is selected */}
            {selectedVariant && (
              <div className="text-muted small mb-2">
                <strong>Selected Variant:</strong> {selectedVariant.colour} {selectedVariant.capacity} - {selectedVariant.stock} available
              </div>
            )}
            
            {/* Show total stock across all variants */}
            {variants.length > 1 && (
              <div className="text-muted small">
                <strong>Total Stock:</strong> {product.totalStock} units across {variants.length} variants
              </div>
            )}
          </div>

          {/* Product Specs / Highlights */}
          {product.specs && product.specs.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">Product Highlights</h5>
              <div className="bg-light p-3 rounded">
                {product.specs.map((spec, idx) => (
                  <div key={`spec-${idx}`} className="d-flex justify-content-between mb-2">
                    <span className="fw-bold text-muted">{spec.key}:</span>
                    <span>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="mb-4">
            <h5 className="mb-3">Quantity</h5>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity === 1 || isSoldOut}
                >
                  <FaMinus />
                </Button>
                <span className="mx-3 fw-bold">{quantity}</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isSoldOut || quantity === currentStock}
                >
                  <FaPlus />
                </Button>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="px-4"
                onClick={handleAddToCart}
                disabled={isSoldOut}
              >
                <FaShoppingCart className="me-2" />
                {isSoldOut ? 'Sold Out' : 'Add to Cart'}
              </Button>
            </div>
          </div>

          {/* Delivery, Returns, Security */}
          <div className="border-top pt-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <FaTruck className="text-primary fs-4" />
              <div>
                <h6 className="mb-1">Free Shipping</h6>
                <p className="text-muted small mb-0">On orders over $100</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 mb-3">
              <FaUndo className="text-primary fs-4" />
              <div>
                <h6 className="mb-1">Easy Returns</h6>
                <p className="text-muted small mb-0">30-day return policy</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <FaShieldAlt className="text-primary fs-4" />
              <div>
                <h6 className="mb-1">Secure Shopping</h6>
                <p className="text-muted small mb-0">Your data is protected</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <h3 className="h4 mb-4">Related Products</h3>
          <Row className="g-4">
            {relatedProducts.map((rel) => {
              // Fallback image logic
              let relImage = rel.mainImage;
              if (!relImage && rel.variantDetails && rel.variantDetails.length > 0 && rel.variantDetails[0].imageUrls && rel.variantDetails[0].imageUrls.length > 0) {
                relImage = rel.variantDetails[0].imageUrls[0];
              }
              if (!relImage && rel.variants && rel.variants.length > 0 && rel.variants[0].imageUrls && rel.variants[0].imageUrls.length > 0) {
                relImage = rel.variants[0].imageUrls[0];
              }
              if (relImage && !relImage.startsWith('http')) {
                relImage = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${relImage}`;
              }
              if (!relImage) {
                relImage = '/placeholder.svg';
              }
              // Price logic
              let relPrice = 'N/A';
              if (rel.variants && rel.variants.length > 0) {
                relPrice = Math.min(...rel.variants.map(v => v.price));
              } else if (rel.variantDetails && rel.variantDetails.length > 0) {
                relPrice = Math.min(...rel.variantDetails.map(v => v.price));
              } else if (rel.price) {
                relPrice = rel.price;
              }
              return (
                <Col key={rel._id} xs={12} sm={6} md={3}>
                  <Card 
                    className="h-100 border-0 shadow-sm" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => navigate(`/products/${rel._id}`)}
                  >
                    <Card.Img
                      src={relImage}
                      alt={rel.name}
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                    <Card.Body>
                      <Card.Title className="h6 mb-2">{rel.name}</Card.Title>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {rel.discount > 0 && <Badge key={`${rel._id}-discount`} bg="danger">-{rel.discount}%</Badge>}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <FaStar 
                            key={`${rel._id}-star-${idx}`} 
                            className={idx < Math.floor(rel.rating || 4.5) ? 'text-warning' : 'text-muted'} 
                            size={12}
                          />
                        ))}
                        <span className="ms-1 text-muted small">({rel.reviews || 45})</span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </Container>
  );
};

export default ProductDetails; 