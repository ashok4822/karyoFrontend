import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from 'react-bootstrap';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUndo,
} from 'react-icons/fa';
import AdminLeftbar from '../../components/AdminLeftbar';
import {
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  restoreDiscount,
  clearError,
  setFilters,
  clearFilters,
} from '../../redux/reducers/discountSlice';
import Swal from 'sweetalert2';
import debounce from 'lodash.debounce';

const AdminDiscounts = () => {
  const dispatch = useDispatch();
  const { discounts, loading, error, total, page, totalPages } = useSelector((state) => state.discounts);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchInput, setSearchInput] = useState(''); // local input state
  const [searchQuery, setSearchQuery] = useState(''); // debounced value for redux
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [formData, setFormData] = useState({
    code: '', // <-- Add code field
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumAmount: '',
    maximumDiscount: '',
    validFrom: '',
    validTo: '',
    status: 'active',
    maxUsage: '',
    maxUsagePerUser: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Debounce search input
  const debouncedSetSearchQuery = React.useMemo(() => debounce((val) => {
    setSearchQuery(val);
  }, 400), []);

  useEffect(() => {
    debouncedSetSearchQuery(searchInput);
    // Cleanup debounce on unmount
    return () => debouncedSetSearchQuery.cancel();
  }, [searchInput]);

  useEffect(() => {
    // Fetch discounts on component mount
    const backendStatus = statusFilter === 'expired' ? 'all' : statusFilter;
    
    dispatch(fetchDiscounts({
      page: 1,
      limit: 10,
      search: searchQuery,
      status: backendStatus,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction,
    }));
  }, [dispatch]);

  // Refetch discounts when filters change
  useEffect(() => {
    // Don't send 'expired' status to backend since we handle it on frontend
    const backendStatus = statusFilter === 'expired' ? 'all' : statusFilter;
    
    dispatch(fetchDiscounts({
      page: 1,
      limit: 10,
      search: searchQuery,
      status: backendStatus,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction,
    }));
  }, [dispatch, searchQuery, statusFilter, sortConfig, updateTrigger]);

  // Handle errors with SweetAlert
  useEffect(() => {
    if (error) {
      Swal.fire({
        title: 'Error!',
        text: error,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
      // Clear error after showing
      setTimeout(() => {
        dispatch(clearError());
      }, 100);
    }
  }, [error, dispatch]);

  // Check for expired discounts every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force a re-render to update expired status
      const now = new Date();
      const hasExpiredDiscounts = discounts.some(discount => 
        discount.status === 'active' && new Date(discount.validTo) < now
      );
      
      if (hasExpiredDiscounts) {
        // Trigger a re-render by updating the trigger state
        setUpdateTrigger(prev => prev + 1);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [discounts]);

  const handleShowModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code || '', // <-- Add code field
        name: discount.name,
        description: discount.description || '',
        discountType: discount.discountType,
        discountValue: discount.discountValue.toString(),
        minimumAmount: discount.minimumAmount ? discount.minimumAmount.toString() : '',
        maximumDiscount: discount.maximumDiscount ? discount.maximumDiscount.toString() : '',
        validFrom: new Date(discount.validFrom).toISOString().slice(0, 16),
        validTo: new Date(discount.validTo).toISOString().slice(0, 16),
        status: discount.status,
        maxUsage: discount.maxUsage ? discount.maxUsage.toString() : '',
        maxUsagePerUser: discount.maxUsagePerUser ? discount.maxUsagePerUser.toString() : '',
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '', // <-- Add code field
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minimumAmount: '',
        maximumDiscount: '',
        validFrom: '',
        validTo: '',
        status: 'active',
        maxUsage: '',
        maxUsagePerUser: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = (force = false) => {
    if (force) {
      closeModal();
      return;
    }
    // Check if there are unsaved changes
    const hasChanges = formData.name || formData.description || formData.discountValue || 
                      formData.minimumAmount || formData.maximumDiscount || formData.validFrom || formData.validTo;
    
    if (hasChanges && !editingDiscount) {
      // For new discount, check if any field is filled
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, close',
        cancelButtonText: 'Continue editing',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          closeModal();
        }
      });
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumAmount: '',
      maximumDiscount: '',
      validFrom: '',
      validTo: '',
      status: 'active',
      maxUsage: '',
      maxUsagePerUser: '',
    });
    dispatch(clearError());
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Code is required'; // <-- Validate code
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.discountValue || isNaN(formData.discountValue) || Number(formData.discountValue) <= 0) errors.discountValue = 'Discount value must be greater than 0';
    if (!formData.validFrom) errors.validFrom = 'Valid from date is required';
    if (!formData.validTo) errors.validTo = 'Valid to date is required';
    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) >= new Date(formData.validTo)) errors.validTo = 'Valid to date must be after valid from date';

    // New validation for maximumDiscount
    const maxDisc = formData.maximumDiscount !== '' ? parseFloat(formData.maximumDiscount) : null;
    const minAmt = formData.minimumAmount !== '' ? parseFloat(formData.minimumAmount) : null;
    const discVal = formData.discountValue !== '' ? parseFloat(formData.discountValue) : null;
    if (maxDisc !== null) {
      if (minAmt !== null && maxDisc > minAmt) {
        errors.maximumDiscount = 'Maximum discount cannot be greater than minimum amount';
      }
      if (discVal !== null && maxDisc <= discVal) {
        errors.maximumDiscount = 'Maximum discount must be greater than discount value';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error',
        text: Object.values(formErrors).join('\n'),
        icon: 'warning',
        confirmButtonColor: '#dc3545',
      });
      return;
    }
    
    // Show loading state
    Swal.fire({
      title: editingDiscount ? 'Updating...' : 'Creating...',
      text: editingDiscount 
        ? 'Please wait while we update the discount.' 
        : 'Please wait while we create the discount.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const action = editingDiscount
      ? dispatch(updateDiscount({ id: editingDiscount._id, discountData: formData }))
      : dispatch(createDiscount(formData));
    action
      .unwrap()
      .then(() => {
        Swal.fire({
          title: editingDiscount ? 'Updated!' : 'Created!',
          text: editingDiscount ? 'Discount has been updated successfully.' : 'Discount has been created successfully.',
          icon: 'success',
          confirmButtonColor: '#28a745'
        });
        handleCloseModal(true);
      })
      .catch((error) => {
        // Check for duplicate code error
        if (typeof error === 'string' && error.includes('Coupon code already exists')) {
          setFormErrors((prev) => ({ ...prev, code: error }));
          Swal.close();
        } else {
          Swal.fire({
            title: 'Error!',
            text: error || 'Failed to create/update discount. Please try again.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
        }
      });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-secondary'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait while we delete the discount.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Dispatch delete action
        dispatch(deleteDiscount(id))
          .unwrap()
          .then(() => {
            Swal.fire({
              title: 'Deleted!',
              text: 'Discount has been deleted successfully.',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
          })
          .catch((error) => {
            Swal.fire({
              title: 'Error!',
              text: error || 'Failed to delete discount. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
          });
      }
    });
  };

  const handleRestore = (id) => {
    Swal.fire({
      title: 'Restore Discount?',
      text: "This will restore the discount and make it active again.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-secondary'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Restoring...',
          text: 'Please wait while we restore the discount.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Dispatch restore action
        dispatch(restoreDiscount(id))
          .unwrap()
          .then(() => {
            Swal.fire({
              title: 'Restored!',
              text: 'Discount has been restored successfully.',
              icon: 'success',
              confirmButtonColor: '#28a745'
            });
          })
          .catch((error) => {
            Swal.fire({
              title: 'Error!',
              text: error || 'Failed to restore discount. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
          });
      }
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? (
      <FaSortUp />
    ) : (
      <FaSortDown />
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Function to check if a discount has expired
  const isDiscountExpired = (discount) => {
    const now = new Date();
    const validTo = new Date(discount.validTo);
    return validTo < now;
  };

  // Function to get the effective status of a discount
  const getEffectiveStatus = (discount) => {
    if (discount.status === 'inactive') {
      return 'inactive';
    }
    if (isDiscountExpired(discount)) {
      return 'expired';
    }
    return discount.status;
  };

  // Function to get time remaining until expiration
  const getTimeRemaining = (validTo) => {
    const now = new Date();
    const expiryDate = new Date(validTo);
    const timeDiff = expiryDate - now;
    
    if (timeDiff <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
      return 'Less than 1 hour left';
    }
  };

  // Filter discounts based on effective status
  const getFilteredDiscounts = () => {
    if (statusFilter === 'all') {
      return discounts;
    }
    return discounts.filter(discount => getEffectiveStatus(discount) === statusFilter);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('all');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
    dispatch(clearFilters());
    dispatch(fetchDiscounts({
      page: 1,
      limit: 10,
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }));
  };

  if (loading && discounts.length === 0) {
    return (
      <Container fluid className="py-5">
        <Row>
          <Col xs={12} md={3} lg={2} className="p-0">
            <AdminLeftbar />
          </Col>
          <Col xs={12} md={9} lg={10}>
            <Container className="py-5 text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </Container>
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
                <h2 className="mb-0">Discount Management</h2>
                <div className="d-flex gap-3 mt-2">
                  <small className="text-muted">
                    Total: {total} | Active: {discounts.filter(d => getEffectiveStatus(d) === 'active').length} | 
                    Inactive: {discounts.filter(d => getEffectiveStatus(d) === 'inactive').length} | 
                    Expired: {discounts.filter(d => getEffectiveStatus(d) === 'expired').length}
                  </small>
                </div>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => handleShowModal()}
                  className="d-flex align-items-center gap-2"
                >
                  <FaPlus /> Add New Discount
                </Button>
              </Col>
            </Row>

            {error && (
              <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                {error}
              </Alert>
            )}

            {/* Filters and Search */}
            <Row className="mb-3">
              <Col md={8} className="d-flex align-items-center gap-2">
                {/* Existing search and filter controls here */}
                <Form.Control
                  type="text"
                  placeholder="Search discounts..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ maxWidth: 250 }}
                />
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ maxWidth: 180 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </Form.Select>
                {/* Add more filter controls if needed */}
                <Button variant="outline-secondary" onClick={handleClearFilters}>
                  Clear
                </Button>
              </Col>
            </Row>

            {/* Discounts Table */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Discounts ({statusFilter === 'all' ? total : getFilteredDiscounts().length})</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead>
                      <tr>
                        <th
                          className="cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Name {getSortIcon('name')}
                          </div>
                        </th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min Amount</th>
                        <th>Valid Period</th>
                        <th
                          className="cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Status {getSortIcon('status')}
                          </div>
                        </th>
                        <th>Usage</th>
                        <th>Per User Limit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDiscounts().length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            <div>
                              <FaSearch className="mb-2" style={{ fontSize: '2rem' }} />
                              <p>No discounts found.</p>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  handleShowModal();
                                  // Show a helpful message
                                  Swal.fire({
                                    title: 'Create Your First Discount!',
                                    text: 'Let\'s get started by creating your first discount offer.',
                                    icon: 'info',
                                    confirmButtonColor: '#007bff',
                                    confirmButtonText: 'Got it!'
                                  });
                                }}
                              >
                                Create your first discount
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getFilteredDiscounts().map((discount) => (
                          <tr key={discount._id}>
                            <td>{discount.name}</td>
                            <td>{discount.description || '-'}</td>
                            <td>
                              <Badge bg={discount.discountType === 'percentage' ? 'info' : 'warning'}>
                                {discount.discountType}
                              </Badge>
                            </td>
                            <td>
                              {discount.discountType === 'percentage' 
                                ? `${discount.discountValue}%` 
                                : `₹${discount.discountValue}`
                              }
                            </td>
                            <td>
                              {discount.minimumAmount > 0 ? `₹${discount.minimumAmount}` : '-'}
                            </td>
                            <td>
                              <div>
                                <div>From: {formatDate(discount.validFrom)}</div>
                                <div className={`d-flex align-items-center gap-1 ${
                                  isDiscountExpired(discount) ? 'text-danger' : 
                                  new Date(discount.validTo) - new Date() < 24 * 60 * 60 * 1000 ? 'text-warning' : ''
                                }`}>
                                  To: {formatDate(discount.validTo)}
                                  {isDiscountExpired(discount) && <span title="Expired">⏰</span>}
                                  {!isDiscountExpired(discount) && new Date(discount.validTo) - new Date() < 24 * 60 * 60 * 1000 && (
                                    <span title="Expires soon">⚠️</span>
                                  )}
                                </div>
                                <small className={`text-muted ${
                                  isDiscountExpired(discount) ? 'text-danger' : 
                                  new Date(discount.validTo) - new Date() < 24 * 60 * 60 * 1000 ? 'text-warning' : ''
                                }`}>
                                  {getTimeRemaining(discount.validTo)}
                                </small>
                              </div>
                            </td>
                            <td>
                              <Badge bg={
                                getEffectiveStatus(discount) === 'active' ? 'success' : 
                                getEffectiveStatus(discount) === 'inactive' ? 'secondary' : 'danger'
                              }>
                                {getEffectiveStatus(discount)}
                                {getEffectiveStatus(discount) === 'expired' && (
                                  <span className="ms-1" title="Expired on {formatDate(discount.validTo)}">
                                    ⏰
                                  </span>
                                )}
                              </Badge>
                            </td>
                            <td>
                              {discount.usageCount || 0}
                              {discount.maxUsage && ` / ${discount.maxUsage}`}
                            </td>
                            <td>
                              {discount.maxUsagePerUser ? discount.maxUsagePerUser : '-'}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleShowModal(discount)}
                                  title="Edit Discount"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(discount._id)}
                                  title="Delete Discount"
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
          </Container>
        </Col>
      </Row>

      {/* Add/Edit Discount Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDiscount ? 'Edit Discount' : 'Add New Discount'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    isInvalid={!!formErrors.code}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.code}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Code must be unique and is required for applying the discount.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    isInvalid={!!formErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type *</Form.Label>
                  <Form.Select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Value *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                  />
                  {formData.discountType === 'percentage' && (
                    <Form.Text className="text-muted">
                      Maximum 100%
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Discount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid From *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid To *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Usage</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                  <Form.Text className="text-muted">
                    Leave empty for unlimited usage
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Usage Per User</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.maxUsagePerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                  <Form.Text className="text-muted">
                    Leave empty for unlimited usage per user
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingDiscount ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingDiscount ? 'Update Discount' : 'Create Discount'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminDiscounts; 