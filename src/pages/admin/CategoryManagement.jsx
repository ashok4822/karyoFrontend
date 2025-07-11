import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Modal,
  OverlayTrigger,
  Tooltip,
  Pagination,
  ButtonGroup,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaMinusCircle,
  FaTimesCircle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
  FaList,
  FaTrashAlt,
} from "react-icons/fa";
import AdminLeftbar from "../../components/AdminLeftbar";
import Swal from "sweetalert2";
import {
  createCategory,
  getCategories,
  restoreCategory,
  updateCategory,
} from "../../services/admin/adminCategoryService";

// Memoized components to prevent unnecessary re-renders
const StatusBadge = React.memo(({ status }) => {
  const variants = {
    active: "success",
    inactive: "secondary",
    deleted: "danger",
  };

  const getIcon = () => {
    switch (status) {
      case "active":
        return <FaCheckCircle className="me-1 text-success" />;
      case "inactive":
        return <FaMinusCircle className="me-1 text-secondary" />;
      default:
        return <FaTimesCircle className="me-1 text-danger" />;
    }
  };

  return (
    <Badge
      pill
      bg={variants[status] || "secondary"}
      className="d-flex align-items-center justify-content-center gap-1"
    >
      {getIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
});

const ActionButton = React.memo(
  ({ icon, tooltip, onClick, variant, disabled }) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
      <span>
        <Button
          variant={variant}
          size="sm"
          className="me-2"
          onClick={onClick}
          disabled={disabled}
          style={{ minWidth: 36 }}
        >
          {icon}
        </Button>
      </span>
    </OverlayTrigger>
  )
);

const CategoryRow = React.memo(
  ({
    category,
    index,
    currentPage,
    categoriesPerPage,
    isDeleted,
    onEdit,
    onDelete,
    onRestore,
    modalLoading,
  }) => {
    const formatDateTime = useCallback((dateString) => {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    }, []);

    return (
      <tr className={isDeleted ? "table-danger" : "category-row"}>
        <td>{(currentPage - 1) * categoriesPerPage + index + 1}</td>
        <td>{category.name}</td>
        <td className="text-center">
          <StatusBadge status={category.status} />
        </td>
        <td className="text-center">{formatDateTime(category.createdAt)}</td>
        <td className="text-center">
          {!isDeleted ? (
            <>
              <ActionButton
                icon={<FaEdit />}
                tooltip="Edit"
                onClick={() => onEdit(category)}
                variant="outline-primary"
                disabled={modalLoading}
              />
              <ActionButton
                icon={<FaTrash />}
                tooltip="Delete"
                onClick={() => onDelete(category)}
                variant="outline-danger"
                disabled={modalLoading}
              />
            </>
          ) : (
            <ActionButton
              icon={<FaUndo />}
              tooltip="Restore"
              onClick={() => onRestore(category._id, category.name)}
              variant="outline-success"
              disabled={modalLoading}
            />
          )}
        </td>
      </tr>
    );
  }
);

const CategoryTable = React.memo(
  ({
    categories,
    title,
    isDeleted,
    total,
    currentPage,
    onEdit,
    onDelete,
    onRestore,
    modalLoading,
    onAddCategory,
  }) => {
    const sortIcon = useMemo(
      () => (
        <span className="d-flex align-items-center justify-content-center gap-1">
          Created At
          <Button
            variant="link"
            size="sm"
            className="p-0 ms-1"
            style={{ lineHeight: 1 }}
            tabIndex={-1}
          >
            <FaSortDown />
          </Button>
        </span>
      ),
      []
    );

    return (
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header
          className={isDeleted ? "bg-danger text-white" : "bg-light"}
        >
          <h5 className="mb-0">
            {title} ({total})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover striped className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Name</th>
                <th className="text-center">Status</th>
                <th className="text-center">{sortIcon}</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    <div className="mb-2">
                      <FaExclamationTriangle
                        size={32}
                        className="text-warning mb-2"
                      />
                    </div>
                    <div>No {title.toLowerCase()} found.</div>
                    {!isDeleted && (
                      <Button
                        variant="primary"
                        className="mt-3"
                        onClick={onAddCategory}
                      >
                        <FaPlus className="me-1" /> Add Category
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                categories.map((category, idx) => (
                  <CategoryRow
                    key={category._id}
                    category={category}
                    index={idx}
                    currentPage={currentPage}
                    categoriesPerPage={5}
                    isDeleted={isDeleted}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    modalLoading={modalLoading}
                  />
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  }
);

const CategoryManagement = () => {
  const [activeCategories, setActiveCategories] = useState([]);
  const [inactiveCategories, setInactiveCategories] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", status: "active" });
  const [errors, setErrors] = useState({});
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [inactiveCurrentPage, setInactiveCurrentPage] = useState(1);
  const [deletedCurrentPage, setDeletedCurrentPage] = useState(1);
  const [activeTotalPages, setActiveTotalPages] = useState(1);
  const [inactiveTotalPages, setInactiveTotalPages] = useState(1);
  const [deletedTotalPages, setDeletedTotalPages] = useState(1);
  const [activeTotal, setActiveTotal] = useState(0);
  const [inactiveTotal, setInactiveTotal] = useState(0);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentView, setCurrentView] = useState("active"); // 'active', 'inactive', 'deleted'
  const categoriesPerPage = 5;
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const fetchActiveCategories = useCallback(
    async (page = 1, search = "", sort = sortOrder) => {
      setLoading(true);
      setError("");
      const result = await getCategories({
        page,
        limit: categoriesPerPage,
        search,
        sort,
      });

      if (result.success) {
        setActiveCategories(result.data.categories);
        setActiveTotalPages(result.data.totalPages);
        setActiveTotal(result.data.total);
        setActiveCurrentPage(result.data.page);
      } else {
        setError(result.error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.error || "Failed to fetch active categories",
          confirmButtonColor: "#d33",
        });
      }
      setLoading(false);
    },
    [sortOrder, categoriesPerPage]
  );

  const fetchInactiveCategories = useCallback(
    async (page = 1, search = "", sort = sortOrder) => {
      setLoading(true);
      setError("");
      const result = await getCategories({
        page,
        limit: categoriesPerPage,
        search,
        sort,
        status: "inactive", // 👈 Key difference
      });

      if (result.success) {
        setInactiveCategories(result.data.categories);
        setInactiveTotalPages(result.data.totalPages);
        setInactiveTotal(result.data.total);
        setInactiveCurrentPage(result.data.page);
      } else {
        const errorMessage =
          result.error || "Failed to fetch inactive categories";

        setError(errorMessage);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#d33",
        });
      }
      setLoading(false);
    },
    [sortOrder, categoriesPerPage]
  );

  const fetchDeletedCategories = useCallback(
    async (page = 1, search = "", sort = sortOrder) => {
      setLoading(true);
      setError("");

      const result = await getCategories({
        page,
        limit: categoriesPerPage,
        search,
        sort,
        status: "deleted",
      });

      if (result.success) {
        setDeletedCategories(result.data.categories);
        setDeletedTotalPages(result.data.totalPages);
        setDeletedTotal(result.data.total);
        setDeletedCurrentPage(result.data.page);
      } else {
        const errorMessage =
          result.error || "Failed to fetch deleted categories";

        setError(errorMessage);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#d33",
        });
      }
      setLoading(false);
    },
    [sortOrder, categoriesPerPage]
  );

  // Initial load
  useEffect(() => {
    if (currentView === "active") {
      fetchActiveCategories(1, "", sortOrder);
    } else if (currentView === "inactive") {
      fetchInactiveCategories(1, "", sortOrder);
    } else if (currentView === "deleted") {
      fetchDeletedCategories(1, "", sortOrder);
    }
  }, [
    currentView,
    fetchActiveCategories,
    fetchInactiveCategories,
    fetchDeletedCategories,
  ]);

  // Handle pagination changes
  useEffect(() => {
    if (currentView === "active") {
      fetchActiveCategories(activeCurrentPage, searchTerm, sortOrder);
    } else if (currentView === "inactive") {
      fetchInactiveCategories(inactiveCurrentPage, searchTerm, sortOrder);
    } else if (currentView === "deleted") {
      fetchDeletedCategories(deletedCurrentPage, searchTerm, sortOrder);
    }
  }, [
    activeCurrentPage,
    inactiveCurrentPage,
    deletedCurrentPage,
    fetchActiveCategories,
    fetchInactiveCategories,
    fetchDeletedCategories,
  ]);

  // Handle sort changes
  useEffect(() => {
    if (currentView === "active") {
      fetchActiveCategories(activeCurrentPage, searchTerm, sortOrder);
    } else if (currentView === "inactive") {
      fetchInactiveCategories(inactiveCurrentPage, searchTerm, sortOrder);
    } else if (currentView === "deleted") {
      fetchDeletedCategories(deletedCurrentPage, searchTerm, sortOrder);
    }
  }, [
    sortOrder,
    fetchActiveCategories,
    fetchInactiveCategories,
    fetchDeletedCategories,
  ]);

  const handleSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (currentView === "active") {
          setActiveCurrentPage(1);
          fetchActiveCategories(1, value, sortOrder);
        } else if (currentView === "inactive") {
          setInactiveCurrentPage(1);
          fetchInactiveCategories(1, value, sortOrder);
        } else if (currentView === "deleted") {
          setDeletedCurrentPage(1);
          fetchDeletedCategories(1, value, sortOrder);
        }
      }, 500);
    },
    [
      currentView,
      fetchActiveCategories,
      fetchInactiveCategories,
      fetchDeletedCategories,
      sortOrder,
    ]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (currentView === "active") {
      setActiveCurrentPage(1);
      fetchActiveCategories(1, "", sortOrder);
    } else if (currentView === "inactive") {
      setInactiveCurrentPage(1);
      fetchInactiveCategories(1, "", sortOrder);
    } else if (currentView === "deleted") {
      setDeletedCurrentPage(1);
      fetchDeletedCategories(1, "", sortOrder);
    }
  }, [
    currentView,
    fetchActiveCategories,
    fetchInactiveCategories,
    fetchDeletedCategories,
    sortOrder,
  ]);

  const handleShowModal = useCallback((category = null) => {
    setSelectedCategory(category);
    setFormData(
      category
        ? { name: category.name, status: category.status }
        : { name: "", status: "active" }
    );
    setShowModal(true);
    setErrors({});
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({ name: "", status: "active" });
    setErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      setModalLoading(true);
      setError("");

      try {
        let result;

        if (selectedCategory) {
          result = await updateCategory(selectedCategory._id, formData);
        } else {
          result = await createCategory(formData);
        }

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: selectedCategory
              ? "Category updated successfully"
              : "Category created successfully",
            confirmButtonColor: "#28a745",
          });

          handleCloseModal();

          // Refresh the appropriate view
          if (currentView === "active") {
            fetchActiveCategories(activeCurrentPage, searchTerm, sortOrder);
          } else if (currentView === "inactive") {
            fetchInactiveCategories(inactiveCurrentPage, searchTerm, sortOrder);
          } else if (currentView === "deleted") {
            fetchDeletedCategories(deletedCurrentPage, searchTerm, sortOrder);
          }
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        const errorMessage = error.message || "Error saving category";

        setError(errorMessage);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#d33",
        });
      } finally {
        setModalLoading(false);
      }
    },
    [
      selectedCategory,
      formData,
      validateForm,
      handleCloseModal,
      currentView,
      activeCurrentPage,
      inactiveCurrentPage,
      deletedCurrentPage,
      searchTerm,
      sortOrder,
      fetchActiveCategories,
      fetchInactiveCategories,
      fetchDeletedCategories,
    ]
  );

  const handleDelete = useCallback(
    async (category) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You won't be able to revert this! Category "${category.name}" will be deleted.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      const deleteResult = await deleteCategory(category._id);

      if (deleteResult.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Category has been deleted successfully.",
          confirmButtonColor: "#28a745",
        });

        // Refresh current category view
        if (currentView === "active") {
          fetchActiveCategories(activeCurrentPage, searchTerm, sortOrder);
        } else if (currentView === "inactive") {
          fetchInactiveCategories(inactiveCurrentPage, searchTerm, sortOrder);
        } else if (currentView === "deleted") {
          fetchDeletedCategories(deletedCurrentPage, searchTerm, sortOrder);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: deleteResult.error || "Error deleting category",
          confirmButtonColor: "#d33",
        });
      }
    },
    [
      currentView,
      activeCurrentPage,
      inactiveCurrentPage,
      deletedCurrentPage,
      searchTerm,
      sortOrder,
      fetchActiveCategories,
      fetchInactiveCategories,
      fetchDeletedCategories,
    ]
  );

  const handleRestore = useCallback(
    async (categoryId, categoryName) => {
      const result = await Swal.fire({
        title: "Restore Category?",
        text: `Are you sure you want to restore category "${categoryName}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, restore it!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      const restoreResult = await restoreCategory(categoryId);

      if (restoreResult.success) {
        Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Category has been restored successfully.",
          confirmButtonColor: "#28a745",
        });

        // Refresh current view if it's 'deleted'
        if (currentView === "deleted") {
          fetchDeletedCategories(deletedCurrentPage, searchTerm, sortOrder);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: restoreResult.error || "Error restoring category",
          confirmButtonColor: "#d33",
        });
      }
    },
    [
      currentView,
      deletedCurrentPage,
      searchTerm,
      sortOrder,
      fetchDeletedCategories,
    ]
  );

  const handleSortToggle = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  const handleViewToggle = useCallback(
    (view) => {
      setCurrentView(view);
      setSearchTerm("");
      if (view === "active") {
        setActiveCurrentPage(1);
      } else if (view === "inactive") {
        setInactiveCurrentPage(1);
      } else if (view === "deleted") {
        setDeletedCurrentPage(1);
      }
    },
    [setActiveCurrentPage, setInactiveCurrentPage, setDeletedCurrentPage]
  );

  const renderPagination = useCallback(
    (currentPage, totalPages, onPageChange) => (
      <Pagination className="mb-0">
        <Pagination.First
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
        {[...Array(totalPages)].map((_, idx) => (
          <Pagination.Item
            key={idx + 1}
            active={currentPage === idx + 1}
            onClick={() => onPageChange(idx + 1)}
          >
            {idx + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    ),
    []
  );

  // Memoized values
  const currentCategories = useMemo(
    () =>
      currentView === "active"
        ? activeCategories
        : currentView === "inactive"
        ? inactiveCategories
        : deletedCategories,
    [currentView, activeCategories, inactiveCategories, deletedCategories]
  );

  const currentTotal = useMemo(
    () =>
      currentView === "active"
        ? activeTotal
        : currentView === "inactive"
        ? inactiveTotal
        : deletedTotal,
    [currentView, activeTotal, inactiveTotal, deletedTotal]
  );

  const currentPage = useMemo(
    () =>
      currentView === "active"
        ? activeCurrentPage
        : currentView === "inactive"
        ? inactiveCurrentPage
        : deletedCurrentPage,
    [currentView, activeCurrentPage, inactiveCurrentPage, deletedCurrentPage]
  );

  const currentTotalPages = useMemo(
    () =>
      currentView === "active"
        ? activeTotalPages
        : currentView === "inactive"
        ? inactiveTotalPages
        : deletedTotalPages,
    [currentView, activeTotalPages, inactiveTotalPages, deletedTotalPages]
  );

  const setCurrentPage = useMemo(
    () =>
      currentView === "active"
        ? setActiveCurrentPage
        : currentView === "inactive"
        ? setInactiveCurrentPage
        : setDeletedCurrentPage,
    [currentView]
  );

  if (loading) {
    return (
      <Container fluid className="py-5">
        <Row>
          <Col xs={12} md={3} lg={2} className="p-0">
            <AdminLeftbar />
          </Col>
          <Col xs={12} md={9} lg={10}>
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

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
                <h2 className="mb-0">Categories</h2>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => handleShowModal()}
                  className="d-flex align-items-center gap-2"
                  disabled={currentView !== "active"}
                >
                  <FaPlus /> Add Category
                </Button>
              </Col>
            </Row>

            {/* Toggle Buttons */}
            <Row className="mb-4">
              <Col>
                <ButtonGroup>
                  <Button
                    variant={
                      currentView === "active" ? "primary" : "outline-primary"
                    }
                    onClick={() => handleViewToggle("active")}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaList /> Active Categories ({activeTotal})
                  </Button>
                  <Button
                    variant={
                      currentView === "inactive" ? "primary" : "outline-primary"
                    }
                    onClick={() => handleViewToggle("inactive")}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaList /> Inactive Categories ({inactiveTotal})
                  </Button>
                  <Button
                    variant={
                      currentView === "deleted" ? "danger" : "outline-danger"
                    }
                    onClick={() => handleViewToggle("deleted")}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaTrashAlt /> Deleted Categories ({deletedTotal})
                  </Button>
                </ButtonGroup>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    ref={searchInputRef}
                    type="text"
                    placeholder={`Search ${
                      currentView.charAt(0).toUpperCase() + currentView.slice(1)
                    } categories...`}
                    value={searchTerm}
                    onChange={handleSearch}
                    disabled={loading}
                    autoFocus
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={handleClearSearch}
                      tabIndex={-1}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Col>
            </Row>

            {/* Category Table */}
            <CategoryTable
              categories={currentCategories}
              title={currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              isDeleted={currentView === "deleted"}
              total={currentTotal}
              currentPage={currentPage}
              onEdit={handleShowModal}
              onDelete={handleDelete}
              onRestore={handleRestore}
              modalLoading={modalLoading}
              onAddCategory={() => handleShowModal()}
            />

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Total{" "}
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}{" "}
                Categories: {currentTotal}
              </div>
              {renderPagination(currentPage, currentTotalPages, setCurrentPage)}
            </div>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
              <Modal.Header closeButton>
                <Modal.Title>
                  {selectedCategory ? "Edit Category" : "Add Category"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      isInvalid={!!errors.name}
                      autoFocus
                      disabled={modalLoading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      disabled={modalLoading}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleCloseModal}
                      disabled={modalLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={modalLoading}
                    >
                      {modalLoading ? (
                        <Spinner
                          size="sm"
                          animation="border"
                          className="me-1"
                        />
                      ) : (
                        <FaSave className="me-1" />
                      )}{" "}
                      Save
                    </Button>
                  </div>
                </Form>
              </Modal.Body>
            </Modal>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default CategoryManagement;
