import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import AdminLeftbar from "../../components/AdminLeftbar";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const mockProducts = [
      {
        id: "1",
        name: "Wireless Headphones",
        sku: "WH-001",
        category: "Electronics",
        price: 199.99,
        stock: 45,
        status: "Active",
        featured: true,
        createdAt: "2024-01-15",
        updatedAt: "2024-03-15",
        image: "https://example.com/headphones.jpg",
      },
      {
        id: "2",
        name: "Smart Watch",
        sku: "SW-002",
        category: "Electronics",
        price: 299.99,
        stock: 30,
        status: "Active",
        featured: false,
        createdAt: "2024-02-01",
        updatedAt: "2024-03-14",
        image: "https://example.com/watch.jpg",
      },
      {
        id: "3",
        name: "Running Shoes",
        sku: "RS-003",
        category: "Sports",
        price: 89.99,
        stock: 0,
        status: "Out of Stock",
        featured: true,
        createdAt: "2024-01-20",
        updatedAt: "2024-03-10",
        image: "https://example.com/shoes.jpg",
      },
    ];
    setTimeout(() => {
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleViewProduct = (id) => navigate(`/admin/products/${id}`);
  const handleEditProduct = (id) => navigate(`/admin/products/edit/${id}`);
  const handleDeleteProduct = (id) => console.log("Delete product:", id);

  const getStockColor = (stock) => {
    if (stock === 0) return "text-danger";
    if (stock <= 10) return "text-warning";
    return "text-success";
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: "success",
      "Out of Stock": "danger",
      Draft: "secondary",
    };
    return (
      <span className={`badge bg-${map[status] || "secondary"}`}>{status}</span>
    );
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="row">
        <div className="col-md-3 col-lg-2">
          <AdminLeftbar />
        </div>
        <div className="col-md-9 col-lg-10">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Product Management</h2>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => navigate("/admin/products/new")}
            >
              <Plus size={16} /> Add New Product
            </button>
          </div>

          <div className="card mb-4">
            <div className="card-header fw-bold">Filters</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
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
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Sports">Sports</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-dark mb-3"
                role="status"
              ></div>
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Updated</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="img-thumbnail"
                          style={{ width: "50px" }}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{product.category}</td>
                      <td>${product.price}</td>
                      <td className={getStockColor(product.stock)}>
                        {product.stock}
                      </td>
                      <td>{getStatusBadge(product.status)}</td>
                      <td>
                        {product.featured && (
                          <span className="badge bg-secondary">Featured</span>
                        )}
                      </td>
                      <td>{product.updatedAt}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => handleViewProduct(product.id)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
