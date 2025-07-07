import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import AdminLeftbar from "../../components/AdminLeftbar";
import AddProductModal from "../../components/AddProductModal";
import EditProductModal from "../../components/EditProductModal";
import ViewProductModal from "../../components/ViewProductModal";
import EditVariantModal from "../../components/EditVariantModal";
import ViewVariantModal from "../../components/ViewVariantModal";
import AddVariantModal from "../../components/AddVariantModal";
import { fetchProductsFromBackend } from "../../redux/reducers/productSlice";
import adminAxios from "../../lib/adminAxios";
import Swal from "sweetalert2";

const ProductManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, loading, error, pagination } = useSelector(
    (state) => state.products
  );
  const [categories, setCategories] = useState([]);
  const [variantOptions, setVariantOptions] = useState({
    colours: [],
    capacities: [],
  });
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [variantColourFilter, setVariantColourFilter] = useState("all");
  const [variantCapacityFilter, setVariantCapacityFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [showViewVariantModal, setShowViewVariantModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories for filter dropdown variants.stock

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await adminAxios.get("/categories?status=active");
        setCategories(data.categories || data);
      } catch (err) {
        setCategories([]);
      }
    };

    const fetchVariantOptions = async () => {
      try {
        const { data } = await adminAxios.get("/products/variant-options");
        setVariantOptions(data);
      } catch (err) {
        setVariantOptions({ colours: [], capacities: [] });
      }
    };

    const fetchBrands = async () => {
      try {
        const { data } = await adminAxios.get("/products/brand-options");
        setBrands(data.brands);
      } catch (err) {
        setBrands([]);
      }
    };

    fetchCategories();
    fetchVariantOptions();
    fetchBrands();
  }, []);

  // Fetch products from backend
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 5,
      search: searchQuery,
      category: categoryFilter !== "all" ? categoryFilter : "",
      status: statusFilter !== "all" ? statusFilter : "",
      brand: brandFilter !== "all" ? brandFilter : "",
      variantColour: variantColourFilter !== "all" ? variantColourFilter : "",
      variantCapacity:
        variantCapacityFilter !== "all" ? variantCapacityFilter : "",
    };

    dispatch(fetchProductsFromBackend(params));
  }, [
    dispatch,
    currentPage,
    searchQuery,
    categoryFilter,
    statusFilter,
    brandFilter,
    variantColourFilter,
    variantCapacityFilter,
  ]);

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await adminAxios.delete(`/products/${id}`);
        Swal.fire("Deleted!", "Product has been deleted.", "success");

        // Refresh products after deletion
        // If we're on the last page and it's the only item, go to previous page
        if (products.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          // Refresh current page
          dispatch(
            fetchProductsFromBackend({
              page: currentPage,
              limit: 5,
              search: searchQuery,
              category: categoryFilter !== "all" ? categoryFilter : "",
              status: statusFilter !== "all" ? statusFilter : "",
              brand: brandFilter !== "all" ? brandFilter : "",
              variantColour:
                variantColourFilter !== "all" ? variantColourFilter : "",
              variantCapacity:
                variantCapacityFilter !== "all" ? variantCapacityFilter : "",
            })
          );
        }
      } catch (error) {
        Swal.fire(
          "Error!",
          error.response?.data?.message || "Failed to delete product",
          "error"
        );
      }
    }
  };

  const handleProductAdded = () => {
    // Refresh products after adding new product
    setCurrentPage(1); // Reset to first page
    dispatch(
      fetchProductsFromBackend({
        page: 1,
        limit: 5,
        search: searchQuery,
        category: categoryFilter !== "all" ? categoryFilter : "",
        status: statusFilter !== "all" ? statusFilter : "",
        brand: brandFilter !== "all" ? brandFilter : "",
        variantColour: variantColourFilter !== "all" ? variantColourFilter : "",
        variantCapacity:
          variantCapacityFilter !== "all" ? variantCapacityFilter : "",
      })
    );
  };

  const handleProductUpdated = () => {
    setCurrentPage(1); // Reset to first page
    dispatch(
      fetchProductsFromBackend({
        page: 1,
        limit: 5,
        search: searchQuery,
        category: categoryFilter !== "all" ? categoryFilter : "",
        status: statusFilter !== "all" ? statusFilter : "",
        brand: brandFilter !== "all" ? brandFilter : "",
        variantColour: variantColourFilter !== "all" ? variantColourFilter : "",
        variantCapacity:
          variantCapacityFilter !== "all" ? variantCapacityFilter : "",
      })
    );
  };

  const handleVariantUpdated = () => {
    setCurrentPage(1); // Reset to first page
    dispatch(
      fetchProductsFromBackend({
        page: 1,
        limit: 5,
        search: searchQuery,
        category: categoryFilter !== "all" ? categoryFilter : "",
        status: statusFilter !== "all" ? statusFilter : "",
        brand: brandFilter !== "all" ? brandFilter : "",
        variantColour: variantColourFilter !== "all" ? variantColourFilter : "",
        variantCapacity:
          variantCapacityFilter !== "all" ? variantCapacityFilter : "",
      })
    );
  };

  const handleViewVariant = (product, variant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant);
    setShowViewVariantModal(true);
  };

  const handleEditVariant = (product, variant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant);
    setShowEditVariantModal(true);
  };

  const handleAddVariant = (product) => {
    setSelectedProduct(product);
    setShowAddVariantModal(true);
  };

  const handleDeleteVariant = async (productId, variantId) => {
    if (!variantId || variantId === "undefined") {
      console.error("Invalid variant ID:", variantId);
      return;
    }

    try {
      const confirmed = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmed.isConfirmed) {
        const response = await adminAxios.delete(
          `/products/${productId}/variants/${variantId}`
        );

        if (response.status === 200) {
          Swal.fire("Deleted!", "Variant has been deleted.", "success");

          // Refresh the product list with current pagination
          dispatch(
            fetchProductsFromBackend({
              page: currentPage,
              limit: 5,
              search: searchQuery,
              category: categoryFilter !== "all" ? categoryFilter : "",
              status: statusFilter !== "all" ? statusFilter : "",
              brand: brandFilter !== "all" ? brandFilter : "",
              variantColour:
                variantColourFilter !== "all" ? variantColourFilter : "",
              variantCapacity:
                variantCapacityFilter !== "all" ? variantCapacityFilter : "",
            })
          );
        }
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      Swal.fire(
        "Error!",
        error.response?.data?.message || "Failed to delete variant",
        "error"
      );
    }
  };

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <span className="badge bg-success">Active</span>
    ) : (
      <span className="badge bg-secondary">Inactive</span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setBrandFilter("all");
    setVariantColourFilter("all");
    setVariantCapacityFilter("all");
    setCurrentPage(1); // Reset to first page
  };

  // Pagination functions
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="d-flex">
      <AdminLeftbar />
      <div className="flex-grow-1 p-4">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Product Management</h2>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          {/* Search and Filters */}
          <div className="row mb-3">
            <div className="col-md-2">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="all">All Brands</option>
                {brands.map((brand, idx) => (
                  <option key={idx} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={variantColourFilter}
                onChange={(e) => setVariantColourFilter(e.target.value)}
              >
                <option value="all">All Colors</option>
                {variantOptions.colours.map((colour, idx) => (
                  <option key={idx} value={colour}>
                    {colour}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={variantCapacityFilter}
                onChange={(e) => setVariantCapacityFilter(e.target.value)}
              >
                <option value="all">All Capacities</option>
                {variantOptions.capacities.map((capacity, idx) => (
                  <option key={idx} value={capacity}>
                    {capacity}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <button
                className="btn btn-outline-secondary mt-2"
                onClick={clearAllFilters}
                title="Clear all filters"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Variants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.category?.name || "N/A"}</td>
                      <td>{product.brand || "N/A"}</td>
                      <td>{getStatusBadge(product.status)}</td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>
                        {(() => {
                          const variants =
                            product.variantDetails &&
                            product.variantDetails.length > 0
                              ? product.variantDetails
                              : product.variants && product.variants.length > 0
                              ? product.variants
                              : [];

                          if (variants.length === 0) {
                            return (
                              <span className="text-muted">No variants</span>
                            );
                          }

                          return variants.map((variant, idx) => {
                            return (
                              <div
                                key={variant._id || idx}
                                className="mb-2 p-2 border rounded"
                                style={{ fontSize: "0.75rem" }}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fw-bold text-primary">
                                    Variant {idx + 1}
                                  </span>
                                  <div
                                    className="btn-group btn-group-sm"
                                    role="group"
                                  >
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() =>
                                        handleViewVariant(product, variant)
                                      }
                                      title="View Variant"
                                      style={{
                                        fontSize: "0.6rem",
                                        padding: "0.1rem 0.3rem",
                                      }}
                                    >
                                      <Eye size={10} />
                                    </button>
                                    <button
                                      className="btn btn-outline-warning btn-sm"
                                      onClick={() =>
                                        handleEditVariant(product, variant)
                                      }
                                      title="Edit Variant"
                                      style={{
                                        fontSize: "0.6rem",
                                        padding: "0.1rem 0.3rem",
                                      }}
                                    >
                                      <Edit size={10} />
                                    </button>
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => {
                                        const variantId =
                                          variant._id || variant.id;
                                        handleDeleteVariant(
                                          product._id,
                                          variantId
                                        );
                                      }}
                                      title="Delete Variant"
                                      style={{
                                        fontSize: "0.6rem",
                                        padding: "0.1rem 0.3rem",
                                      }}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                                <div className="row g-1 mb-1">
                                  <div className="col-3">
                                    <small
                                      className="text-muted d-block"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Clr:
                                    </small>
                                    <span
                                      className="badge bg-light text-dark"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {variant.colour || "N/A"}
                                    </span>
                                  </div>
                                  <div className="col-3">
                                    <small
                                      className="text-muted d-block"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Cap:
                                    </small>
                                    <span
                                      className="badge bg-light text-dark"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {variant.capacity || "N/A"}
                                    </span>
                                  </div>
                                  <div className="col-3">
                                    <small
                                      className="text-muted d-block"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Prc:
                                    </small>
                                    <span
                                      className="badge bg-info text-white"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      ₹{variant.price || 0}
                                    </span>
                                  </div>
                                  <div className="col-3">
                                    <small
                                      className="text-muted d-block"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Stk:
                                    </small>
                                    <span
                                      className={`badge ${
                                        (variant.stock || 0) >= 0
                                          ? "bg-success"
                                          : "bg-danger"
                                      }`}
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {variant.stock || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="row g-1">
                                  <div className="col-6">
                                    <small
                                      className="text-muted d-block"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Status:
                                    </small>
                                    <span
                                      className={`badge ${
                                        variant.status === "active"
                                          ? "bg-success"
                                          : "bg-secondary"
                                      }`}
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {variant.status || "active"}
                                    </span>
                                  </div>
                                  <div className="col-6">
                                    <small
                                      className="text-muted d-block"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Created:
                                    </small>
                                    <span
                                      className="text-muted"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {variant.createdAt
                                        ? formatDate(variant.createdAt)
                                        : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </td>
                      <td className="text-end">
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewProduct(product)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleEditProduct(product)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleAddVariant(product)}
                            title="Add Variant"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteProduct(product._id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {products.length === 0 && !loading && (
                <div className="text-center py-5">
                  <p className="text-muted">No products found</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted">
                Showing {(currentPage - 1) * 5 + 1} to{" "}
                {Math.min(currentPage * 5, pagination.totalProducts)} of{" "}
                {pagination.totalProducts} products
              </div>

              <nav aria-label="Product pagination">
                <ul className="pagination pagination-sm mb-0">
                  {/* Previous Page Button */}
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {/* Page Numbers */}
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, index) => index + 1
                  ).map((pageNumber) => (
                    <li
                      key={pageNumber}
                      className={`page-item ${
                        currentPage === pageNumber ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    </li>
                  ))}

                  {/* Next Page Button */}
                  <li
                    className={`page-item ${
                      currentPage === pagination.totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={handleNextPage}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}

          {/* Add Product Modal */}
          <AddProductModal
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            onProductAdded={handleProductAdded}
            categories={categories}
          />

          {/* Edit Product Modal */}
          <EditProductModal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            onProductUpdated={handleProductUpdated}
            categories={categories}
            product={selectedProduct}
          />

          {/* View Product Modal */}
          <ViewProductModal
            show={showViewModal}
            onHide={() => setShowViewModal(false)}
            product={selectedProduct}
          />

          {/* Edit Variant Modal */}
          <EditVariantModal
            show={showEditVariantModal}
            onHide={() => setShowEditVariantModal(false)}
            onVariantUpdated={handleVariantUpdated}
            variant={selectedVariant}
            product={selectedProduct}
          />

          {/* View Variant Modal */}
          <ViewVariantModal
            show={showViewVariantModal}
            onHide={() => setShowViewVariantModal(false)}
            variant={selectedVariant}
            product={selectedProduct}
          />

          {/* Add Variant Modal */}
          <AddVariantModal
            show={showAddVariantModal}
            onHide={() => setShowAddVariantModal(false)}
            onVariantAdded={handleVariantUpdated}
            product={selectedProduct}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
