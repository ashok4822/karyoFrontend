import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  FaSearch,
  FaFilter,
  FaThLarge,
  FaList,
  FaHeart,
  FaShoppingCart,
  FaStar,
  FaExclamationTriangle,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import ProductSidebar from "../../components/ProductSidebar";
import { fetchProductsFromBackend } from "../../redux/reducers/productSlice";

const ProductListing = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, loading, error, pagination } = useSelector(
    (state) => state.products
  );
  const [view, setView] = useState("grid");
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    rating: "",
    sort: "newest",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchProductsFromBackend({
      page: pagination.currentPage,
      search: searchQuery,
      category: filters.category,
      // Add other filters as needed
    }));
  }, [dispatch, pagination.currentPage, searchQuery, filters.category]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    dispatch(fetchProductsFromBackend({
      page: 1,
      search: searchQuery,
      category: key === 'category' ? value : filters.category,
      // Add other filters as needed
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchProductsFromBackend({
      page: 1,
      search: searchQuery,
      category: filters.category,
      // Add other filters as needed
    }));
  };

  const handlePageChange = (page) => {
    dispatch(fetchProductsFromBackend({
      page,
      search: searchQuery,
      category: filters.category,
      // Add other filters as needed
    }));
  };

  const handleAddToCart = (product) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        productId: product.id,
        quantity: 1,
      },
    });
  };

  const handleAddToWishlist = (product) => {
    dispatch({
      type: "ADD_TO_WISHLIST",
      payload: product.id,
    });
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

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
          <ProductSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </Col>
        <Col lg={9}>
          <Row className="mb-4 align-items-center">
            <Col md={4}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">
                    <FaSearch />
                  </Button>
                </InputGroup>
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
            <Col md={4}>
              <div className="d-flex gap-2">
                {/* <Dropdown>
                  <Dropdown.Toggle variant="outline-primary">
                    <FaFilter className="me-2" />
                    Filter
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Form.Group className="px-3 py-2">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        value={filters.category}
                        onChange={(e) =>
                          handleFilterChange("category", e.target.value)
                        }
                      >
                        <option value="">All Categories</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="books">Books</option>
                      </Form.Select>
                    </Form.Group>
                  </Dropdown.Menu>
                </Dropdown> */}
                {/* <Dropdown>
                  <Dropdown.Toggle variant="outline-primary">
                    <FaSort className="me-2" />
                    Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      active={filters.sort === "newest"}
                      onClick={() => handleFilterChange("sort", "newest")}
                    >
                      <FaSortAmountDown className="me-2" />
                      Newest First
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={filters.sort === "oldest"}
                      onClick={() => handleFilterChange("sort", "oldest")}
                    >
                      <FaSortAmountUp className="me-2" />
                      Oldest First
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown> */}
              </div>
            </Col>
          </Row>

          <Row className={view === "grid" ? "g-4" : "g-3"}>
            {products.map((product) => (
              <Col
                key={product.id}
                xs={12}
                md={view === "grid" ? 6 : 12}
                lg={view === "grid" ? 4 : 12}
              >
                <Card
                  className={`h-100 border-0 shadow-sm ${
                    view === "list" ? "flex-row" : ""
                  } cursor-pointer`}
                  onClick={() => handleProductClick(product.id)}
                  style={{ transition: "transform 0.2s", cursor: "pointer" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "translateY(-5px)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div
                    className={`position-relative ${
                      view === "list" ? "col-md-4" : ""
                    }`}
                    style={{
                      height: view === "list" ? "auto" : "200px",
                    }}
                  >
                    <Card.Img
                      src={product.image}
                      alt={product.name}
                      className="h-100"
                      style={{ objectFit: "cover" }}
                    />
                    {product.isNew && (
                      <Badge
                        bg="primary"
                        className="position-absolute top-0 start-0 m-2"
                      >
                        New
                      </Badge>
                    )}
                  </div>
                  <Card.Body className={view === "list" ? "col-md-8" : ""}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h5 mb-0">
                        {product.name}
                      </Card.Title>
                      <Button
                        variant="link"
                        className="p-0 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWishlist(product);
                        }}
                      >
                        <FaHeart />
                      </Button>
                    </div>
                    <Card.Text className="text-muted small mb-2">
                      {product.description}
                    </Card.Text>
                    <div className="mb-2">
                      {[...Array(5)].map((_, index) => (
                        <FaStar
                          key={index}
                          className={
                            index < Math.floor(product.rating)
                              ? "text-warning"
                              : "text-muted"
                          }
                        />
                      ))}
                      <span className="ms-2 text-muted small">
                        ({product.reviews} reviews)
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="h5 mb-0">${product.price}</span>
                        {product.comparePrice && (
                          <span className="text-muted text-decoration-line-through ms-2">
                            ${product.comparePrice}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <FaShoppingCart className="me-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                />
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={pagination.currentPage === index + 1}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                />
              </Pagination>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductListing;
