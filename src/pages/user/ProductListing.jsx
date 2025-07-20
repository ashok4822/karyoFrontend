import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Dropdown,
  Badge,
  Spinner,
  Alert,
  Pagination,
  ButtonGroup,
} from "react-bootstrap";
import {
  FaShoppingCart,
  FaStar,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaThLarge,
  FaList,
  FaHeart,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCartPlus,
} from "react-icons/fa";
import ProductFilters from "../../components/ProductFilters";
import { fetchProductsFromBackend } from "../../redux/reducers/productSlice";
import { addToCart } from "../../redux/reducers/cartSlice";
import { addToWishlist, removeFromWishlist } from "../../redux/reducers/wishlistSlice";
import { getBestOffersForProducts } from "../../services/user/offerService";
import { toast } from "react-toastify";

const ProductListing = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const { products, loading, error, pagination } = useSelector(
    (state) => state.products
  );
  const wishlist = useSelector((state) => state.wishlist.items);

  // Debug logging
  // console.log('ProductListing render:', { products, loading, error, pagination });

  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    variantColours: [],
    variantCapacities: [],
    priceRange: [0, 5000]
  });
  const [searchError, setSearchError] = useState("");
  const [productOffers, setProductOffers] = useState({});
  const [offersLoading, setOffersLoading] = useState(false);

  // Read URL parameters and apply as initial filters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // console.log('ProductListing: Found category in URL:', categoryParam);
      const initialFilters = {
        categories: [categoryParam],
        brands: [],
        variantColours: [],
        variantCapacities: [],
        priceRange: [0, 5000]
      };
      setFilters(initialFilters);
      
      // Fetch products with the category filter
      const params = buildFilterParams(1, "", initialFilters, sort);
      // console.log('ProductListing: Initial load with category filter:', params);
      dispatch(fetchProductsFromBackend(params));
    }
  }, [searchParams, dispatch, sort]);

  // Fallback image for products without a main image
  const FALLBACK_IMAGE = "https://via.placeholder.com/300x300?text=No+Image";
  const getImageUrl = (img, product) => {
    // Try to get the first image from the first variant
    const variantImg = product.variantDetails && product.variantDetails.length > 0 && product.variantDetails[0].imageUrls && product.variantDetails[0].imageUrls.length > 0
      ? product.variantDetails[0].imageUrls[0]
      : null;
    let finalImg = variantImg || img;
    if (!finalImg) return FALLBACK_IMAGE;
    if (finalImg.startsWith("http")) return finalImg;
    // If the image is a relative path (e.g., /uploads/...), prepend backend URL
    return `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${finalImg}`;
  };

  // Helper function to build filter parameters
  const buildFilterParams = (page = 1, search = searchQuery, currentFilters = filters, currentSort = sort) => {
    const params = {
      page,
      limit: 6,
      search,
      sort: currentSort
    };

    // Add category filter - support multiple categories
    if (currentFilters.categories.length > 0) {
      params.category = currentFilters.categories.join(','); // Send as comma-separated string
    }

    // Add brand filter - support multiple brands
    if (currentFilters.brands.length > 0) {
      params.brand = currentFilters.brands.join(','); // Send as comma-separated string
    }

    // Add variant filters - send as comma-separated strings
    if (currentFilters.variantColours.length > 0) {
      params.variantColour = currentFilters.variantColours.join(',');
    }
    if (currentFilters.variantCapacities.length > 0) {
      params.variantCapacity = currentFilters.variantCapacities.join(',');
    }

    // Add price range filter
    if (currentFilters.priceRange && currentFilters.priceRange.length === 2) {
      params.minPrice = currentFilters.priceRange[0];
      params.maxPrice = currentFilters.priceRange[1];
    }

    return params;
  };

  useEffect(() => {
    // Initial load - only if no category parameter in URL
    const categoryParam = searchParams.get('category');
    if (!categoryParam) {
      const params = buildFilterParams(1, "", filters, sort);
      // console.log('ProductListing useEffect - dispatching fetchProductsFromBackend with params:', params);
      dispatch(fetchProductsFromBackend(params));
    }
  }, [dispatch, searchParams]);

  // Fetch offers when products change
  useEffect(() => {
    if (products && products.length > 0) {
      const productIds = products.map(product => product._id);
      fetchProductOffers(productIds);
    }
  }, [products]);

  const handleFilterChange = (newFilters) => {
    // console.log('ProductListing: handleFilterChange called with:', newFilters);
    setFilters(newFilters);
    // Reset to page 1 when filters change
    const params = buildFilterParams(1, searchQuery, newFilters, sort);
    // console.log('ProductListing: dispatching with params:', params);
    dispatch(fetchProductsFromBackend(params));
  };

  const handleSortChange = (sortOption) => {
    setSort(sortOption);
    const params = buildFilterParams(1, searchQuery, filters, sortOption);
    dispatch(fetchProductsFromBackend(params));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Validation: only allow alphanumeric, space, and basic punctuation, max 100 chars
    const trimmed = searchQuery.trim();
    if (trimmed && !/^[\w\s.,'"!?-]{0,100}$/.test(trimmed)) {
      setSearchError("Invalid search input. Only letters, numbers, spaces, and basic punctuation are allowed (max 100 characters).");
      return;
    }
    setSearchError("");
    const params = buildFilterParams(1, searchQuery, filters, sort);
    dispatch(fetchProductsFromBackend(params));
  };

  const handlePageChange = (page) => {
    const params = buildFilterParams(page, searchQuery, filters, sort);
    dispatch(fetchProductsFromBackend(params));
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      categories: [],
      brands: [],
      variantColours: [],
      variantCapacities: [],
      priceRange: [0, 5000]
    };
    setFilters(clearedFilters);
    setSort("newest");
    setSearchQuery("");
    const params = buildFilterParams(1, "", clearedFilters, "newest");
    dispatch(fetchProductsFromBackend(params));
  };

  // Fetch best offers for all products
  const fetchProductOffers = async (productIds) => {
    if (!productIds || productIds.length === 0) return;
    
    try {
      setOffersLoading(true);
      const response = await getBestOffersForProducts(productIds);
      if (response.success && response.data) {
        setProductOffers(response.data);
        console.log("Set product offers:", response.data);
      }
    } catch (error) {
      console.error("Error fetching best offers for products:", error);
    } finally {
      setOffersLoading(false);
    }
  };

  // Calculate final price with best offer discount
  const getFinalPrice = (product, basePrice) => {
    const offer = productOffers[product._id];
    
    if (!offer) {
      return basePrice;
    }

    let finalPrice = basePrice;

    // Apply offer discount
    if (offer.discountType === "percentage") {
      const discountAmount = (basePrice * offer.discountValue) / 100;
      const finalDiscount = offer.maximumDiscount 
        ? Math.min(discountAmount, offer.maximumDiscount)
        : discountAmount;
      finalPrice = Math.max(0, basePrice - finalDiscount);
    } else {
      finalPrice = Math.max(0, basePrice - offer.discountValue);
    }

    return finalPrice.toFixed(2);
  };

  const handleAddToCart = async (product) => {
    const variant = product.variantDetails && product.variantDetails.length > 0 ? product.variantDetails[0] : null;
    const variantId = variant?._id || variant?.id;
    if (!variantId) {
      toast.error("This product does not have a valid variant to add to cart.");
      return;
    }
    try {
      await dispatch(addToCart({ productVariantId: variantId, quantity: 1 })).unwrap();
      toast.success(`${product.name} has been added to your cart!`);
    } catch (err) {
      let errorMsg = "Failed to add to cart.";
      if (err && typeof err === "object" && err.error) errorMsg = err.error;
      else if (typeof err === "string") errorMsg = err;
      if (errorMsg.toLowerCase().includes("stock") || errorMsg.toLowerCase().includes("sold")) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleToggleWishlist = (product, e) => {
    e.stopPropagation();
    const variant = product.variantDetails && product.variantDetails.length > 0 ? product.variantDetails[0] : null;
    const variantId = variant?._id || variant?.id;
    const productId = product._id || product.id;
    
    if (!variantId) {
      toast.error("This product does not have a valid variant to add to wishlist.");
      return;
    }

    const isWishlisted = wishlist.some(item => 
      item.id === productId && item.variant === variantId
    );

    if (isWishlisted) {
      dispatch(removeFromWishlist({ 
        id: productId, 
        variant: variantId 
      }));
      toast.success("Removed from wishlist!");
    } else {
      dispatch(addToWishlist({
        id: productId,
        name: product.name,
        price: variant?.price || product.price,
        image: getImageUrl(product.mainImage, product),
        variant: variantId,
        variantName: variant ? `${variant.colour || ''} - ${variant.capacity || ''}`.trim() : "",
      }));
      toast.success("Added to wishlist!");
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-5">
      <Row>
        <Col lg={3}>
          <ProductFilters
            onApplyFilters={handleFilterChange}
            currentFilters={filters}
          />
        </Col>
        <Col lg={9} style={{ position: 'relative' }}>
          {/* Overlay spinner when loading */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.7)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '1rem',
              }}
            >
              <Spinner animation="border" role="status" style={{ width: 60, height: 60 }}>
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
          <Row className="mb-4 align-items-center">
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchError(""); }}
                    ref={input => (window._searchInput = input)}
                  />
                  {searchQuery && (
                    <Button
                      variant="outline-secondary"
                      onClick={e => {
                        e.preventDefault();
                        setSearchQuery("");
                        setSearchError("");
                        const params = buildFilterParams(1, "", filters, sort);
                        dispatch(fetchProductsFromBackend(params));
                        setTimeout(() => window._searchInput && window._searchInput.focus(), 0);
                      }}
                      style={{ position: 'absolute', right: 45, top: '50%', transform: 'translateY(-50%)', zIndex: 2, padding: '0 0.5rem', border: 'none' }}
                      tabIndex={-1}
                      aria-label="Clear search"
                    >
                      &times;
                    </Button>
                  )}
                  <Button type="submit" variant="outline-primary">
                    <FaSearch />
                  </Button>
                </InputGroup>
                {searchError && (
                  <div className="text-danger small mt-2">{searchError}</div>
                )}
              </Form>
            </Col>
            <Col md={4} className="text-center">
              <ButtonGroup>
                <Button
                  variant={view === "grid" ? "primary" : "outline-primary"}
                  onClick={() => setView("grid")}
                >
                  <FaThLarge />
                </Button>
                <Button
                  variant={view === "list" ? "primary" : "outline-primary"}
                  onClick={() => setView("list")}
                >
                  <FaList />
                </Button>
              </ButtonGroup>
            </Col>
            <Col md={4} className="text-end">
              <div className="d-flex gap-2 justify-content-end">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary">
                    <FaSort className="me-2" />
                    Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      active={sort === "newest"}
                      onClick={() => handleSortChange("newest")}
                    >
                      <FaSortAmountDown className="me-2" />
                      Newest First
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={sort === "oldest"}
                      onClick={() => handleSortChange("oldest")}
                    >
                      <FaSortAmountUp className="me-2" />
                      Oldest First
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={sort === "price-asc"}
                      onClick={() => handleSortChange("price-asc")}
                    >
                      Price: Low to High
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={sort === "price-desc"}
                      onClick={() => handleSortChange("price-desc")}
                    >
                      Price: High to Low
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={sort === "name-asc"}
                      onClick={() => handleSortChange("name-asc")}
                    >
                      Name: A-Z
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={sort === "name-desc"}
                      onClick={() => handleSortChange("name-desc")}
                    >
                      Name: Z-A
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button
                  variant="outline-secondary"
                  onClick={clearAllFilters}
                  className="d-flex align-items-center gap-1"
                >
                  <FaFilter /> Clear All
                </Button>
              </div>
            </Col>
          </Row>

          <Row className={view === "grid" ? "g-4" : "g-3"}>
            {(!loading && products.length === 0) ? (
              <Col xs={12} className="text-center text-muted py-5">
                <div style={{ fontSize: '1.5rem' }}>
                  <FaExclamationTriangle className="me-2 text-warning" />
                  No products found matching your search.
                </div>
              </Col>
            ) : (
              products.map((product) => (
                <Col
                  key={product.id || product._id}
                  xs={12}
                  md={view === "grid" ? 6 : 12}
                  lg={view === "grid" ? 4 : 12}
                >
                  <Card
                    className={`h-100 border-0 shadow rounded-4 mb-4 ${view === "list" ? "flex-row" : ""} product-card`}
                    onClick={() => handleProductClick(product.id || product._id)}
                    style={{ transition: "transform 0.2s", cursor: "pointer" }}
                    onMouseOver={e => (e.currentTarget.style.transform = "translateY(-5px)")}
                    onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <div
                      className={`position-relative ${view === "list" ? "col-md-4" : ""}`}
                      style={{ height: view === "list" ? "auto" : "240px" }}
                    >
                      <Card.Img
                        src={getImageUrl(product.mainImage, product)}
                        alt={product.name}
                        className="h-100 rounded-top object-fit-cover"
                        style={{ objectFit: "cover", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
                      />
                      {product.isNew && (
                        <Badge bg="primary" className="position-absolute top-0 start-0 m-2">New</Badge>
                      )}
                      {/* Wishlist Icon */}
                      {(() => {
                        const variant = product.variantDetails && product.variantDetails.length > 0 ? product.variantDetails[0] : null;
                        const variantId = variant?._id || variant?.id;
                        const productId = product._id || product.id;
                        const isWishlisted = variantId ? wishlist.some(item => 
                          item.id === productId && item.variant === variantId
                        ) : false;
                        
                        return (
                          <Button
                            variant="light"
                            size="sm"
                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                            style={{ 
                              top: '8px',
                              right: '8px',
                              width: '35px', 
                              height: '35px', 
                              padding: 0,
                              border: 'none',
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              zIndex: 10,
                              transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => handleToggleWishlist(product, e)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                            }}
                          >
                            <FaHeart
                              className={isWishlisted ? "text-danger" : ""}
                              style={{
                                color: isWishlisted ? undefined : "#555",
                                filter: !isWishlisted ? "drop-shadow(0 1px 2px rgba(0,0,0,0.10))" : "none"
                              }}
                              size={20}
                              fill={isWishlisted ? "#dc3545" : "none"}
                              stroke="#dc3545"
                              strokeWidth={4}
                            />
                          </Button>
                        );
                      })()}
                    </div>
                    <Card.Body className={view === "list" ? "col-md-8" : "d-flex flex-column justify-content-between"} style={{ padding: "1.25rem" }}>
                      <div>
                        <Card.Title className="h5 mb-1 text-truncate" title={product.name}>{product.name}</Card.Title>
                        <div className="mb-1">
                          <span className="badge bg-info text-dark small">
                            {product.brand || 'Unknown Brand'}
                          </span>
                        </div>
                        {product.category && (
                          <div className="mb-1">
                            <span className="badge bg-secondary small">{product.category.name || product.category}</span>
                          </div>
                        )}
                        <Card.Text className="text-muted small mb-2" style={{ minHeight: 40 }}>
                          {product.description && product.description.length > 60
                            ? product.description.slice(0, 60) + "..."
                            : product.description}
                        </Card.Text>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {[...Array(5)].map((_, index) => (
                            <FaStar
                              key={index}
                              className={index < Math.floor(product.rating) ? "text-warning" : "text-muted"}
                              style={{ fontSize: "1rem" }}
                            />
                          ))}
                          <span className="ms-1 text-muted small">({product.reviews || 0})</span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="d-flex align-items-end justify-content-between mb-3">
                          <div>
                            {(() => {
                              const firstVariant = product.variantDetails && product.variantDetails.length > 0 ? product.variantDetails[0] : null;
                              const basePrice = firstVariant && firstVariant.price ? firstVariant.price : product.price;
                              const finalPrice = getFinalPrice(product, basePrice);
                              const offer = productOffers[product._id];
                              const colour = firstVariant && firstVariant.colour ? firstVariant.colour : null;
                              const capacity = firstVariant && firstVariant.capacity ? firstVariant.capacity : null;
                              const hasOffer = offer && parseFloat(finalPrice) < parseFloat(basePrice);
                              
                              return (
                                <>
                                  <span className="h4 fw-bold text-primary mb-0">₹{finalPrice}</span>
                                  {hasOffer && (
                                    <span className="text-muted text-decoration-line-through ms-2">
                                      ₹{basePrice}
                                    </span>
                                  )}
                                  {offer && hasOffer && (
                                    <div className="mt-1">
                                      <span className="badge bg-success small">
                                        {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                      </span>
                                    </div>
                                  )}
                                  {(colour || capacity) && (
                                    <div className="mt-1">
                                      {colour && <span className="badge bg-light text-dark me-1">{colour}</span>}
                                      {capacity && <span className="badge bg-light text-dark">{capacity}</span>}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div
                          className="w-100 d-flex align-items-center justify-content-between p-3"
                          style={{
                            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                            borderRadius: '12px',
                            border: '1px solid #34495e',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(44, 62, 80, 0.2)',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 16px rgba(44, 62, 80, 0.4)';
                            e.target.style.borderColor = '#3498db';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(44, 62, 80, 0.2)';
                            e.target.style.borderColor = '#34495e';
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                boxShadow: '0 2px 6px rgba(52, 152, 219, 0.3)',
                              }}
                            >
                              <FaCartPlus style={{ color: 'white', fontSize: '1.1rem' }} />
                            </div>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>
                              Add to Cart
                            </span>
                          </div>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#3498db',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>

          {pagination.totalPages > 1 && (
            <>
              <div className="d-flex justify-content-center mt-4">
                <Pagination className="custom-pagination">
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  />
                  {/* Ellipsis logic: show first, last, and window around current */}
                  {pagination.totalPages <= 5 ? (
                    [...Array(pagination.totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={pagination.currentPage === index + 1}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))
                  ) : (
                    <>
                      {pagination.currentPage > 3 && (
                        <>
                          <Pagination.Item onClick={() => handlePageChange(1)} active={pagination.currentPage === 1}>1</Pagination.Item>
                          {pagination.currentPage > 4 && <Pagination.Ellipsis disabled />}
                        </>
                      )}
                      {[-2, -1, 0, 1, 2].map(offset => {
                        const page = pagination.currentPage + offset;
                        if (page > 1 && page < pagination.totalPages) {
                          return (
                            <Pagination.Item
                              key={page}
                              active={pagination.currentPage === page}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        }
                        return null;
                      })}
                      {pagination.currentPage < pagination.totalPages - 2 && (
                        <>
                          {pagination.currentPage < pagination.totalPages - 3 && <Pagination.Ellipsis disabled />}
                          <Pagination.Item onClick={() => handlePageChange(pagination.totalPages)} active={pagination.currentPage === pagination.totalPages}>{pagination.totalPages}</Pagination.Item>
                        </>
                      )}
                    </>
                  )}
                  <Pagination.Next
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  />
                </Pagination>
              </div>
              <div className="d-flex justify-content-center mb-4">
                <span className="text-muted">Page {pagination.currentPage} of {pagination.totalPages}</span>
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductListing;
