import React, { useEffect, useState } from "react";
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
  Spinner,
} from "react-bootstrap";
import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaSignOutAlt,
  FaHeart,
} from "react-icons/fa";
import { logoutUser } from "../services/user/authService";
import {
  addToWishlist,
  removeFromWishlist,
} from "../redux/reducers/wishlistSlice";
import { fetchCategories as fetchCategoriesApi } from "../services/user/productService";
import userAxios from "../lib/userAxios";
import { toast } from "react-toastify";
import { addToCart } from "../redux/reducers/cartSlice";
import { fetchBrandOptions } from "../services/user/productService";
import { TOAST_AUTO_CLOSE } from "../utils/toastConfig";

const Index = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlist = useSelector((state) => state.wishlist.items);

  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // State for range of products by brand
  const [brandProducts, setBrandProducts] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // State for new launches
  const [newLaunches, setNewLaunches] = useState([]);
  const [loadingNewLaunches, setLoadingNewLaunches] = useState(true);

  // State for hand picked products
  const [handPicked, setHandPicked] = useState([]);
  const [loadingHandPicked, setLoadingHandPicked] = useState(true);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    // Fetch latest 4 categories and the first product from each
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const catRes = await fetchCategoriesApi();
        let categories =
          catRes?.data?.categories || catRes?.categories || catRes?.data || [];
        console.log("Fetched categories:", categories);
        // Fallback: use last 4 categories if createdAt is missing
        if (categories.length > 0) {
          // If createdAt exists, sort by it, else just take last 4
          if (categories[0].createdAt) {
            categories = categories
              .filter((cat) => cat.status !== "deleted")
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 4);
          } else {
            categories = categories.slice(-4);
          }
        }
        console.log("Categories used for featured:", categories);
        // For each category, fetch the first product
        const productPromises = categories.map((cat) =>
          userAxios
            .get("/products", { params: { category: cat._id, limit: 1 } })
            .then((res) => {
              const prod = res.data.products?.[0] || null;
              console.log("Fetched product for category", cat.name, prod);
              return { product: prod, category: cat };
            })
            .catch((err) => {
              console.log("Error fetching product for category", cat.name, err);
              return { product: null, category: cat };
            })
        );
        const results = await Promise.all(productPromises);
        setFeaturedProducts(results);
        console.log("Featured products:", results);
      } catch (err) {
        setFeaturedProducts([]);
        console.log("Error in fetchFeatured:", err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    // Fetch 4 brands and the first product from each
    const fetchBrandSection = async () => {
      setLoadingBrands(true);
      try {
        const brandRes = await fetchBrandOptions();
        let brands = brandRes?.data?.brands || brandRes?.brands || [];
        brands = brands.slice(0, 4);
        const productPromises = brands.map((brand) =>
          userAxios
            .get("/products", { params: { brand, limit: 1 } })
            .then((res) => ({ product: res.data.products?.[0] || null, brand }))
            .catch(() => ({ product: null, brand }))
        );
        const results = await Promise.all(productPromises);
        setBrandProducts(results);
      } catch (err) {
        setBrandProducts([]);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrandSection();
  }, []);

  useEffect(() => {
    // Fetch latest 6 products for New Launches
    const fetchNewLaunches = async () => {
      setLoadingNewLaunches(true);
      try {
        const res = await userAxios.get("/products", {
          params: { sort: "createdAt", order: "desc", limit: 6 },
        });
        setNewLaunches(res.data.products || []);
      } catch (err) {
        setNewLaunches([]);
      } finally {
        setLoadingNewLaunches(false);
      }
    };
    fetchNewLaunches();
  }, []);

  useEffect(() => {
    // Fetch 4 products sorted by colour for Hand Picked
    const fetchHandPicked = async () => {
      setLoadingHandPicked(true);
      try {
        // Assuming the backend supports sort by 'variantDetails.colour' or similar
        const res = await userAxios.get("/products", {
          params: { sort: "variantDetails.colour", order: "asc", limit: 4 },
        });
        setHandPicked(res.data.products || []);
      } catch (err) {
        setHandPicked([]);
      } finally {
        setLoadingHandPicked(false);
      }
    };
    fetchHandPicked();
  }, []);

  const handleLogout = async () => {
    const response = await logoutUser();
    if (response.success) {
      dispatch(logoutAction());
      navigate("/");
    } else {
      // Optional: show error to user
      console.error("Logout failed:", response.error);
    }
  };

  // Helper for consistent image URL logic
  const getImageUrl = (img, product) => {
    const variantImg =
      product.variantDetails &&
      product.variantDetails.length > 0 &&
      product.variantDetails[0].imageUrls &&
      product.variantDetails[0].imageUrls.length > 0
        ? product.variantDetails[0].imageUrls[0]
        : null;
    let finalImg = variantImg || img;
    if (!finalImg) return "https://via.placeholder.com/300x300?text=No+Image";
    if (finalImg.startsWith("http")) return finalImg;
    return `${
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
    }${finalImg}`;
  };

  const handleToggleWishlist = (product, e) => {
    e.stopPropagation();
    const variant =
      product.variantDetails && product.variantDetails.length > 0
        ? product.variantDetails[0]
        : null;
    const variantId = variant?._id || variant?.id;
    const productId = product._id || product.id;
    if (!variantId) {
      toast.error(
        "This product does not have a valid variant to add to wishlist.",
        { autoClose: TOAST_AUTO_CLOSE }
      );
      return;
    }
    const isWishlisted = wishlist.some(
      (item) => item.id === productId && item.variant === variantId
    );
    if (isWishlisted) {
      dispatch(removeFromWishlist({ id: productId, variant: variantId }));
      toast.success("Removed from wishlist!", { autoClose: TOAST_AUTO_CLOSE });
    } else {
      dispatch(
        addToWishlist({
          id: productId,
          name: product.name,
          price: variant?.price || product.price,
          image: getImageUrl(product.mainImage, product),
          variant: variantId,
          variantName: variant
            ? `${variant.colour || ""} - ${variant.capacity || ""}`.trim()
            : "",
        })
      );
      toast.success("Added to wishlist!", { autoClose: TOAST_AUTO_CLOSE });
    }
  };

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    const variant =
      product.variantDetails && product.variantDetails.length > 0
        ? product.variantDetails[0]
        : null;
    const variantId = variant?._id || variant?.id;
    if (!variantId) {
      toast.error("This product does not have a valid variant to add to cart.", { autoClose: TOAST_AUTO_CLOSE });
      return;
    }
    try {
      await dispatch(
        addToCart({ productVariantId: variantId, quantity: 1 })
      ).unwrap();
      toast.success(`${product.name} has been added to your cart!`, { autoClose: TOAST_AUTO_CLOSE });
    } catch (err) {
      let errorMsg = "Failed to add to cart.";
      if (err && typeof err === "object" && err.error) errorMsg = err.error;
      else if (typeof err === "string") errorMsg = err;
      if (
        errorMsg.toLowerCase().includes("stock") ||
        errorMsg.toLowerCase().includes("sold")
      ) {
        toast.error(errorMsg, { autoClose: TOAST_AUTO_CLOSE });
      } else {
        toast.error(errorMsg, { autoClose: TOAST_AUTO_CLOSE });
      }
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} >
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
            <Col lg={4} className="d-none d-lg-block">
              <img
                src="/home4.png"
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
        {loadingFeatured ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ width: 60, height: 60 }}
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Row xs={1} md={2} lg={4} className="g-4">
            {featuredProducts.length > 0 &&
            featuredProducts.some((fp) => fp.product)
              ? featuredProducts.map((fp, i) => {
                  const { product, category } = fp;
                  if (!product) return null;
                  // Prefer variant only if it exists and has price/image
                  const variant =
                    (product.variants &&
                      product.variants.length > 0 &&
                      product.variants[0]) ||
                    (product.variantDetails &&
                      product.variantDetails.length > 0 &&
                      product.variantDetails[0]) ||
                    null;
                  // Robust image selection with backend URL prepend for relative paths
                  let image = getImageUrl(product.mainImage, product);
                  // Robust price selection
                  const price =
                    (variant && variant.price) ||
                    (product.variantDetails &&
                      product.variantDetails.length > 0 &&
                      product.variantDetails[0].price) ||
                    product.price ||
                    "--";
                  // Wishlist logic
                  const isWishlisted = (() => {
                    const variant =
                      product.variantDetails &&
                      product.variantDetails.length > 0
                        ? product.variantDetails[0]
                        : null;
                    const variantId = variant?._id || variant?.id;
                    const productId = product._id || product.id;
                    return variantId
                      ? wishlist.some(
                          (item) =>
                            item.id === productId && item.variant === variantId
                        )
                      : false;
                  })();
                  return (
                    <Col key={product._id || i}>
                      <Card
                        className="h-100 shadow-sm hover-shadow"
                        onClick={() => navigate(`/products/${product._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className="position-relative d-flex justify-content-center align-items-center"
                          style={{
                            background: "#fff",
                            padding: "12px",
                            height: "224px",
                          }}
                        >
                          <Card.Img
                            variant="top"
                            src={image}
                            alt={product.name}
                            className="object-fit-contain"
                            style={{
                              height: "200px",
                              width: "100%",
                              objectFit: "contain",
                              background: "transparent",
                            }}
                          />
                          {/* Wishlist Icon */}
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
                              handleToggleWishlist(product, e);
                            }}
                            aria-label={
                              isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                          >
                            <FaHeart
                              className={isWishlisted ? "text-danger" : ""}
                              style={{
                                color: isWishlisted ? undefined : "#555",
                                filter: !isWishlisted
                                  ? "drop-shadow(0 1px 2px rgba(0,0,0,0.10))"
                                  : "none",
                              }}
                              size={20}
                              fill={isWishlisted ? "#dc3545" : "none"}
                              stroke="#dc3545"
                              strokeWidth={4}
                            />
                          </Button>
                        </div>
                        <Card.Body>
                          <Card.Title className="h6">{product.name}</Card.Title>
                          <Card.Text className="text-muted small">
                            {category?.name ||
                              product.category?.name ||
                              product.category ||
                              "-"}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="h5 mb-0">₹{price}</span>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              : // Fallback placeholders if no products
                [1, 2, 3, 4].map((i) => (
                  <Col key={`placeholder-${i}`}>
                    <Card className="h-100 shadow-sm hover-shadow">
                      <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                          background: "#fff",
                          padding: "12px",
                          height: "224px",
                        }}
                      >
                        <Card.Img
                          variant="top"
                          src={`https://via.placeholder.com/300x300?text=No+Image`}
                          alt={`Placeholder Product ${i}`}
                          className="object-fit-contain"
                          style={{
                            height: "200px",
                            width: "100%",
                            objectFit: "contain",
                            background: "transparent",
                          }}
                        />
                      </div>
                      <Card.Body>
                        <Card.Title className="h6">Product Name</Card.Title>
                        <Card.Text className="text-muted small">
                          Category
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 mb-0">₹--</span>
                          <Button variant="outline-primary" size="sm" disabled>
                            Add to Cart
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
          </Row>
        )}
      </Container>

      {/* View Our Range Of Products Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">View Our Range Of Products</h2>
        {loadingBrands ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ width: 60, height: 60 }}
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
            {brandProducts.length > 0 && brandProducts.some((bp) => bp.product)
              ? brandProducts.map((bp, i) => {
                  const { product, brand } = bp;
                  if (!product) return null;
                  const variant =
                    product.variantDetails && product.variantDetails.length > 0
                      ? product.variantDetails[0]
                      : null;
                  const image = getImageUrl(product.mainImage, product);
                  const price =
                    (variant && variant.price) ||
                    (product.variantDetails &&
                      product.variantDetails.length > 0 &&
                      product.variantDetails[0].price) ||
                    product.price ||
                    "--";
                  return (
                    <Col
                      key={product._id || i}
                      className="d-flex justify-content-center"
                    >
                      <Card
                        className="h-100 shadow-sm"
                        style={{
                          width: "100%",
                          maxWidth: 250,
                          position: "relative",
                        }}
                      >
                        <div
                          className="position-relative d-flex justify-content-center align-items-center"
                          style={{
                            background: "#fff",
                            padding: "12px",
                            height: "224px",
                          }}
                        >
                          <Card.Img
                            variant="top"
                            src={image}
                            alt={product.name}
                            className="object-fit-contain"
                            style={{
                              height: "200px",
                              width: "100%",
                              objectFit: "contain",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/products/${product._id || product.id}`)
                            }
                          />
                          {/* Wishlist Icon */}
                          {(() => {
                            const variantId = variant?._id || variant?.id;
                            const productId = product._id || product.id;
                            const isWishlisted = variantId
                              ? wishlist.some(
                                  (item) =>
                                    item.id === productId &&
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
                                onClick={(e) =>
                                  handleToggleWishlist(product, e)
                                }
                                aria-label={
                                  isWishlisted
                                    ? "Remove from wishlist"
                                    : "Add to wishlist"
                                }
                              >
                                <FaHeart
                                  className={isWishlisted ? "text-danger" : ""}
                                  style={{
                                    color: isWishlisted ? undefined : "#555",
                                    filter: !isWishlisted
                                      ? "drop-shadow(0 1px 2px rgba(0,0,0,0.10))"
                                      : "none",
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
                        <Card.Body className="text-center">
                          <Card.Title
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/products/${product._id || product.id}`)
                            }
                          >
                            {product.name.length > 35
                              ? product.name.slice(0, 35) + "..."
                              : product.name}
                          </Card.Title>
                          <Card.Text className="text-muted small">
                            {brand}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="h5 mb-0">₹{price}</span>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              : [1, 2, 3, 4].map((i) => (
                  <Col
                    key={`brand-placeholder-${i}`}
                    className="d-flex justify-content-center"
                  >
                    <Card
                      className="h-100 shadow-sm"
                      style={{ width: "100%", maxWidth: 250 }}
                    >
                      <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                          background: "#fff",
                          padding: "12px",
                          height: "224px",
                        }}
                      >
                        <Card.Img
                          variant="top"
                          src={`https://via.placeholder.com/300x300?text=No+Image`}
                          alt={`Placeholder Product ${i}`}
                          className="object-fit-contain"
                          style={{
                            height: "200px",
                            width: "100%",
                            objectFit: "contain",
                            background: "transparent",
                          }}
                        />
                      </div>
                      <Card.Body className="text-center">
                        <Card.Title>Product Name</Card.Title>
                        <Card.Text className="text-muted small">
                          Brand
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 mb-0">₹--</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
          </Row>
        )}
      </Container>

      {/* New Launches Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">New Launches</h2>
        {loadingNewLaunches ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ width: 60, height: 60 }}
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Row
            xs={2}
            sm={2}
            md={3}
            lg={3}
            className="g-4 justify-content-center"
          >
            {newLaunches.length > 0
              ? newLaunches.map((product, i) => {
                  const variant =
                    product.variantDetails && product.variantDetails.length > 0
                      ? product.variantDetails[0]
                      : null;
                  const image = getImageUrl(product.mainImage, product);
                  const price =
                    (variant && variant.price) ||
                    (product.variantDetails &&
                      product.variantDetails.length > 0 &&
                      product.variantDetails[0].price) ||
                    product.price ||
                    "--";
                  const variantId = variant?._id || variant?.id;
                  const productId = product._id || product.id;
                  const isWishlisted = variantId
                    ? wishlist.some(
                        (item) =>
                          item.id === productId && item.variant === variantId
                      )
                    : false;
                  return (
                    <Col
                      key={product._id || i}
                      className="d-flex justify-content-center"
                    >
                      <Card
                        className="h-100 shadow-sm"
                        style={{
                          width: "100%",
                          maxWidth: 220,
                          position: "relative",
                        }}
                      >
                        <div
                          className="position-relative d-flex justify-content-center align-items-center"
                          style={{
                            background: "#fff",
                            padding: "12px",
                            height: "200px",
                          }}
                        >
                          <Card.Img
                            variant="top"
                            src={image}
                            alt={product.name}
                            className="object-fit-contain"
                            style={{
                              height: "180px",
                              width: "100%",
                              objectFit: "contain",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/products/${product._id || product.id}`)
                            }
                          />
                          {/* Wishlist Icon */}
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
                            onClick={(e) => handleToggleWishlist(product, e)}
                            aria-label={
                              isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                          >
                            <FaHeart
                              className={isWishlisted ? "text-danger" : ""}
                              style={{
                                color: isWishlisted ? undefined : "#555",
                                filter: !isWishlisted
                                  ? "drop-shadow(0 1px 2px rgba(0,0,0,0.10))"
                                  : "none",
                              }}
                              size={20}
                              fill={isWishlisted ? "#dc3545" : "none"}
                              stroke="#dc3545"
                              strokeWidth={4}
                            />
                          </Button>
                        </div>
                        <Card.Body className="text-center">
                          <Card.Title
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/products/${product._id || product.id}`)
                            }
                          >
                            {product.name.length > 35
                              ? product.name.slice(0, 35) + "..."
                              : product.name}
                          </Card.Title>
                          <Card.Text className="text-muted small">
                            Just Launched
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="h5 mb-0">₹{price}</span>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              : [1, 2, 3, 4, 5, 6].map((i) => (
                  <Col
                    key={`new-launch-placeholder-${i}`}
                    className="d-flex justify-content-center"
                  >
                    <Card
                      className="h-100 shadow-sm"
                      style={{ width: "100%", maxWidth: 220 }}
                    >
                      <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                          background: "#fff",
                          padding: "12px",
                          height: "200px",
                        }}
                      >
                        <Card.Img
                          variant="top"
                          src={`https://via.placeholder.com/300x300?text=No+Image`}
                          alt={`New Launch Product ${i}`}
                          className="object-fit-contain"
                          style={{
                            height: "180px",
                            width: "100%",
                            objectFit: "contain",
                            background: "transparent",
                          }}
                        />
                      </div>
                      <Card.Body className="text-center">
                        <Card.Title>New Product</Card.Title>
                        <Card.Text className="text-muted small">
                          Just Launched
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 mb-0">₹--</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
          </Row>
        )}
      </Container>

      {/* Hand Picked Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Hand Picked</h2>
        {loadingHandPicked ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ width: 60, height: 60 }}
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Row xs={1} md={2} lg={4} className="g-4 justify-content-center">
            {handPicked.length > 0
              ? handPicked.map((product, i) => {
                  const variant =
                    product.variantDetails && product.variantDetails.length > 0
                      ? product.variantDetails[0]
                      : null;
                  const image = getImageUrl(product.mainImage, product);
                  const price =
                    (variant && variant.price) ||
                    (product.variantDetails &&
                      product.variantDetails.length > 0 &&
                      product.variantDetails[0].price) ||
                    product.price ||
                    "--";
                  const colour = variant?.colour || variant?.color || "-";
                  const variantId = variant?._id || variant?.id;
                  const productId = product._id || product.id;
                  const isWishlisted = variantId
                    ? wishlist.some(
                        (item) =>
                          item.id === productId && item.variant === variantId
                      )
                    : false;
                  return (
                    <Col
                      key={product._id || i}
                      className="d-flex justify-content-center"
                    >
                      <Card
                        className="h-100 shadow-sm"
                        style={{
                          width: "100%",
                          maxWidth: 250,
                          position: "relative",
                        }}
                      >
                        <div
                          className="position-relative d-flex justify-content-center align-items-center"
                          style={{
                            background: "#fff",
                            padding: "12px",
                            height: "224px",
                          }}
                        >
                          <Card.Img
                            variant="top"
                            src={image}
                            alt={product.name}
                            className="object-fit-contain"
                            style={{
                              height: "200px",
                              width: "100%",
                              objectFit: "contain",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(`/products/${product._id || product.id}`)
                            }
                          />
                          {/* Wishlist Icon */}
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
                            onClick={(e) => handleToggleWishlist(product, e)}
                            aria-label={
                              isWishlisted
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                          >
                            <FaHeart
                              className={isWishlisted ? "text-danger" : ""}
                              style={{
                                color: isWishlisted ? undefined : "#555",
                                filter: !isWishlisted
                                  ? "drop-shadow(0 1px 2px rgba(0,0,0,0.10))"
                                  : "none",
                              }}
                              size={20}
                              fill={isWishlisted ? "#dc3545" : "none"}
                              stroke="#dc3545"
                              strokeWidth={4}
                            />
                          </Button>
                        </div>
                        <Card.Body className="text-center">
                          <Card.Title
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/products/${product._id || product.id}`)
                            }
                          >
                            {product.name.length > 35
                              ? product.name.slice(0, 35) + "..."
                              : product.name}
                          </Card.Title>
                          <Card.Text className="text-muted small">
                            Colour: {colour}
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="h5 mb-0">₹{price}</span>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              : [1, 2, 3, 4].map((i) => (
                  <Col
                    key={`hand-picked-placeholder-${i}`}
                    className="d-flex justify-content-center"
                  >
                    <Card
                      className="h-100 shadow-sm"
                      style={{ width: "100%", maxWidth: 250 }}
                    >
                      <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                          background: "#fff",
                          padding: "12px",
                          height: "224px",
                        }}
                      >
                        <Card.Img
                          variant="top"
                          src={`https://via.placeholder.com/300x300?text=No+Image`}
                          alt={`Hand Picked Product ${i}`}
                          className="object-fit-contain"
                          style={{
                            height: "200px",
                            width: "100%",
                            objectFit: "contain",
                            background: "transparent",
                          }}
                        />
                      </div>
                      <Card.Body className="text-center">
                        <Card.Title>Hand Picked</Card.Title>
                        <Card.Text className="text-muted small">
                          Colour: -
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 mb-0">₹--</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
          </Row>
        )}
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
                  Free shipping on all orders over ₹50
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
