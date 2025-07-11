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
} from "react-icons/fa";
import AdminLeftbar from "../../components/AdminLeftbar";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  restoreCoupon,
  clearError,
  setFilters,
} from "../../redux/reducers/couponSlice";

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error, total, page, totalPages, filters } =
    useSelector((state) => state.coupons);

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minimumAmount: "",
    maximumDiscount: "",
    validFrom: "",
    validTo: "",
    status: "active",
    maxUsage: "",
    maxUsagePerUser: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCoupons(filters));
    // eslint-disable-next-line
  }, [filters]);

  const handleShowModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minimumAmount: coupon.minimumAmount
          ? coupon.minimumAmount.toString()
          : "",
        maximumDiscount: coupon.maximumDiscount
          ? coupon.maximumDiscount.toString()
          : "",
        validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
        validTo: new Date(coupon.validTo).toISOString().slice(0, 16),
        status: coupon.status,
        maxUsage: coupon.maxUsage ? coupon.maxUsage.toString() : "",
        maxUsagePerUser: coupon.maxUsagePerUser
          ? coupon.maxUsagePerUser.toString()
          : "",
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        minimumAmount: "",
        maximumDiscount: "",
        validFrom: "",
        validTo: "",
        status: "active",
        maxUsage: "",
        maxUsagePerUser: "",
      });
    }
    setShowModal(true);
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minimumAmount: "",
      maximumDiscount: "",
      validFrom: "",
      validTo: "",
      status: "active",
      maxUsage: "",
      maxUsagePerUser: "",
    });
    setFormErrors({});
    dispatch(clearError());
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = "Coupon code is required";
    else if (!/^[A-Z0-9_\-]{3,20}$/.test(formData.code.trim().toUpperCase()))
      errors.code =
        "Code must be 3-20 characters, uppercase letters, numbers, - or _ only";
    if (
      !formData.discountValue ||
      isNaN(formData.discountValue) ||
      Number(formData.discountValue) <= 0
    )
      errors.discountValue = "Discount value must be greater than 0";
    if (!formData.validFrom) errors.validFrom = "Valid from date is required";
    if (!formData.validTo) errors.validTo = "Valid to date is required";
    if (
      formData.validFrom &&
      formData.validTo &&
      new Date(formData.validFrom) >= new Date(formData.validTo)
    )
      errors.validTo = "Valid to date must be after valid from date";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({
        title: "Validation Error",
        text: Object.values(formErrors).join("\n"),
        icon: "warning",
        confirmButtonColor: "#dc3545",
      });
      return;
    }
    Swal.fire({
      title: editingCoupon ? "Updating..." : "Creating...",
      text: editingCoupon
        ? "Please wait while we update the coupon."
        : "Please wait while we create the coupon.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      if (editingCoupon) {
        await dispatch(
          updateCoupon({ id: editingCoupon._id, couponData: formData })
        ).unwrap();
        Swal.fire({
          title: "Updated!",
          text: "Coupon has been updated successfully.",
          icon: "success",
          confirmButtonColor: "#28a745",
        });
      } else {
        await dispatch(createCoupon(formData)).unwrap();
        Swal.fire({
          title: "Created!",
          text: "Coupon has been created successfully.",
          icon: "success",
          confirmButtonColor: "#28a745",
        });
      }
      handleCloseModal();
      dispatch(fetchCoupons(filters));
    } catch (err) {
      if (
        typeof err === "string" &&
        err.includes("Coupon code already exists")
      ) {
        setFormErrors((prev) => ({ ...prev, code: err }));
        Swal.close();
      } else {
        Swal.fire({
          title: "Error!",
          text: err || "Failed to create/update coupon. Please try again.",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-danger",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the coupon.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        try {
          await dispatch(deleteCoupon(id)).unwrap();
          Swal.fire({
            title: "Deleted!",
            text: "Coupon has been deleted successfully.",
            icon: "success",
            confirmButtonColor: "#28a745",
          });
          dispatch(fetchCoupons(filters));
        } catch (err) {
          Swal.fire({
            title: "Error!",
            text: err || "Failed to delete coupon. Please try again.",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
        }
      }
    });
  };

  const handleRestore = async (id) => {
    Swal.fire({
      title: "Restore Coupon?",
      text: "This will restore the coupon and make it active again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, restore it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Restoring...",
          text: "Please wait while we restore the coupon.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        try {
          await dispatch(restoreCoupon(id)).unwrap();
          Swal.fire({
            title: "Restored!",
            text: "Coupon has been restored successfully.",
            icon: "success",
            confirmButtonColor: "#28a745",
          });
          dispatch(fetchCoupons(filters));
        } catch (err) {
          Swal.fire({
            title: "Error!",
            text: err || "Failed to restore coupon. Please try again.",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
        }
      }
    });
  };

  const handleSort = (key) => {
    dispatch(
      setFilters({
        sortBy: key,
        sortOrder:
          filters.sortBy === key && filters.sortOrder === "asc"
            ? "desc"
            : "asc",
      })
    );
  };

  const getSortIcon = (key) => {
    if (filters.sortBy !== key) return <FaSort className="text-muted" />;
    return filters.sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
                <h2 className="mb-0">Coupon Management</h2>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => handleShowModal()}
                  className="d-flex align-items-center gap-2"
                >
                  <FaPlus /> Add New Coupon
                </Button>
              </Col>
            </Row>
            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => dispatch(clearError())}
              >
                {error}
              </Alert>
            )}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search Coupons</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="Search by code or description..."
                          value={filters.search}
                          onChange={(e) =>
                            dispatch(setFilters({ search: e.target.value }))
                          }
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Status Filter</Form.Label>
                      <Form.Select
                        value={filters.status}
                        onChange={(e) =>
                          dispatch(setFilters({ status: e.target.value }))
                        }
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Coupons ({coupons.length})</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead>
                      <tr>
                        <th
                          className="cursor-pointer"
                          onClick={() => handleSort("code")}
                        >
                          <div className="d-flex align-items-center gap-2">
                            Code {getSortIcon("code")}
                          </div>
                        </th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min Amount</th>
                        <th>Valid Period</th>
                        <th>Status</th>
                        <th>Usage</th>
                        <th>Per User Limit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="text-center text-muted py-4"
                          >
                            <div>
                              <FaSearch
                                className="mb-2"
                                style={{ fontSize: "2rem" }}
                              />
                              <p>No coupons found.</p>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal()}
                              >
                                Create your first coupon
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        coupons.map((coupon) => (
                          <tr key={coupon._id}>
                            <td>{coupon.code}</td>
                            <td>{coupon.description || "-"}</td>
                            <td>
                              <Badge
                                bg={
                                  coupon.discountType === "percentage"
                                    ? "info"
                                    : "warning"
                                }
                              >
                                {coupon.discountType}
                              </Badge>
                            </td>
                            <td>
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}%`
                                : `₹${coupon.discountValue}`}
                            </td>
                            <td>
                              {coupon.minimumAmount > 0
                                ? `₹${coupon.minimumAmount}`
                                : "-"}
                            </td>
                            <td>
                              <div>
                                <div>From: {formatDate(coupon.validFrom)}</div>
                                <div>To: {formatDate(coupon.validTo)}</div>
                              </div>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  coupon.status === "active"
                                    ? "success"
                                    : coupon.status === "inactive"
                                    ? "secondary"
                                    : "danger"
                                }
                              >
                                {coupon.status}
                              </Badge>
                            </td>
                            <td>
                              {coupon.usageCount || 0}
                              {coupon.maxUsage && ` / ${coupon.maxUsage}`}
                            </td>
                            <td>
                              {coupon.maxUsagePerUser
                                ? coupon.maxUsagePerUser
                                : "-"}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleShowModal(coupon)}
                                  title="Edit Coupon"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(coupon._id)}
                                  title="Delete Coupon"
                                >
                                  <FaTrash />
                                </Button>
                                {coupon.isDeleted && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleRestore(coupon._id)}
                                    title="Restore Coupon"
                                  >
                                    <FaUndo />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
                {loading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </Col>
      </Row>
      {/* Add/Edit Coupon Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coupon Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    isInvalid={!!formErrors.code}
                    placeholder="E.g. SAVE10"
                    maxLength={20}
                  />
                  <Form.Text className="text-muted">
                    Unique, 3-20 uppercase letters, numbers, - or _
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.code}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type *</Form.Label>
                  <Form.Select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
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
                      setFormData({
                        ...formData,
                        discountValue: e.target.value,
                      })
                    }
                  />
                  {formData.discountType === "percentage" && (
                    <Form.Text className="text-muted">Maximum 100%</Form.Text>
                  )}
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
                      setFormData({
                        ...formData,
                        minimumAmount: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Discount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximumDiscount: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid From *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid To *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={(e) =>
                      setFormData({ ...formData, validTo: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Usage</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.maxUsage}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUsage: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                  />
                  <Form.Text className="text-muted">
                    Leave empty for unlimited usage
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Usage Per User</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.maxUsagePerUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsagePerUser: e.target.value,
                      })
                    }
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
            <Button variant="primary" type="submit">
              {editingCoupon ? "Update Coupon" : "Create Coupon"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminCoupons;
