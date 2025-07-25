import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
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
} from "react-bootstrap";
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
} from "react-icons/fa";
import { Heart } from "lucide-react";
import { fetchProductsFromBackend } from "../../redux/reducers/productSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/reducers/wishlistSlice";
import { addToCart, getAvailableStock } from "../../redux/reducers/cartSlice";
import { isProductUnavailable } from "../../utils/productUtils";
import {
  fetchProductById,
  fetchRelatedProductsByCategory,
} from "../../services/user/productService";
import { getBestOfferForProduct } from "../../services/user/offerService";
import { setSelectedProduct } from "../../redux/reducers/productSlice";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { products } = useSelector((state) => state.products);
  const wishlist = useSelector((state) => state.wishlist.items);
  const {
    availableStock,
    availableStockLoading,
    items: cartItems,
  } = useSelector((state) => state.cart);
  const { user, userAccessToken } = useSelector((state) => state.auth);

  // Local state
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showZoom, setShowZoom] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [productOffer, setProductOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);

  // Check if current product+variant is wishlisted
  const isWishlisted = !!wishlist.find(
    (item) => item.id === product?._id && item.variant === selectedVariant?._id
  );

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      setProductLoading(true);
      setProductError(null);

      // Always fetch from backend for latest data
      const result = await fetchProductById(id);
      console.log("result : ", result);
      if (result.success && result.data) {
        setProduct(result.data);
        dispatch(setSelectedProduct(result.data));
        if (result.data.variants?.length) {
          setSelectedVariant(result.data.variants[0]);
        }
        fetchRelatedProducts(result.data);
        if (user && userAccessToken) {
          dispatch(getAvailableStock(result.data._id));
        }
      } else {
        setProductError("Failed to load product details");
        // Fallback to Redux store if backend fails
        const fallback = products.find((p) => p._id === id);
        if (fallback) {
          setProduct(fallback);
          if (fallback.variants?.length) {
            setSelectedVariant(fallback.variants[0]);
          }
          if (user && userAccessToken) {
            dispatch(getAvailableStock(fallback._id));
          }
        } else {
          return navigate("/products");
        }
      }
      setProductLoading(false);
    };
    if (id) fetchProduct();
  }, [id, products, navigate, dispatch, user, userAccessToken]);

  // Refresh available stock when component mounts or product changes
  useEffect(() => {
    if (
      user &&
      userAccessToken &&
      product?._id &&
      !availableStock[product._id]
    ) {
      dispatch(getAvailableStock(product._id));
    }
  }, [product?._id, availableStock, dispatch, user, userAccessToken]);

  // Refresh available stock when cart changes
  useEffect(() => {
    if (user && userAccessToken && product?._id) {
      dispatch(getAvailableStock(product._id));
    }
  }, [cartItems.length, product?._id, dispatch, user, userAccessToken]);

  // Fetch product offer when product loads
  useEffect(() => {
    if (product?._id) {
      fetchProductOffer(product._id);
    }
  }, [product?._id]);

  // Fetch related products
  const fetchRelatedProducts = async (currentProduct) => {
    try {
      if (currentProduct?.category?._id) {
        const result = await fetchRelatedProductsByCategory({
          categoryId: currentProduct.category._id,
          excludeId: currentProduct._id,
          limit: 4,
        });

        if (result.success) {
          setRelatedProducts(result.data.products || []);
        }
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  // Fetch best offer for product
  const fetchProductOffer = async (productId) => {
    try {
      setOfferLoading(true);
      console.log("Fetching offer for product:", productId);
      const response = await getBestOfferForProduct(productId);
      console.log("Offer response:", response);
      if (response.success && response.data.data) {
        setProductOffer(response.data.data);
        console.log("Offer set:", response.data);
      } else {
        console.log("No offer found for this product");
      }
    } catch (error) {
      console.error("Error fetching product offer:", error);
    } finally {
      setOfferLoading(false);
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
  const handleAddToCart = async () => {
    if (!user || !userAccessToken) {
      Swal.fire({
        title: "Login Required",
        text: "Please log in to add items to your cart.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!product || !selectedVariant) {
      Swal.fire({
        title: "Error",
        text: "Please select a product variant",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (product.blocked || product.unavailable || product.status !== "active") {
      Swal.fire({
        title: "Product Not Available",
        text: "This product is not available for purchase",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (selectedVariant.stock === 0) {
      Swal.fire({
        title: "Out of Stock",
        text: "This variant is currently out of stock",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    const availableStockForVariant = getCurrentStock();
    if (quantity > availableStockForVariant) {
      Swal.fire({
        title: "Insufficient Stock",
        text: `Only ${availableStockForVariant} items available in stock`,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (quantity > 5) {
      Swal.fire({
        title: "Quantity Limit",
        text: "Maximum quantity allowed is 5 items per variant",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      setAddingToCart(true);
      await dispatch(
        addToCart({
          productVariantId: selectedVariant._id,
          quantity: quantity,
        })
      ).unwrap();

      Swal.fire({
        title: "Added to Cart!",
        text: `${quantity} ${
          quantity === 1 ? "item" : "items"
        } added to your cart successfully`,
        icon: "success",
        confirmButtonText: "OK",
      });

      // Reset quantity to 1 after successful addition
      setQuantity(1);
    } catch (error) {
      Swal.fire({
        title: "Failed to Add to Cart",
        text: error || "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // Toggle wishlist handler
  const handleToggleWishlist = () => {
    if (!user || !userAccessToken) {
      Swal.fire({
        title: "Login Required",
        text: "Please log in to use the wishlist feature.",
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }
    if (!product || !selectedVariant) return;
    if (isWishlisted) {
      dispatch(
        removeFromWishlist({ id: product._id, variant: selectedVariant._id })
      );
    } else {
      dispatch(
        addToWishlist({
          id: product._id,
          name: product.name,
          price: selectedVariant.price,
          image:
            (selectedVariant.imageUrls && selectedVariant.imageUrls[0]) ||
            product.mainImage ||
            "",
          variant: selectedVariant._id,
          variantName: selectedVariant.name || "",
        })
      );
    }
  };

  // Coupon application handler
  const handleApplyCoupon = () => {
    setCouponError("");

    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    // Mock coupon validation
    const mockCoupons = [
      { code: "SAVE10", discount: 10 },
      { code: "SAVE20", discount: 20 },
      { code: "WELCOME", discount: 15 },
    ];

    const coupon = mockCoupons.find(
      (c) => c.code.toLowerCase() === couponInput.toLowerCase()
    );

    if (coupon) {
      setActiveCoupon(coupon);
      setCouponInput("");
    } else {
      setCouponError("Invalid coupon code");
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
      return [];
    }

    // Use variantDetails from backend aggregation
    if (product.variantDetails && product.variantDetails.length > 0) {
      return product.variantDetails;
    }

    // Fallback to variants if variantDetails is not available
    if (product.variants && product.variants.length > 0) {
      return product.variants;
    }

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
      return Math.min(...variants.map((v) => v.price));
    }

    // Fallback to product price
    return product.price || 0;
  };

  // Get the current stock based on selected variant or product
  const getCurrentStock = () => {
    if (!product) return 0;

    if (selectedVariant) {
      // Check if we have available stock data for this product
      const productAvailableStock = availableStock[product._id];
      if (productAvailableStock) {
        const variantStock = productAvailableStock.find(
          (v) => String(v.variantId) === String(selectedVariant._id)
        );
        if (variantStock) {
          return variantStock.availableStock;
        }
      }
      // Fallback to original stock if available stock data not loaded yet
      return selectedVariant.stock;
    }

    // If no variant selected, sum all variant stocks
    const variants = getVariants();
    if (variants.length > 0) {
      // Check if we have available stock data for this product
      const productAvailableStock = availableStock[product._id];
      if (productAvailableStock) {
        return productAvailableStock.reduce(
          (sum, v) => sum + v.availableStock,
          0
        );
      }
      // Fallback to original stock if available stock data not loaded yet
      return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }

    // Fallback to product total stock
    return product.totalStock || 0;
  };

  // Get available stock for a specific variant
  const getVariantAvailableStock = (variant) => {
    if (!product || !variant) return 0;

    // Check if we have available stock data for this product
    const productAvailableStock = availableStock[product._id];
    if (productAvailableStock) {
      const variantStock = productAvailableStock.find(
        (v) => String(v.variantId) === String(variant._id)
      );
      if (variantStock) {
        return variantStock.availableStock;
      }
    }
    // Fallback to original stock if available stock data not loaded yet
    return variant.stock || 0;
  };

  // Get total available stock across all variants
  const getTotalAvailableStock = () => {
    if (!product) return 0;

    const variants = getVariants();
    if (variants.length === 0) return 0;

    // Check if we have available stock data for this product
    const productAvailableStock = availableStock[product._id];
    if (productAvailableStock) {
      return productAvailableStock.reduce(
        (sum, v) => sum + v.availableStock,
        0
      );
    }

    // Fallback to original total stock if available stock data not loaded yet
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  // Calculate final price with discount, coupon, and offer
  const getFinalPrice = () => {
    if (!product) return "0.00";

    const basePrice = getCurrentPrice();
    if (!basePrice) return "0.00";

    let finalPrice = basePrice;
    console.log("Base price:", basePrice);

    // Apply product discount
    if (product.discount > 0) {
      finalPrice = finalPrice * (1 - product.discount / 100);
      console.log("After product discount:", finalPrice);
    }

    // Apply coupon discount
    if (activeCoupon) {
      finalPrice = finalPrice * (1 - activeCoupon.discount / 100);
      console.log("After coupon discount:", finalPrice);
    }

    // Apply offer discount
    if (productOffer) {
      const offerDiscount =
        productOffer.discountType === "percentage"
          ? (basePrice * productOffer.discountValue) / 100
          : productOffer.discountValue;

      // Apply maximum discount limit if set
      let finalOfferDiscount = offerDiscount;
      console.log("offerDiscount: ", offerDiscount);
      if (
        productOffer.maximumDiscount &&
        productOffer.discountType === "percentage"
      ) {
        finalOfferDiscount = Math.min(
          offerDiscount,
          productOffer.maximumDiscount
        );
      }

      finalPrice = Math.max(0, finalPrice - finalOfferDiscount);
      console.log("After offer discount:", finalPrice, "Offer:", productOffer);
    }

    return finalPrice.toFixed(2);
  };

  // Get all images from variants, use first as main image
  const getAllImages = () => {
    if (!product) return [];

    // Helper function to construct full image URL
    const getFullImageUrl = (imageUrl) => {
      if (!imageUrl) return null;
      if (imageUrl.startsWith("http")) return imageUrl;
      // If the image is a relative path, prepend backend URL
      return `${
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
      }${imageUrl}`;
    };

    // If product has variantDetails (from backend aggregation), get images from there
    if (product.variantDetails && product.variantDetails.length > 0) {
      // Flatten all imageUrls from all variantDetails
      const allVariantImages = product.variantDetails
        .flatMap((variant) =>
          (variant.imageUrls || []).map((img) => getFullImageUrl(img))
        )
        .filter(Boolean);
      if (allVariantImages.length > 0) {
        return allVariantImages;
      }
    }

    // If product has variants (fallback), get images from variants
    if (product.variants && product.variants.length > 0) {
      // Flatten all imageUrls from all variants
      const allVariantImages = product.variants
        .flatMap((variant) =>
          (variant.imageUrls || []).map((img) => getFullImageUrl(img))
        )
        .filter(Boolean);
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
      productImages.push(
        ...product.otherImages.map((img) => getFullImageUrl(img))
      );
    }

    return productImages.filter(Boolean);
  };

  // Get the selected variant's primary image
  const getSelectedVariantImage = () => {
    if (
      !selectedVariant ||
      !selectedVariant.imageUrls ||
      selectedVariant.imageUrls.length === 0
    ) {
      return null;
    }

    const imageUrl = selectedVariant.imageUrls[0];
    if (!imageUrl) return null;

    if (imageUrl.startsWith("http")) return imageUrl;
    return `${
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    }${imageUrl}`;
  };

  // Get all images with selected variant image prioritized
  const getDisplayImages = () => {
    const selectedVariantImage = getSelectedVariantImage();

    if (
      selectedVariantImage &&
      selectedVariant &&
      selectedVariant.imageUrls &&
      selectedVariant.imageUrls.length > 0
    ) {
      // Return only the selected variant's images
      return selectedVariant.imageUrls
        .map((imageUrl) => {
          if (imageUrl.startsWith("http")) return imageUrl;
          return `${
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
          }${imageUrl}`;
        })
        .filter(Boolean);
    }

    // Fallback to all images if no variant is selected or variant has no images
    const allImages = getAllImages();
    return allImages;
  };

  // 1. Set first variant as selected on product load
  useEffect(() => {
    if (
      product &&
      product.variantDetails &&
      product.variantDetails.length > 0
    ) {
      setSelectedVariant(product.variantDetails[0]);
      setSelectedImage(0); // Reset to show the selected variant's image
    } else if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      setSelectedImage(0); // Reset to show the selected variant's image
    }
  }, [product]);

  // Calculate stock and sold out status only after product is loaded
  const variants = getVariants();
  const currentStock = useMemo(
    () => getCurrentStock(),
    [availableStock, product, selectedVariant]
  );
  const totalAvailableStock = useMemo(
    () => getTotalAvailableStock(),
    [availableStock, product]
  );
  const isSoldOut = currentStock === 0;

  // Get images only when product is available
  const images = getDisplayImages();
  const mainImage = images[0];
  const sideImages = images.slice(1);

  // Memoized variant cards to prevent unnecessary re-renders
  const variantCards = useMemo(() => {
    return variants.map((variant) => {
      const isActive = variant.status === "active";
      const availableStockForVariant = getVariantAvailableStock(variant);
      const isInStock = availableStockForVariant > 0;
      return (
        <div key={variant._id} className="col-12 col-sm-6 col-lg-4 mb-3">
          <div
            className={`card h-100 ${
              isActive && isInStock ? "cursor-pointer" : "opacity-50"
            } ${
              selectedVariant?._id === variant._id
                ? "border-primary"
                : "border-light"
            } shadow-sm rounded-3`}
            onClick={
              isActive && isInStock
                ? () => handleVariantSelect(variant)
                : undefined
            }
            style={{
              cursor: isActive && isInStock ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
            onMouseEnter={
              isActive && isInStock
                ? (e) => (e.currentTarget.style.transform = "translateY(-2px)")
                : undefined
            }
            onMouseLeave={
              isActive && isInStock
                ? (e) => (e.currentTarget.style.transform = "translateY(0)")
                : undefined
            }
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
                    <Badge bg="secondary" className="small mb-1">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-center mb-2">
                <span
                  className="h6 text-primary fw-bold mb-0"
                  style={{ fontSize: "1rem" }}
                >
                  ₹{variant.price}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
                <small
                  className={`${
                    availableStockForVariant > 0
                      ? "text-success"
                      : "text-danger"
                  } fw-semibold`}
                  style={{ fontSize: "0.95rem" }}
                >
                  {availableStockForVariant > 0
                    ? `${availableStockForVariant} in stock`
                    : "Out of stock"}
                </small>
                {availableStockForVariant === 0 && (
                  <Badge bg="danger" className="small mb-1">
                    Sold Out
                  </Badge>
                )}
              </div>
              {/* Variant Images (if available) */}
              {variant.imageUrls && variant.imageUrls.length > 0 && (
                <div className="mt-2 text-center">
                  <img
                    src={
                      variant.imageUrls[0].startsWith("http")
                        ? variant.imageUrls[0]
                        : `${
                            import.meta.env.VITE_BACKEND_URL ||
                            "http://localhost:5000"
                          }${variant.imageUrls[0]}`
                    }
                    alt={`${variant.colour} ${variant.capacity}`}
                    className="img-fluid rounded mx-auto d-block"
                    style={{
                      height: "60px",
                      objectFit: "cover",
                      width: "100%",
                      maxWidth: 100,
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  }, [variants, availableStock, selectedVariant, handleVariantSelect]);

  // Related products (same category, not self, max 4)
  const getRelatedProducts = () => {
    if (!product || !product.category) return [];

    return products
      .filter(
        (p) => p._id !== product._id && p.category?._id === product.category._id
      )
      .slice(0, 4);
  };

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
          <Button
            variant="outline-danger"
            onClick={() => navigate("/products")}
          >
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
          <Button
            variant="outline-warning"
            onClick={() => navigate("/products")}
          >
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item
          onClick={() => navigate("/products")}
          style={{ cursor: "pointer" }}
        >
          Products
        </Breadcrumb.Item>
        {product.category && (
          <Breadcrumb.Item
            onClick={() =>
              navigate(`/products?category=${product.category._id}`)
            }
            style={{ cursor: "pointer" }}
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
            <Col
              xs={3}
              sm={2}
              className="d-flex flex-column justify-content-center align-items-center gap-2"
              style={{
                minHeight: 400,
                background: "#f8f9fa",
                borderRadius: "8px 0 0 8px",
                border: "1px solid #e9ecef",
                borderRight: 0,
              }}
            >
              {images.map((img, idx) => (
                <RBImage
                  key={`all-image-${idx}`}
                  src={img || "/placeholder.svg"}
                  alt={`thumb-${idx}`}
                  thumbnail
                  style={{
                    cursor: "pointer",
                    border:
                      selectedImage === idx ? "2px solid #0d6efd" : "none",
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    boxShadow:
                      selectedImage === idx ? "0 0 0 2px #0d6efd" : undefined,
                  }}
                  onClick={() => setSelectedImage(idx)}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg";
                  }}
                />
              ))}
            </Col>
            <Col xs={9} sm={10}>
              <div
                style={{
                  position: "relative",
                  cursor: "zoom-in",
                  overflow: "hidden",
                  borderRadius: "0 8px 8px 0",
                  border: "1px solid #e9ecef",
                  borderLeft: 0,
                }}
                onClick={() => setShowZoom(true)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              >
                <RBImage
                  src={images[selectedImage] || mainImage || "/placeholder.svg"}
                  alt={product.name}
                  fluid
                  style={{ height: 400, objectFit: "cover", borderRadius: 8 }}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg";
                  }}
                />

                {/* Zoom Overlay */}
                {isZoomed && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundImage: `url(${
                        images[selectedImage] || mainImage || "/placeholder.svg"
                      })`,
                      backgroundSize: "300%",
                      backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                      backgroundRepeat: "no-repeat",
                      borderRadius: 8,
                      pointerEvents: "none",
                      zIndex: 10,
                    }}
                  />
                )}

                {product.isNew && (
                  <Badge
                    bg="primary"
                    className="position-absolute top-0 start-0 m-3"
                  >
                    New
                  </Badge>
                )}
                {isSoldOut && (
                  <Badge
                    bg="danger"
                    className="position-absolute top-0 end-0 m-3"
                  >
                    Sold Out
                  </Badge>
                )}
                {product.discount > 0 && (
                  <Badge
                    bg="warning"
                    text="dark"
                    className="position-absolute top-0 end-0 m-3"
                  >
                    -{product.discount}%
                  </Badge>
                )}
                <div className="position-absolute bottom-0 end-0 m-3">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowZoom(true);
                    }}
                  >
                    <FaSearchPlus />
                  </Button>
                </div>
              </div>

              {/* Zoom Modal */}
              <Modal
                show={showZoom}
                onHide={() => setShowZoom(false)}
                centered
                size="lg"
              >
                <Modal.Header closeButton>
                  <Modal.Title>{product.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                  <RBImage
                    src={
                      images[selectedImage] || mainImage || "/placeholder.svg"
                    }
                    alt={product.name}
                    fluid
                    style={{
                      width: "100%",
                      objectFit: "contain",
                      background: "#f8f9fa",
                    }}
                    onError={(e) => {
                      console.log(
                        "Zoom modal image failed to load:",
                        e.target.src
                      );
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                </Modal.Body>
              </Modal>
            </Col>
          </Row>

          {/* Variant Selection - moved here below images */}
          {(() => {
            return (
              variants.length > 0 && (
                <div className="mb-4 mt-4">
                  <h5 className="mb-3">Select Variant</h5>
                  {/* Mini Variant Display */}
                  <div className="row g-5 mb-3">{variantCards}</div>
                  {/* Selected Variant Details */}
                  {selectedVariant && (
                    <div className="alert alert-info">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Selected:</strong> {selectedVariant.colour}{" "}
                          {selectedVariant.capacity} - ₹{selectedVariant.price}
                          <br />
                          <small className="text-muted">
                            Stock: {getVariantAvailableStock(selectedVariant)}{" "}
                            units
                          </small>
                        </div>
                        <div className="d-flex gap-2">
                          {selectedVariant.colour && (
                            <Badge bg="light" text="dark">
                              {selectedVariant.colour}
                            </Badge>
                          )}
                          {selectedVariant.capacity && (
                            <Badge bg="light" text="dark">
                              {selectedVariant.capacity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            );
          })()}
        </Col>

        {/* Product Info */}
        <Col md={6}>
          <h1 className="h2 mb-2">{product.name}</h1>
          {product.category && (
            <div className="mb-2">
              <span className="badge bg-secondary small">
                {product.category.name || product.category}
              </span>
            </div>
          )}

          {/* Ratings and Reviews */}
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="d-flex align-items-center">
              {[...Array(5)].map((_, index) => (
                <FaStar
                  key={`main-product-star-${index}`}
                  className={
                    index < Math.floor(product.rating || 4.5)
                      ? "text-warning"
                      : "text-muted"
                  }
                  size={16}
                />
              ))}
              <span className="ms-2 text-muted">
                ({product.reviews || 128} reviews)
              </span>
            </div>
            <Button
              variant="link"
              className="p-0"
              onClick={handleToggleWishlist}
            >
              <Heart
                size={24}
                color={isWishlisted ? "#b91c1c" : "#222"}
                fill={isWishlisted ? "#b91c1c" : "none"}
                strokeWidth={2.8}
                style={{
                  verticalAlign: "middle",
                  filter: isWishlisted
                    ? "drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                    : "none",
                }}
              />
            </Button>
          </div>

          <p className="text-muted mb-3">{product.description}</p>

          {/* Price, Discount, Coupon */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="h3 text-primary fw-bold">
                ₹{getFinalPrice()}
              </span>
              {(productOffer || product.discount > 0 || activeCoupon) &&
                getCurrentPrice() !== getFinalPrice() && (
                  <span className="text-muted text-decoration-line-through ms-2">
                    ₹{getCurrentPrice()}
                  </span>
                )}
              {activeCoupon && (
                <Badge bg="success">
                  <FaCheck className="me-1" />
                  {activeCoupon.code} (-{activeCoupon.discount}%)
                </Badge>
              )}
            </div>

            {/* Offer Display */}
            {offerLoading ? (
              <div className="alert alert-info py-2 px-3 mb-2 small">
                Checking for offers...
              </div>
            ) : productOffer ? (
              <div className="alert alert-success py-2 px-3 mb-2 small d-flex align-items-center gap-2">
                <FaTag className="me-2 text-success" />
                <span>
                  <strong>{productOffer.name}</strong>:{" "}
                  {productOffer.discountType === "percentage"
                    ? `${productOffer.discountValue}% OFF`
                    : `₹${productOffer.discountValue} OFF`}{" "}
                  &nbsp;
                  <span className="text-muted">
                    (Valid till{" "}
                    {new Date(productOffer.validTo).toLocaleDateString("en-GB")}
                    )
                  </span>
                </span>
              </div>
            ) : null}

            {/* Show price range if multiple variants */}
            {(() => {
              if (variants.length > 1) {
                const prices = variants.map((v) => v.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return (
                  minPrice !== maxPrice && (
                    <div className="text-muted small">
                      Price range: ₹{minPrice} - ₹{maxPrice}
                    </div>
                  )
                );
              }
              return null;
            })()}

            {/* Coupon Application */}
            {/*<div className="mb-3">
              <Form
                className="d-flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleApplyCoupon();
                }}
              >
                <Form.Control
                  size="sm"
                  placeholder="Apply coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  style={{ maxWidth: 160 }}
                  disabled={!!activeCoupon}
                />
                <Button
                  size="sm"
                  variant="outline-primary"
                  type="submit"
                  disabled={!!activeCoupon}
                >
                  Apply
                </Button>
                {activeCoupon && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => {
                      setActiveCoupon(null);
                      setCouponInput("");
                    }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </Form>
              {couponError && (
                <div className="text-danger small mt-1">{couponError}</div>
              )}
              {product.coupons &&
                product.coupons.length > 0 &&
                !activeCoupon && (
                  <div className="text-muted small mt-1">
                    Available coupons:{" "}
                    {product.coupons.map((c) => (
                      <Badge key={c.code} bg="info" className="me-1">
                        {c.code}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>*/}
          </div>

          {/* Stock Status */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                className={
                  currentStock === 0
                    ? "text-danger fw-bold"
                    : "text-success fw-bold"
                }
              >
                {currentStock === 0 ? "Sold Out" : `In Stock: ${currentStock}`}
              </span>
              {currentStock <= 5 && currentStock > 0 && (
                <Badge bg="warning" text="dark">
                  Low Stock
                </Badge>
              )}
            </div>

            {/* Show variant-specific stock if variant is selected */}
            {selectedVariant && (
              <div className="text-muted small mb-2">
                <strong>Selected Variant:</strong> {selectedVariant.colour}{" "}
                {selectedVariant.capacity} - {currentStock} available
                {availableStock[product._id] && (
                  <span className="ms-2">
                    (Total: {selectedVariant.stock}, In Cart:{" "}
                    {selectedVariant.stock - currentStock})
                  </span>
                )}
              </div>
            )}

            {/* Show total stock across all variants */}
            {variants.length > 1 && (
              <div className="text-muted small">
                <strong>Total Stock:</strong> {totalAvailableStock} units across{" "}
                {variants.length} variants
                {availableStock[product._id] && (
                  <span className="ms-2">
                    (Original:{" "}
                    {product.totalStock ||
                      variants.reduce((sum, v) => sum + (v.stock || 0), 0)}
                    , Available: {totalAvailableStock})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Product Specs / Highlights */}
          {product.specs && product.specs.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">Product Highlights</h5>
              <div className="bg-light p-3 rounded">
                {product.specs.map((spec, idx) => (
                  <div
                    key={`spec-${idx}`}
                    className="d-flex justify-content-between mb-2"
                  >
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
                  disabled={
                    isSoldOut || quantity === currentStock || quantity >= 5
                  }
                >
                  <FaPlus />
                </Button>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="px-4"
                onClick={handleAddToCart}
                disabled={isSoldOut || addingToCart || !selectedVariant}
              >
                {addingToCart ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="me-2" />
                    {isSoldOut ? "Sold Out" : "Add to Cart"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Delivery, Returns, Security */}
          <div className="border-top pt-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <FaTruck className="text-primary fs-4" />
              <div>
                <h6 className="mb-1">Free Shipping</h6>
                <p className="text-muted small mb-0">On orders over ₹100</p>
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
              if (
                !relImage &&
                rel.variantDetails &&
                rel.variantDetails.length > 0 &&
                rel.variantDetails[0].imageUrls &&
                rel.variantDetails[0].imageUrls.length > 0
              ) {
                relImage = rel.variantDetails[0].imageUrls[0];
              }
              if (
                !relImage &&
                rel.variants &&
                rel.variants.length > 0 &&
                rel.variants[0].imageUrls &&
                rel.variants[0].imageUrls.length > 0
              ) {
                relImage = rel.variants[0].imageUrls[0];
              }
              if (relImage && !relImage.startsWith("http")) {
                relImage = `${
                  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
                }${relImage}`;
              }
              if (!relImage) {
                relImage = "/placeholder.svg";
              }
              // Price logic
              let relPrice = "N/A";
              if (rel.variants && rel.variants.length > 0) {
                relPrice = Math.min(...rel.variants.map((v) => v.price));
              } else if (rel.variantDetails && rel.variantDetails.length > 0) {
                relPrice = Math.min(...rel.variantDetails.map((v) => v.price));
              } else if (rel.price) {
                relPrice = rel.price;
              }
              return (
                <Col key={rel._id} xs={12} sm={6} md={3}>
                  <Card
                    className="h-100 border-0 shadow-sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/products/${rel._id}`)}
                  >
                    <div className="position-relative">
                      <Card.Img
                        src={relImage}
                        alt={rel.name}
                        style={{ height: 200, objectFit: "cover" }}
                      />
                      {/* Wishlist Icon for Related Products */}
                      {(() => {
                        const variant =
                          rel.variantDetails && rel.variantDetails.length > 0
                            ? rel.variantDetails[0]
                            : rel.variants && rel.variants.length > 0
                            ? rel.variants[0]
                            : null;
                        const variantId = variant?._id || variant?.id;
                        const isWishlisted = variantId
                          ? wishlist.some(
                              (item) =>
                                item.id === rel._id &&
                                item.variant === variantId
                            )
                          : false;

                        return (
                          <Button
                            variant="light"
                            size="sm"
                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              top: "8px",
                              right: "8px",
                              width: "30px",
                              height: "30px",
                              padding: 0,
                              border: "none",
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              zIndex: 10,
                              transition: "all 0.2s ease",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (variantId) {
                                if (isWishlisted) {
                                  dispatch(
                                    removeFromWishlist({
                                      id: rel._id,
                                      variant: variantId,
                                    })
                                  );
                                } else {
                                  dispatch(
                                    addToWishlist({
                                      id: rel._id,
                                      name: rel.name,
                                      price: variant.price || relPrice,
                                      image: relImage,
                                      variant: variantId,
                                      variantName: variant
                                        ? `${variant.colour || ""} - ${
                                            variant.capacity || ""
                                          }`.trim()
                                        : "",
                                    })
                                  );
                                }
                              }
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.1)";
                              e.currentTarget.style.backgroundColor =
                                "rgba(255, 255, 255, 1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.backgroundColor =
                                "rgba(255, 255, 255, 0.95)";
                            }}
                          >
                            <Heart
                              size={20}
                              color={isWishlisted ? "#b91c1c" : "#555"}
                              fill={isWishlisted ? "#b91c1c" : "none"}
                              strokeWidth={4}
                            />
                          </Button>
                        );
                      })()}
                    </div>
                    <Card.Body>
                      <Card.Title className="h6 mb-2">{rel.name}</Card.Title>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {rel.discount > 0 && (
                          <Badge key={`${rel._id}-discount`} bg="danger">
                            -{rel.discount}%
                          </Badge>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <FaStar
                            key={`${rel._id}-star-${idx}`}
                            className={
                              idx < Math.floor(rel.rating || 4.5)
                                ? "text-warning"
                                : "text-muted"
                            }
                            size={12}
                          />
                        ))}
                        <span className="ms-1 text-muted small">
                          ({rel.reviews || 45})
                        </span>
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
