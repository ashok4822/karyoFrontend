import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Alert,
  Pagination,
  Dropdown,
  Modal,
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaBox,
  FaTag,
  FaChartLine,
} from 'react-icons/fa';

const AdminProducts = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const productsPerPage = 10;

  useEffect(() => {
    dispatch({ type: 'FETCH_PRODUCTS' });
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleCapacityFilter = (e) => {
    setCapacityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await dispatch({ type: 'DELETE_PRODUCT', payload: selectedProduct.id });
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter
        ? product.category === categoryFilter
        : true;
      const matchesStatus = statusFilter
        ? product.status === statusFilter
        : true;
      const matchesCapacity = capacityFilter
        ? (product.variants && product.variants.some(variant => variant.capacity === capacityFilter)) ||
          (product.variantDetails && product.variantDetails.some(variant => variant.capacity === capacityFilter))
        : true;

      return matchesSearch && matchesCategory && matchesStatus && matchesCapacity;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'price' || sortField === 'stock') {
        return direction * (a[sortField] - b[sortField]);
      }
      return direction * a[sortField].localeCompare(b[sortField]);
    });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      draft: 'warning',
      archived: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
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

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Products</h2>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/products/new')}
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> Add Product
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={categoryFilter}
                onChange={handleCategoryFilter}
                className="d-flex align-items-center gap-2"
              >
                <option value="">All Categories</option>
                {/* Add category options */}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="d-flex align-items-center gap-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={capacityFilter}
                onChange={handleCapacityFilter}
                className="d-flex align-items-center gap-2"
              >
                <option value="">All Capacities</option>
                <option value="64GB">64GB</option>
                <option value="128GB">128GB</option>
                <option value="256GB">256GB</option>
                <option value="512GB">512GB</option>
                <option value="1TB">1TB</option>
                <option value="2TB">2TB</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setCapacityFilter('');
                }}
              >
                <FaFilter /> Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Product
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('sku')}
                >
                  <div className="d-flex align-items-center gap-2">
                    SKU
                    <SortIcon field="sku" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Price
                    <SortIcon field="price" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Stock
                    <SortIcon field="stock" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="rounded me-3"
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <h6 className="mb-0">{product.name}</h6>
                        <small className="text-muted">
                          {product.category}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{product.sku}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>
                    <Badge
                      bg={product.stock > 0 ? 'success' : 'danger'}
                      className="me-2"
                    >
                      {product.stock}
                    </Badge>
                    in stock
                  </td>
                  <td>{getStatusBadge(product.status)}</td>
                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaEye /> View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/products/${product.id}/edit`)
                        }
                        className="d-flex align-items-center gap-1"
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDeleteModal(true);
                        }}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaTrash /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {currentProducts.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No products found</p>
          </div>
        )}

        {totalPages > 1 && (
          <Card.Footer className="bg-transparent border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {indexOfFirstProduct + 1} to{' '}
                {Math.min(indexOfLastProduct, filteredProducts.length)} of{' '}
                {filteredProducts.length} products
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedProduct?.name}? This action
          cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProduct}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminProducts; 