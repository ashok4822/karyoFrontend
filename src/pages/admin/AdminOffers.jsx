import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
  FaGift,
  FaPercent,
  FaUsers,
  FaBox,
  FaTag,
  FaCalendar,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import AdminLeftbar from "../../components/AdminLeftbar";
import Swal from "sweetalert2";
import adminAxios from "../../lib/adminAxios";
import { format } from "date-fns";

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    offerType: "all",
    status: "all",
    search: "",
    targetProduct: "all",
    targetCategory: "all",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    offerType: "product",
    discountType: "percentage",
    discountValue: "",
    products: [],
    category: "",
    referralType: "code",
    minimumAmount: "",
    maximumDiscount: "",
    validFrom: "",
    validTo: "",
    maxUsage: "",
    maxUsagePerUser: "",
    status: "active",
  });

  useEffect(() => {
    fetchOffers();
    fetchProducts();
    fetchCategories();
  }, [filters, pagination.currentPage]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      // Only send basic filters to backend
      const basicFilters = {
        offerType: filters.offerType,
        status: filters.status,
        search: filters.search,
      };

      const filteredParams = Object.fromEntries(
        Object.entries(basicFilters).filter(
          ([key, value]) => value && value !== "all"
        )
      );

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filteredParams,
      });

      const response = await adminAxios.get(`/offers?${params}`);
      let filteredOffers = response.data.data;

      // Apply client-side filtering for target product and category
      if (filters.targetProduct !== "all") {
        filteredOffers = filteredOffers.filter(
          (offer) =>
            offer.offerType === "product" &&
            offer.products &&
            offer.products.some(
              (product) => product._id === filters.targetProduct
            )
        );
      }

      if (filters.targetCategory !== "all") {
        filteredOffers = filteredOffers.filter(
          (offer) =>
            offer.offerType === "category" &&
            offer.category &&
            offer.category._id === filters.targetCategory
        );
      }

      setOffers(filteredOffers);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.pagination.totalItems,
      }));
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to fetch offers",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await adminAxios.get("/products?limit=1000");
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAxios.get("/categories?limit=1000");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateOffer = async () => {
    try {
      const offerData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumAmount: parseFloat(formData.minimumAmount) || 0,
        maximumDiscount: formData.maximumDiscount
          ? parseFloat(formData.maximumDiscount)
          : undefined,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        maxUsagePerUser: formData.maxUsagePerUser
          ? parseInt(formData.maxUsagePerUser)
          : undefined,
        category:
          formData.category && formData.category.trim()
            ? formData.category
            : undefined,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
      };

      await adminAxios.post("/offers", offerData);
      setIsCreateModalOpen(false);
      Swal.fire({
        title: "Success",
        text: "Offer created successfully",
        icon: "success",
        confirmButtonColor: "#28a745",
      });
      fetchOffers();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to create offer",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleUpdateOffer = async () => {
    try {
      const offerData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumAmount: parseFloat(formData.minimumAmount) || 0,
        maximumDiscount: formData.maximumDiscount
          ? parseFloat(formData.maximumDiscount)
          : undefined,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        maxUsagePerUser: formData.maxUsagePerUser
          ? parseInt(formData.maxUsagePerUser)
          : undefined,
        category:
          formData.category && formData.category.trim()
            ? formData.category
            : undefined,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
      };

      await adminAxios.put(`/offers/${selectedOffer._id}`, offerData);
      setIsEditModalOpen(false);
      Swal.fire({
        title: "Success",
        text: "Offer updated successfully",
        icon: "success",
        confirmButtonColor: "#28a745",
      });
      fetchOffers();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to update offer",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleDeleteOffer = async (offerId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await adminAxios.delete(`/offers/${offerId}`);
        Swal.fire({
          title: "Deleted!",
          text: "Offer has been deleted.",
          icon: "success",
          confirmButtonColor: "#28a745",
        });
        fetchOffers();
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Failed to delete offer",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const handleToggleStatus = async (offerId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await adminAxios.patch(`/offers/${offerId}/status`, {
        status: newStatus,
      });
      Swal.fire({
        title: "Success",
        text: `Offer ${newStatus}`,
        icon: "success",
        confirmButtonColor: "#28a745",
      });
      fetchOffers();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to update offer status",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      offerType: "product",
      discountType: "percentage",
      discountValue: "",
      products: [],
      category: "",
      referralType: "code",
      minimumAmount: "",
      maximumDiscount: "",
      validFrom: "",
      validTo: "",
      maxUsage: "",
      maxUsagePerUser: "",
      status: "active",
    });
    setSelectedOffer(null);
  };

  const openEditModal = (offer) => {
    setSelectedOffer(offer);
    setFormData({
      name: offer.name,
      description: offer.description,
      offerType: offer.offerType,
      discountType: offer.discountType,
      discountValue: offer.discountValue.toString(),
      products: offer.products
        ? offer.products.map((p) => (typeof p === "object" ? p._id : p))
        : [],
      category: offer.category?._id || "",
      referralType: offer.referralType || "code",
      minimumAmount: offer.minimumAmount ? offer.minimumAmount.toString() : "",
      maximumDiscount: offer.maximumDiscount
        ? offer.maximumDiscount.toString()
        : "",
      validFrom: new Date(offer.validFrom).toISOString().slice(0, 16),
      validTo: new Date(offer.validTo).toISOString().slice(0, 16),
      maxUsage: offer.maxUsage ? offer.maxUsage.toString() : "",
      maxUsagePerUser: offer.maxUsagePerUser
        ? offer.maxUsagePerUser.toString()
        : "",
      status: offer.status,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (offer) => {
    setSelectedOffer(offer);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (offer) => {
    if (isOfferExpired(offer) && (offer.status === "active" || offer.status === "inactive")) {
      return <Badge bg="danger" title="This offer has expired but status hasn't been updated yet">expired*</Badge>;
    }
    const variants = {
      active: "success",
      inactive: "secondary",
      expired: "danger",
    };
    return <Badge bg={variants[offer.status] || "secondary"}>{offer.status}</Badge>;
  };

  const getOfferTypeBadge = (type) => {
    const variants = {
      product: "info",
      category: "warning",
      referral: "secondary",
    };
    return <Badge bg={variants[type] || "secondary"}>{type}</Badge>;
  };

  const getOfferTypeIcon = (type) => {
    switch (type) {
      case "product":
        return <FaBox />;
      case "category":
        return <FaTag />;
      case "referral":
        return <FaUsers />;
      default:
        return <FaTag />;
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  const isOfferExpired = (offer) => new Date(offer.validTo) < new Date();

  return (
    <Container fluid className="py-5">
      <Row>
        <Col xs={12} md={3} lg={2} className="p-0">
          <AdminLeftbar />
        </Col>
        <Col xs={12} md={9} lg={10}>
          <Container className="py-5">
            <Row className="mb-4">
              <Col>
                <h2 className="mb-0">Offers Management</h2>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}
                  className="d-flex align-items-center gap-2"
                >
                  <FaPlus /> Add New Offer
                </Button>
              </Col>
            </Row>

            {/* Stats Overview */}
            <Row className="g-4 mb-4">
              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Total Offers</h6>
                        <h3 className="mb-0">{pagination.totalItems}</h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 p-3 rounded">
                        <FaGift className="text-primary" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Active Offers</h6>
                        <h3 className="mb-0 text-success">
                          {offers.filter((o) => o.status === "active").length}
                        </h3>
                      </div>
                      <div className="bg-success bg-opacity-10 p-3 rounded">
                        <FaCheckCircle className="text-success" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Product Offers</h6>
                        <h3 className="mb-0 text-info">
                          {
                            offers.filter((o) => o.offerType === "product")
                              .length
                          }
                        </h3>
                      </div>
                      <div className="bg-info bg-opacity-10 p-3 rounded">
                        <FaBox className="text-info" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Category Offers</h6>
                        <h3 className="mb-0 text-warning">
                          {
                            offers.filter((o) => o.offerType === "category")
                              .length
                          }
                        </h3>
                      </div>
                      <div className="bg-warning bg-opacity-10 p-3 rounded">
                        <FaTag className="text-warning" size={24} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Search Offers</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="Search by name or description..."
                          value={filters.search}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              search: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Offer Type</Form.Label>
                      <Form.Select
                        value={filters.offerType}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            offerType: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All types</option>
                        <option value="product">Product</option>
                        <option value="category">Category</option>
                        <option value="referral">Referral</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Target Product</Form.Label>
                      <Form.Select
                        value={filters.targetProduct}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            targetProduct: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All products</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product?.name || 'Product Name Not Available'}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Target Category</Form.Label>
                      <Form.Select
                        value={filters.targetCategory}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            targetCategory: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All categories</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category?.name || 'Category Name Not Available'}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setFilters({
                          offerType: "all",
                          status: "all",
                          search: "",
                          targetProduct: "all",
                          targetCategory: "all",
                        })
                      }
                    >
                      Clear All Filters
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Offers List */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3 text-muted">Loading offers...</p>
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Offers ({offers.length})</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Eligible Target</th>
                          <th>Discount</th>
                          <th>Valid Period</th>
                          <th>Status</th>
                          <th>Usage</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center text-muted py-4"
                            >
                              <div>
                                <FaGift
                                  className="mb-2"
                                  style={{ fontSize: "2rem" }}
                                />
                                <p>No offers found.</p>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    resetForm();
                                    setIsCreateModalOpen(true);
                                  }}
                                >
                                  Create your first offer
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          offers.map((offer) => (
                            <tr key={offer._id}>
                              <td>
                                <div>
                                  <strong>{offer.name}</strong>
                                  {offer.description && (
                                    <div className="text-muted small">
                                      {offer.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Badge
                                  bg={
                                    offer.offerType === "product"
                                      ? "info"
                                      : offer.offerType === "category"
                                      ? "warning"
                                      : "secondary"
                                  }
                                >
                                  {offer.offerType}
                                </Badge>
                              </td>
                              <td>
                                {offer.offerType === "product" &&
                                offer.products &&
                                offer.products.length > 0 ? (
                                  <div>
                                    <div className="fw-bold text-primary">
                                      {offer.products.length} Product
                                      {offer.products.length > 1 ? "s" : ""}
                                    </div>
                                    <div className="small text-muted">
                                      {offer.products
                                        .slice(0, 2)
                                        .map((product) => product?.name || 'Product Name Not Available')
                                        .join(", ")}
                                      {offer.products.length > 2 &&
                                        ` +${offer.products.length - 2} more`}
                                    </div>
                                  </div>
                                ) : offer.offerType === "category" &&
                                  offer.category ? (
                                  <div>
                                    <div className="fw-bold text-warning">
                                      {offer.category?.name || 'Category Name Not Available'}
                                    </div>
                                    {offer.category.description && (
                                      <div className="small text-muted">
                                        {offer.category.description}
                                      </div>
                                    )}
                                  </div>
                                ) : offer.offerType === "referral" ? (
                                  <div>
                                    <div className="fw-bold text-secondary">
                                      Referral{" "}
                                      {offer.referralType === "code"
                                        ? "Code"
                                        : "Token"}
                                    </div>
                                    <div className="small text-muted">
                                      User Registration
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                {offer.discountType === "percentage"
                                  ? `${offer.discountValue}%`
                                  : `₹${offer.discountValue}`}
                              </td>
                              <td>
                                <div>
                                  <div>From: {formatDate(offer.validFrom)}</div>
                                  <div>To: {formatDate(offer.validTo)}</div>
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(offer)}
                              </td>
                              <td>
                                {offer.usageCount || 0}
                                {offer.maxUsage && ` / ${offer.maxUsage}`}
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => openViewModal(offer)}
                                    title="View Offer Details"
                                  >
                                    <FaSearch />
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => openEditModal(offer)}
                                    title="Edit Offer"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleStatus(
                                        offer._id,
                                        offer.status
                                      )
                                    }
                                    title={
                                      offer.status === "active"
                                        ? "Deactivate"
                                        : "Activate"
                                    }
                                  >
                                    {offer.status === "active"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteOffer(offer._id)}
                                    title="Delete Offer"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <div className="d-flex align-items-center gap-3">
                  <Button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: prev.currentPage - 1,
                      }))
                    }
                    disabled={pagination.currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-muted">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: prev.currentPage + 1,
                      }))
                    }
                    disabled={pagination.currentPage === pagination.totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Container>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal
        show={isCreateModalOpen}
        onHide={() => setIsCreateModalOpen(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
        onExited={() => {
          resetForm();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OfferForm
            formData={formData}
            setFormData={setFormData}
            products={products}
            categories={categories}
            onSubmit={handleCreateOffer}
            submitText="Create Offer"
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={isEditModalOpen}
        onHide={() => setIsEditModalOpen(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
        onExited={() => {
          resetForm();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OfferForm
            formData={formData}
            setFormData={setFormData}
            products={products}
            categories={categories}
            onSubmit={handleUpdateOffer}
            submitText="Update Offer"
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal.Body>
      </Modal>

      {/* View Modal */}
      <Modal
        show={isViewModalOpen}
        onHide={() => setIsViewModalOpen(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Offer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOffer && <OfferDetails offer={selectedOffer} />}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// OfferForm component
const OfferForm = ({
  formData,
  setFormData,
  products,
  categories,
  onSubmit,
  submitText,
  onCancel,
}) => {
  const [formErrors, setFormErrors] = React.useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    const discountValue = parseFloat(formData.discountValue);
    const minimumAmount = parseFloat(formData.minimumAmount);
    const maximumDiscount = formData.maximumDiscount !== '' ? parseFloat(formData.maximumDiscount) : undefined;
    const discountType = formData.discountType;

    if (!formData.name.trim()) errors.name = 'Offer name is required';
    if (!formData.discountValue || isNaN(discountValue) || discountValue <= 0) errors.discountValue = 'Discount value must be greater than 0';
    if (!formData.validFrom) errors.validFrom = 'Valid from date is required';
    if (!formData.validTo) errors.validTo = 'Valid to date is required';
    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) >= new Date(formData.validTo)) errors.validTo = 'Valid to date must be after valid from date';
    if (minimumAmount && discountValue >= minimumAmount) errors.discountValue = 'Discount value must be less than minimum amount';

    if (discountType === 'percentage') {
      if (discountValue < 0 || discountValue > 100) errors.discountValue = 'Percentage discount must be between 0 and 100';
      if (maximumDiscount === undefined || isNaN(maximumDiscount)) errors.maximumDiscount = 'Maximum discount is required for percentage offers';
      else {
        if (maximumDiscount <= discountValue) errors.maximumDiscount = 'Maximum discount must be greater than discount value';
        if (minimumAmount && maximumDiscount >= minimumAmount) errors.maximumDiscount = 'Maximum discount must be less than minimum amount';
      }
    }
    if (discountType === 'fixed') {
      if (maximumDiscount !== undefined && !isNaN(maximumDiscount)) {
        if (maximumDiscount < discountValue) errors.maximumDiscount = 'Maximum discount cannot be less than discount value';
        if (minimumAmount && maximumDiscount >= minimumAmount) errors.maximumDiscount = 'Maximum discount must be less than minimum amount';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      // Show error alert (optional: use toast or modal)
      window.Swal && window.Swal.fire({
        title: 'Validation Error',
        text: Object.values(formErrors).join('\n'),
        icon: 'warning',
        confirmButtonColor: '#dc3545',
      });
      return;
    }
    onSubmit();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Offer Name *</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              isInvalid={!!formErrors.name}
            />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Offer Type *</Form.Label>
            <Form.Select
              value={formData.offerType}
              onChange={(e) => handleInputChange("offerType", e.target.value)}
            >
              <option value="product">Product Offer</option>
              <option value="category">Category Offer</option>
              <option value="referral">Referral Offer</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Discount Type *</Form.Label>
            <Form.Select
              value={formData.discountType}
              onChange={(e) =>
                handleInputChange("discountType", e.target.value)
              }
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Discount Value *</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={formData.discountValue}
              onChange={(e) =>
                handleInputChange("discountValue", e.target.value)
              }
              isInvalid={!!formErrors.discountValue}
            />
            <Form.Control.Feedback type="invalid">{formErrors.discountValue}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {formData.offerType === "product" && (
        <Form.Group className="mb-3">
          <Form.Label>Select Products *</Form.Label>
          <Form.Select
            multiple
            value={formData.products}
            onChange={(e) => {
              const selectedOptions = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              handleInputChange("products", selectedOptions);
            }}
          >
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product?.name || 'Product Name Not Available'}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}

      {formData.offerType === "category" && (
        <Form.Group className="mb-3">
          <Form.Label>Select Category *</Form.Label>
          <Form.Select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category?.name || 'Category Name Not Available'}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Valid From *</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.validFrom}
              onChange={(e) => handleInputChange("validFrom", e.target.value)}
              isInvalid={!!formErrors.validFrom}
            />
            <Form.Control.Feedback type="invalid">{formErrors.validFrom}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Valid To *</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.validTo}
              onChange={(e) => handleInputChange("validTo", e.target.value)}
              isInvalid={!!formErrors.validTo}
            />
            <Form.Control.Feedback type="invalid">{formErrors.validTo}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Minimum Amount</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={formData.minimumAmount}
              onChange={(e) =>
                handleInputChange("minimumAmount", e.target.value)
              }
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          {formData.discountType === 'percentage' && (
            <Form.Group className="mb-3">
              <Form.Label>Maximum Discount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={formData.maximumDiscount}
                onChange={(e) =>
                  handleInputChange("maximumDiscount", e.target.value)
                }
                isInvalid={!!formErrors.maximumDiscount}
              />
              <Form.Control.Feedback type="invalid">{formErrors.maximumDiscount}</Form.Control.Feedback>
            </Form.Group>
          )}
          {formData.discountType === 'fixed' && (
            <Form.Group className="mb-3">
              <Form.Label>Maximum Discount</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={formData.maximumDiscount}
                onChange={(e) =>
                  handleInputChange("maximumDiscount", e.target.value)
                }
                isInvalid={!!formErrors.maximumDiscount}
              />
              <Form.Control.Feedback type="invalid">{formErrors.maximumDiscount}</Form.Control.Feedback>
            </Form.Group>
          )}
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Max Usage</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.maxUsage}
              onChange={(e) => handleInputChange("maxUsage", e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Max Usage Per User</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.maxUsagePerUser}
              onChange={(e) =>
                handleInputChange("maxUsagePerUser", e.target.value)
              }
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Status</Form.Label>
        <Form.Select
          value={formData.status}
          onChange={(e) => handleInputChange("status", e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Form.Select>
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="secondary"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {submitText}
        </Button>
      </div>
    </Form>
  );
};

// OfferDetails component
const OfferDetails = ({ offer }) => {
  const getStatusBadge = (status) => {
    const variants = {
      active: "success",
      inactive: "secondary",
      expired: "danger",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getOfferTypeBadge = (type) => {
    const variants = {
      product: "info",
      category: "warning",
      referral: "secondary",
    };
    return <Badge bg={variants[type] || "secondary"}>{type}</Badge>;
  };

  const getOfferTypeIcon = (type) => {
    switch (type) {
      case "product":
        return <FaBox />;
      case "category":
        return <FaTag />;
      case "referral":
        return <FaUsers />;
      default:
        return <FaTag />;
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  const isExpired = () => {
    return new Date(offer.validTo) < new Date();
  };

  const isActive = () => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validTo = new Date(offer.validTo);
    return now >= validFrom && now <= validTo && offer.status === "active";
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="p-3 bg-primary bg-opacity-10 rounded">
          {getOfferTypeIcon(offer.offerType)}
        </div>
        <div>
          <h4 className="mb-1">{offer.name}</h4>
          <div className="d-flex gap-2">
            {getStatusBadge(offer.status)}
            {getOfferTypeBadge(offer.offerType)}
            {isExpired() && <Badge bg="danger">Expired</Badge>}
            {isActive() && <Badge bg="success">Currently Active</Badge>}
          </div>
        </div>
      </div>

      {/* Description */}
      {offer.description && (
        <Card className="mb-4">
          <Card.Body>
            <h6>Description</h6>
            <p className="mb-0">{offer.description}</p>
          </Card.Body>
        </Card>
      )}

      {/* Basic Details */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <h6>Discount Details</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>Type:</span>
                <strong>
                  {offer.discountType === "percentage"
                    ? "Percentage"
                    : "Fixed Amount"}
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Value:</span>
                <strong className="text-primary">
                  {offer.discountType === "percentage"
                    ? `${offer.discountValue}%`
                    : `₹${offer.discountValue}`}
                </strong>
              </div>
              {offer.minimumAmount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span>Minimum Amount:</span>
                  <strong>₹{offer.minimumAmount}</strong>
                </div>
              )}
              {offer.maximumDiscount && (
                <div className="d-flex justify-content-between">
                  <span>Maximum Discount:</span>
                  <strong>₹{offer.maximumDiscount}</strong>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <h6>Validity Period</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>From:</span>
                <strong>{formatDate(offer.validFrom)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>To:</span>
                <strong>{formatDate(offer.validTo)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Duration:</span>
                <strong>
                  {Math.ceil(
                    (new Date(offer.validTo) - new Date(offer.validFrom)) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Usage Details */}
      <Card className="mb-4">
        <Card.Body>
          <h6>Usage Details</h6>
          <Row>
            <Col md={6}>
              <div className="d-flex justify-content-between mb-2">
                <span>Current Usage:</span>
                <strong>{offer.usageCount || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Max Usage:</span>
                <strong>{offer.maxUsage ? offer.maxUsage : "Unlimited"}</strong>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-between mb-2">
                <span>Max Per User:</span>
                <strong>
                  {offer.maxUsagePerUser ? offer.maxUsagePerUser : "Unlimited"}
                </strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Remaining:</span>
                <strong className="text-success">
                  {offer.maxUsage
                    ? offer.maxUsage - (offer.usageCount || 0)
                    : "Unlimited"}
                </strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Offer Specific Details */}
      {offer.offerType === "product" &&
        offer.products &&
        offer.products.length > 0 && (
          <Card className="mb-4">
            <Card.Body>
              <h6>Eligible Products</h6>
              <div className="row">
                {offer.products.map((product) => (
                  <div key={product._id} className="col-md-6 mb-2">
                    <div className="d-flex align-items-center gap-2 p-2 bg-light rounded">
                      <FaBox className="text-primary" />
                      <span>{product?.name || 'Product Name Not Available'}</span>
                      {product?.price && (
                        <Badge bg="secondary" className="ms-auto">
                          ₹{product.price}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

      {offer.offerType === "category" && offer.category && (
        <Card className="mb-4">
          <Card.Body>
            <h6>Eligible Category</h6>
            <div className="d-flex align-items-center gap-2 p-3 bg-light rounded">
              <FaTag className="text-warning" />
              <span className="fw-bold">{offer.category?.name || 'Category Name Not Available'}</span>
              {offer.category.description && (
                <span className="text-muted ms-2">
                  ({offer.category.description})
                </span>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {offer.offerType === "referral" && (
        <Card className="mb-4">
          <Card.Body>
            <h6>Referral Details</h6>
            <div className="d-flex justify-content-between mb-2">
              <span>Referral Type:</span>
              <strong>
                {offer.referralType === "code"
                  ? "Referral Code"
                  : "Referral Token"}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Discount Applied:</span>
              <strong className="text-primary">
                {offer.discountType === "percentage"
                  ? `${offer.discountValue}%`
                  : `₹${offer.discountValue}`}
              </strong>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <Card.Body>
          <h6>Offer Statistics</h6>
          <Row>
            <Col md={4}>
              <div className="text-center">
                <div className="h4 text-primary mb-1">
                  {offer.usageCount || 0}
                </div>
                <div className="text-muted small">Total Uses</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="h4 text-success mb-1">
                  {offer.maxUsage
                    ? Math.round(
                        ((offer.usageCount || 0) / offer.maxUsage) * 100
                      )
                    : 0}
                  %
                </div>
                <div className="text-muted small">Usage Rate</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="h4 text-info mb-1">
                  {isActive() ? "Active" : isExpired() ? "Expired" : "Inactive"}
                </div>
                <div className="text-muted small">Current Status</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminOffers;
