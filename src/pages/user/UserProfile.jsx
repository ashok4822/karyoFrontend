import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Card,
  Image,
  Button,
  Form,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import {
  FaUser,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaEdit,
  FaTimesCircle,
  FaKey,
  FaCamera,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import Swal from "sweetalert2";
import userAxios from "../../lib/userAxios";
import { loginSuccess } from "../../redux/reducers/authSlice";
import { OTP_EXPIRY_SECONDS } from "../../lib/utils";
import { fetchUserOrders, cancelOrder } from "../../redux/reducers/orderSlice";

const sidebarItems = [
  { label: "User Details", icon: <FaUser /> },
  { label: "Edit profile", icon: <FaEdit /> },
  { label: "Address Management", icon: <FaMapMarkerAlt /> },
  { label: "Show orders", icon: <FaBoxOpen /> },
  // { label: "Cancel orders", icon: <FaTimesCircle /> }, // Commented out as per request
  { label: "Reset password", icon: <FaKey /> },
  { label: "Edit Email", icon: <FaEdit /> },
];

const UserProfile = () => {
  const { user, userAccessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [avatar, setAvatar] = useState(user?.profileImage || "/profile.png");
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    mobileNo: user?.mobileNo || "",
    address: user?.address || "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const fileInputRef = useRef(null);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    isDefault: false,
  });
  const [setDefaultLoadingId, setSetDefaultLoadingId] = useState(null);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({
    recipientName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phoneNumber: "",
    isDefault: false,
  });
  const [editAddressLoading, setEditAddressLoading] = useState(false);
  const [editAddressError, setEditAddressError] = useState("");
  const [editAddressSuccess, setEditAddressSuccess] = useState("");
  const [deleteAddressLoading, setDeleteAddressLoading] = useState(null);
  const [deleteAddressError, setDeleteAddressError] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmailError, setEditEmailError] = useState("");
  const [editEmailSuccess, setEditEmailSuccess] = useState("");
  const [editEmailLoading, setEditEmailLoading] = useState(false);
  const [editEmailOtp, setEditEmailOtp] = useState("");
  const [editEmailVerifyLoading, setEditEmailVerifyLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot password state
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] =
    useState("");
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] =
    useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordTimer, setForgotPasswordTimer] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);

  // Add state for cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null); // { orderId, productVariantId (optional) }

  // In showOrdersContent, update tbody:
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Add state for return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnTarget, setReturnTarget] = useState(null); // { orderId }

  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  // On mount, check for tab query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "orders") {
      setActiveIndex(3);
    }
  }, [location.search]);

  // Add state for backend pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const [total, setTotal] = useState(0);

  // Add state for search
  const [orderSearch, setOrderSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Add state for status filter
  const [orderStatus, setOrderStatus] = useState("all");

  // Fetch paginated orders from backend
  useEffect(() => {
    if (activeIndex === 3) {
      const fetchOrders = async () => {
        try {
          const params = { page: currentPage, limit: ordersPerPage };
          if (orderSearch.trim() !== "") params.search = orderSearch.trim();
          if (orderStatus && orderStatus !== "all") params.status = orderStatus;
          const res = await userAxios.get('/orders', { params });
          dispatch({ type: 'order/fetchUserOrders/fulfilled', payload: { orders: res.data.orders } });
          setTotal(res.data.total || 0);
        } catch (err) {
          // handle error if needed
        }
      };
      fetchOrders();
    }
  }, [activeIndex, currentPage, ordersPerPage, orderSearch, orderStatus, dispatch]);

  // Calculate correct start and end indices for the current page
  const startOrder = (orders.length === 0) ? 0 : (currentPage - 1) * ordersPerPage + 1;
  const endOrder = (orders.length === 0) ? 0 : Math.min(currentPage * ordersPerPage, total);
  const totalPages = Math.ceil(total / ordersPerPage);

  // Keyboard shortcut for clearing filters (Escape key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && activeIndex === 3) {
        clearFilters();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex]);

  useEffect(() => {
    const fetchWallet = async () => {
      setWalletLoading(true);
      setWalletError("");
      try {
        const res = await userAxios.get("/users/wallet");
        setWalletBalance(res.data.balance);
      } catch (err) {
        setWalletError("Could not load wallet");
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await userAxios.put("/users/profile-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.profileImage) {
          setAvatar(res.data.profileImage);
          // Update Redux user state with new image
          dispatch(
            loginSuccess({
              user: { ...user, profileImage: res.data.profileImage },
              userAccessToken,
            })
          );
        }
      } catch (err) {
        alert("Image upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to get status display info
  const getStatusInfo = (status) => {
    switch (status) {
      case "return_verified":
        return {
          text: "Return Verified",
          color: "success",
          message: "Your return has been verified and processed"
        };
      case "rejected":
        return {
          text: "Return Rejected",
          color: "danger",
          message: "Your return request has been rejected"
        };
      case "returned":
        return {
          text: "Return Requested",
          color: "warning",
          message: "Return request submitted and under review"
        };
      case "delivered":
        return {
          text: "Delivered",
          color: "success",
          message: "Order has been delivered successfully"
        };
      case "cancelled":
        return {
          text: "Cancelled",
          color: "danger",
          message: "Order has been cancelled"
        };
      case "pending":
        return {
          text: "Pending",
          color: "info",
          message: "Order is pending processing"
        };
      default:
        return {
          text: status.charAt(0).toUpperCase() + status.slice(1),
          color: "info",
          message: "Order status updated"
        };
    }
  };

  // Edit Profile submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const res = await userAxios.put("/users/profile", editForm, {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });
      if (res.data?.user) {
        dispatch(loginSuccess({ user: res.data.user, userAccessToken }));
        setEditSuccess("Profile updated successfully");
      }
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  // Fade out success message after 5 seconds
  useEffect(() => {
    if (editSuccess) {
      const timer = setTimeout(() => setEditSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [editSuccess]);

  // Fetch shipping addresses when Show address is selected
  useEffect(() => {
    if (activeIndex === 2) {
      setShippingLoading(true);
      setShippingError("");
      userAxios
        .get("/users/shipping-addresses", {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        })
        .then((res) => {
          setShippingAddresses(res.data.addresses || []);
        })
        .catch((err) => {
          setShippingError("Failed to load addresses");
        })
        .finally(() => setShippingLoading(false));
    }
  }, [activeIndex, userAccessToken]);

  // Add new shipping address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    try {
      const res = await userAxios.post("/users/shipping-address", newAddress, {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });
      setAddSuccess("Address added successfully");
      setShowAddressModal(false);
      setNewAddress({
        recipientName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        phoneNumber: "",
        isDefault: false,
      });
      // Refresh address list
      setShippingAddresses((prev) => [
        res.data.address,
        ...prev.filter((a) => !a.isDefault),
      ]);
      // If new address is default, update others
      if (res.data.address.isDefault) {
        setShippingAddresses((prev) => [
          res.data.address,
          ...prev.filter((a) => !a.isDefault),
        ]);
      } else {
        setShippingAddresses((prev) => [...prev, res.data.address]);
      }
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add address");
    } finally {
      setAddLoading(false);
    }
  };

  // Set default shipping address
  const handleSetDefault = async (addressId) => {
    setSetDefaultLoadingId(addressId);
    try {
      await userAxios.put(
        `/users/shipping-address/${addressId}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        }
      );
      // Refresh addresses
      const res = await userAxios.get("/users/shipping-addresses", {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });
      setShippingAddresses(res.data.addresses || []);
    } catch (err) {
      console.error("Failed to set default address:", err);
    } finally {
      setSetDefaultLoadingId(null);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setEditAddressForm({
      recipientName: address.recipientName || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
      phoneNumber: address.phoneNumber || "",
      isDefault: address.isDefault || false,
    });
    setEditAddressError("");
    setEditAddressSuccess("");
    setEditAddressModal(true);
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    setEditAddressLoading(true);
    setEditAddressError("");
    setEditAddressSuccess("");
    try {
      await userAxios.put(
        `/users/shipping-address/${editingAddress._id}`,
        editAddressForm,
        {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        }
      );
      setEditAddressSuccess("Address updated successfully");
      setEditAddressModal(false);
      // Refresh addresses
      const res = await userAxios.get("/users/shipping-addresses", {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });
      setShippingAddresses(res.data.addresses || []);
    } catch (err) {
      setEditAddressError(
        err.response?.data?.message || "Failed to update address"
      );
    } finally {
      setEditAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "Delete Address",
      text: "Are you sure you want to delete this address? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setDeleteAddressLoading(addressId);
      setDeleteAddressError("");
      try {
        await userAxios.delete(`/users/shipping-address/${addressId}`, {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        });

        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "Address has been deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh addresses
        const res = await userAxios.get("/users/shipping-addresses", {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        });
        setShippingAddresses(res.data.addresses || []);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to delete address";
        setDeleteAddressError(errorMessage);

        // Show error message
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#3085d6",
        });
      } finally {
        setDeleteAddressLoading(null);
      }
    }
  };

  // Fade out forgot password success message
  useEffect(() => {
    if (forgotPasswordSuccess && forgotPasswordSuccess.includes("successful")) {
      const timer = setTimeout(() => setForgotPasswordSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [forgotPasswordSuccess]);

  // Forgot password handlers
  const handleForgotPasswordRequestOtp = async (e, isResend = false) => {
    if (e) e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    if (!forgotPasswordEmail || !/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setForgotPasswordError("Please enter a valid email");
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await userAxios.post("auth/request-password-reset-otp", {
        email: forgotPasswordEmail,
      });
      setForgotPasswordSuccess(
        isResend ? "OTP resent to your email." : "OTP sent to your email."
      );
      setForgotPasswordStep(2);
      setForgotPasswordTimer(OTP_EXPIRY_SECONDS);
    } catch (error) {
      setForgotPasswordError(
        error.response?.data?.message || "Failed to send OTP"
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    if (!forgotPasswordOtp) {
      setForgotPasswordError("Please enter the OTP");
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await userAxios.post("auth/verify-password-reset-otp", {
        email: forgotPasswordEmail,
        otp: forgotPasswordOtp,
      });
      setForgotPasswordSuccess("OTP verified. Please enter your new password.");
      setForgotPasswordStep(3);
    } catch (error) {
      setForgotPasswordError(
        error.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
    if (!forgotPasswordNewPassword || forgotPasswordNewPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters");
      return;
    }
    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      setForgotPasswordError("Passwords do not match");
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await userAxios.post("auth/reset-password", {
        email: forgotPasswordEmail,
        otp: forgotPasswordOtp,
        newPassword: forgotPasswordNewPassword,
      });
      setForgotPasswordSuccess("Password reset successful!");
      // Reset form
      setForgotPasswordStep(1);
      setForgotPasswordEmail("");
      setForgotPasswordOtp("");
      setForgotPasswordNewPassword("");
      setForgotPasswordConfirmPassword("");
      setForgotPasswordTimer(0);
    } catch (error) {
      setForgotPasswordError(
        error.response?.data?.message || "Password reset failed"
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // User Details content
  const userDetailsContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        {/* Wallet UI */}
        <div className="d-flex flex-column align-items-center mb-3">
          <div style={{
            background: '#f6fafd',
            border: '2px solid #0d6efd',
            borderRadius: 12,
            padding: 12,
            width: '100%',
            maxWidth: 220,
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontWeight: 600, color: '#0d6efd', fontSize: 16 }}>Wallet Balance</div>
            {walletLoading ? (
              <div className="text-muted small">Loading...</div>
            ) : walletError ? (
              <div className="text-danger small">{walletError}</div>
            ) : (
              <div style={{ fontSize: 22, fontWeight: 700, color: '#222' }}>₹{walletBalance?.toFixed(2) || '0.00'}</div>
            )}
            <a href="/wallet" style={{ fontSize: 13, color: '#0d6efd', textDecoration: 'underline', display: 'block', marginTop: 4 }}>View Wallet</a>
          </div>
        </div>
        {/* Profile Image and Info */}
        <div className="d-flex flex-column align-items-center mb-4">
          <Image
            src={avatar}
            roundedCircle
            style={{
              width: 120,
              height: 120,
              objectFit: "cover",
              border: "4px solid #0d6efd",
            }}
            className="mb-3 shadow-sm"
            alt="User Avatar"
            onClick={uploading ? undefined : handleAvatarClick}
          />
          <h5 className="fw-bold mb-1">{user?.username || "User Name"}</h5>
          <div className="text-muted small mb-3">
            Member since {user?.createdAt ? formatDate(user.createdAt) : "-"}
          </div>
        </div>
        <div className="mb-3">
          <strong>First Name:</strong> {user?.firstName || "-"}
        </div>
        <div className="mb-3">
          <strong>Last Name:</strong> {user?.lastName || "-"}
        </div>
        <div className="mb-3">
          <strong>Email:</strong> {user?.email || "-"}
        </div>
        <div className="mb-3">
          <strong>Mobile Number:</strong> {user?.mobileNo || "-"}
        </div>
        <div className="mb-3">
          <strong>Address:</strong> {user?.address || "-"}
        </div>
      </Card.Body>
    </Card>
  );

  // Edit Profile content
  const editProfileContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5 className="fw-bold mb-3">Edit Profile</h5>
        {editError && <Alert variant="danger">{editError}</Alert>}
        {editSuccess && <Alert variant="success">{editSuccess}</Alert>}
        <Form onSubmit={handleEditSubmit} autoComplete="off">
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, firstName: e.target.value }))
              }
              placeholder="Enter first name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, lastName: e.target.value }))
              }
              placeholder="Enter last name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mobile Number</Form.Label>
            <Form.Control
              type="tel"
              value={editForm.mobileNo}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, mobileNo: e.target.value }))
              }
              placeholder="Enter mobile number"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={editForm.address}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="Enter address"
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={editLoading}>
            {editLoading ? "Saving..." : "Save Changes"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );

  // Show Address content
  const showAddressContent = (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Shipping Addresses</h5>
        <Button variant="primary" onClick={() => setShowAddressModal(true)}>
          + Add New Address
        </Button>
      </div>
      {shippingLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : shippingError ? (
        <Alert variant="danger">{shippingError}</Alert>
      ) : (
        <>
          {deleteAddressError && (
            <Alert variant="danger">{deleteAddressError}</Alert>
          )}
          <Row>
            {shippingAddresses.length === 0 && (
              <div className="text-muted text-center">No addresses found.</div>
            )}
            {shippingAddresses.map((addr) => (
              <Col md={6} lg={4} key={addr._id || addr.id} className="mb-4">
                <Card
                  className={
                    addr.isDefault ? "border-primary shadow-sm" : "shadow-sm"
                  }
                >
                  <Card.Body>
                    <div className="mb-2 d-flex align-items-center justify-content-between">
                      <div>
                        <strong>{addr.recipientName}</strong>
                        {addr.isDefault && (
                          <span className="badge bg-primary ms-2">Default</span>
                        )}
                      </div>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleEditAddress(addr)}
                          title="Edit Address"
                        >
                          <FaEdit size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteAddress(addr._id)}
                          disabled={
                            deleteAddressLoading === addr._id || addr.isDefault
                          }
                          title={
                            addr.isDefault
                              ? "Cannot delete default address"
                              : "Delete Address"
                          }
                        >
                          {deleteAddressLoading === addr._id ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <FaTimesCircle size={12} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>{addr.addressLine1}</div>
                    {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                    <div>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </div>
                    <div>{addr.country}</div>
                    <div className="mt-2 text-muted small">
                      Phone: {addr.phoneNumber}
                    </div>
                    {!addr.isDefault && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={setDefaultLoadingId === addr._id}
                          onClick={() => handleSetDefault(addr._id)}
                        >
                          {setDefaultLoadingId === addr._id ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            "Set as Default"
                          )}
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
      <Modal
        show={showAddressModal}
        onHide={() => setShowAddressModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Shipping Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}
          {addSuccess && <Alert variant="success">{addSuccess}</Alert>}
          <Form onSubmit={handleAddAddress} autoComplete="off">
            <Form.Group className="mb-2">
              <Form.Label>Recipient Name</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.recipientName}
                onChange={(e) =>
                  setNewAddress((a) => ({
                    ...a,
                    recipientName: e.target.value,
                  }))
                }
                placeholder="Enter recipient name"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address Line 1</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.addressLine1}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, addressLine1: e.target.value }))
                }
                placeholder="Enter address line 1"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address Line 2</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.addressLine2}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, addressLine2: e.target.value }))
                }
                placeholder="Enter address line 2 (optional)"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.city}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, city: e.target.value }))
                }
                placeholder="Enter city"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>State</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.state}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, state: e.target.value }))
                }
                placeholder="Enter state"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.postalCode}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, postalCode: e.target.value }))
                }
                placeholder="Enter postal code"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.country}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, country: e.target.value }))
                }
                placeholder="Enter country"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.phoneNumber}
                onChange={(e) =>
                  setNewAddress((a) => ({ ...a, phoneNumber: e.target.value }))
                }
                placeholder="Enter phone number"
              />
            </Form.Group>
            <Form.Check
              className="mb-2"
              type="checkbox"
              label="Set as default address"
              checked={newAddress.isDefault}
              onChange={(e) =>
                setNewAddress((a) => ({ ...a, isDefault: e.target.checked }))
              }
            />
            <Button
              variant="primary"
              className="w-100 mt-2"
              type="submit"
              disabled={addLoading}
            >
              {addLoading ? "Adding..." : "Add Address"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        show={editAddressModal}
        onHide={() => setEditAddressModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Shipping Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editAddressError && (
            <Alert variant="danger">{editAddressError}</Alert>
          )}
          {editAddressSuccess && (
            <Alert variant="success">{editAddressSuccess}</Alert>
          )}
          <Form onSubmit={handleUpdateAddress} autoComplete="off">
            <Form.Group className="mb-2">
              <Form.Label>Recipient Name</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.recipientName}
                onChange={(e) =>
                  setEditAddressForm((a) => ({
                    ...a,
                    recipientName: e.target.value,
                  }))
                }
                placeholder="Enter recipient name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address Line 1</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.addressLine1}
                onChange={(e) =>
                  setEditAddressForm((a) => ({
                    ...a,
                    addressLine1: e.target.value,
                  }))
                }
                placeholder="Enter address line 1"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address Line 2</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.addressLine2}
                onChange={(e) =>
                  setEditAddressForm((a) => ({
                    ...a,
                    addressLine2: e.target.value,
                  }))
                }
                placeholder="Enter address line 2 (optional)"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.city}
                onChange={(e) =>
                  setEditAddressForm((a) => ({ ...a, city: e.target.value }))
                }
                placeholder="Enter city"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>State</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.state}
                onChange={(e) =>
                  setEditAddressForm((a) => ({ ...a, state: e.target.value }))
                }
                placeholder="Enter state"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.postalCode}
                onChange={(e) =>
                  setEditAddressForm((a) => ({
                    ...a,
                    postalCode: e.target.value,
                  }))
                }
                placeholder="Enter postal code"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.country}
                onChange={(e) =>
                  setEditAddressForm((a) => ({ ...a, country: e.target.value }))
                }
                placeholder="Enter country"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={editAddressForm.phoneNumber}
                onChange={(e) =>
                  setEditAddressForm((a) => ({
                    ...a,
                    phoneNumber: e.target.value,
                  }))
                }
                placeholder="Enter phone number"
                required
              />
            </Form.Group>
            <Form.Check
              className="mb-2"
              type="checkbox"
              label="Set as default address"
              checked={editAddressForm.isDefault}
              onChange={(e) =>
                setEditAddressForm((a) => ({
                  ...a,
                  isDefault: e.target.checked,
                }))
              }
            />
            <Button
              variant="primary"
              className="w-100 mt-2"
              type="submit"
              disabled={editAddressLoading}
            >
              {editAddressLoading ? "Updating..." : "Update Address"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

  // Forgot password timer effect
  useEffect(() => {
    let timer;
    if (forgotPasswordTimer > 0) {
      timer = setTimeout(
        () => setForgotPasswordTimer(forgotPasswordTimer - 1),
        1000
      );
    }
    return () => clearTimeout(timer);
  }, [forgotPasswordTimer]);

  const handleSendEmailOtp = async () => {
    setEditEmailError("");
    setEditEmailSuccess("");
    setEditEmailLoading(true);
    try {
      const res = await userAxios.post(
        "/users/request-email-change-otp",
        { email: editEmail },
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
      setEditEmailSuccess(res.data.message || "OTP sent to email");
      setOtpTimer(OTP_EXPIRY_SECONDS);
    } catch (err) {
      setEditEmailError(
        err.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setEditEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEditEmailError("");
    setEditEmailSuccess("");
    setEditEmailVerifyLoading(true);
    try {
      const res = await userAxios.post(
        "/users/verify-email-change-otp",
        { email: editEmail, otp: editEmailOtp },
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
      setEditEmailSuccess(res.data.message || "Email updated successfully");
      // Update Redux user state with new email
      dispatch(
        loginSuccess({
          user: { ...user, email: res.data.email },
          userAccessToken,
        })
      );
      setEditEmail("");
      setEditEmailOtp("");
    } catch (err) {
      setEditEmailError(
        err.response?.data?.message || "Failed to verify OTP. Please try again."
      );
    } finally {
      setEditEmailVerifyLoading(false);
    }
  };

  // Edit Email content
  const editEmailContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5 className="fw-bold mb-3">Edit Email</h5>
        {editEmailError && <Alert variant="danger">{editEmailError}</Alert>}
        {editEmailSuccess && (
          <Alert variant="success">{editEmailSuccess}</Alert>
        )}
        <Form autoComplete="off">
          <Form.Group className="mb-3">
            <Form.Label>New Email</Form.Label>
            <Form.Control
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Enter new email"
              disabled={editEmailLoading || editEmailSuccess}
            />
          </Form.Group>
          <Button
            variant="primary"
            type="button"
            onClick={handleSendEmailOtp}
            disabled={editEmailLoading || !editEmail || editEmailSuccess}
            className="mb-3"
          >
            {editEmailLoading ? "Sending..." : "Send OTP"}
          </Button>
          {/* Show OTP input if OTP sent and not yet verified */}
          {editEmailSuccess && !editEmailSuccess.includes("updated") && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Enter OTP</Form.Label>
                <Form.Control
                  type="text"
                  value={editEmailOtp}
                  onChange={(e) => setEditEmailOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                  disabled={editEmailVerifyLoading || otpTimer === 0}
                />
              </Form.Group>
              <div className="mb-2 text-muted">
                {otpTimer > 0
                  ? `OTP expires in ${otpTimer} second${
                      otpTimer !== 1 ? "s" : ""
                    }`
                  : "OTP expired. Please resend OTP."}
              </div>
              <Button
                variant="success"
                type="button"
                onClick={handleVerifyEmailOtp}
                disabled={
                  editEmailVerifyLoading || !editEmailOtp || otpTimer === 0
                }
              >
                {editEmailVerifyLoading
                  ? "Verifying..."
                  : "Verify & Update Email"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="ms-2 mt-2"
                onClick={() => {
                  setEditEmailOtp("");
                  setEditEmailError("");
                  setEditEmailSuccess("OTP resent. Please check your email.");
                  handleSendEmailOtp();
                }}
                disabled={otpTimer > 0 || editEmailLoading}
              >
                Resend OTP
              </Button>
            </>
          )}
        </Form>
      </Card.Body>
    </Card>
  );

  // Forgot Password content
  const forgotPasswordContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5 className="fw-bold mb-3">Reset Password</h5>
        <p className="text-muted mb-4">
          Reset your password using OTP verification
        </p>
        {forgotPasswordError && (
          <Alert variant="danger">{forgotPasswordError}</Alert>
        )}
        {forgotPasswordSuccess && (
          <Alert variant="success">{forgotPasswordSuccess}</Alert>
        )}

        {forgotPasswordStep === 1 && (
          <Form onSubmit={handleForgotPasswordRequestOtp} autoComplete="off">
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </Form>
        )}

        {forgotPasswordStep === 2 && (
          <Form onSubmit={handleForgotPasswordVerifyOtp} autoComplete="off">
            <Form.Group className="mb-3">
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="text"
                value={forgotPasswordOtp}
                onChange={(e) => setForgotPasswordOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                disabled={forgotPasswordTimer === 0}
              />
              <div className="mt-2 text-muted small">
                {forgotPasswordTimer > 0
                  ? `OTP expires in ${forgotPasswordTimer} second${
                      forgotPasswordTimer !== 1 ? "s" : ""
                    }`
                  : "OTP expired. Please resend OTP."}
              </div>
            </Form.Group>
            <Button
              type="submit"
              variant="success"
              className="w-100 mb-2"
              disabled={forgotPasswordLoading || forgotPasswordTimer === 0}
            >
              {forgotPasswordLoading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              variant="outline-secondary"
              className="w-100 mb-2"
              onClick={() => setForgotPasswordStep(1)}
            >
              Change Email
            </Button>
            <Button
              variant="outline-primary"
              className="w-100"
              disabled={forgotPasswordTimer > 0 || forgotPasswordLoading}
              onClick={(e) => handleForgotPasswordRequestOtp(e, true)}
            >
              {forgotPasswordTimer > 0
                ? `Resend OTP in ${forgotPasswordTimer}s`
                : "Resend OTP"}
            </Button>
          </Form>
        )}

        {forgotPasswordStep === 3 && (
          <Form onSubmit={handleForgotPasswordReset} autoComplete="off">
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={forgotPasswordNewPassword}
                onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={forgotPasswordConfirmPassword}
                onChange={(e) =>
                  setForgotPasswordConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </Form>
        )}
      </Card.Body>
    </Card>
  );

  // Show Orders content
  const showOrdersContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-3">My Orders</h5>
          <div className="d-flex align-items-center">
            <form
              className="d-flex align-items-center me-3"
              onSubmit={e => {
                e.preventDefault();
                setOrderSearch(searchInput);
              }}
              style={{ minWidth: 260 }}
            >
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search orders..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ maxWidth: 180 }}
              />
              <button type="submit" className="btn btn-primary btn-sm me-2">Search</button>
              {orderSearch && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setOrderSearch("");
                    setSearchInput("");
                  }}
                >
                  Clear
                </button>
              )}
            </form>
            <select
              className="form-select form-select-sm"
              style={{ width: 170 }}
              value={orderStatus}
              onChange={e => {
                setOrderStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
              <option value="return_verified">Return Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {ordersLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : ordersError ? (
          <Alert variant="danger">{ordersError}</Alert>
        ) : orders.length === 0 ? (
          <div className="text-center py-5">
            <FaBoxOpen size={48} className="text-muted mb-3" />
            <h6 className="text-muted">No orders found</h6>
            <p className="text-muted small">You have not placed any orders yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th></th>
                  <th>Order #</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Order Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const rows = [
                    <tr
                      key={order._id}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        // Prevent row click if clicking a button or link
                        if (
                          e.target.tagName === "BUTTON" ||
                          e.target.tagName === "A" ||
                          e.target.closest("button") ||
                          e.target.closest("a")
                        )
                          return;
                        setExpandedOrderId(
                          expandedOrderId === order._id ? null : order._id
                        );
                      }}
                    >
                      <td style={{ width: 32 }}>
                        {expandedOrderId === order._id ? (
                          <FaChevronDown />
                        ) : (
                          <FaChevronRight />
                        )}
                      </td>
                      <td className="fw-semibold">{order.orderNumber}</td>
                      <td>
                        {(() => {
                          const statusInfo = getStatusInfo(order.status);
                          return (
                            <span
                              className={`badge bg-${statusInfo.color} bg-opacity-25 text-${statusInfo.color}`}
                              title={statusInfo.message}
                            >
                              {statusInfo.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="fw-bold">
                        ₹{(order.total ?? 0).toFixed(2)}
                      </td>
                      <td>{order.items.length}</td>
                      <td>
                        <span className={`badge bg-${
                          order.paymentMethod === "cod" ? "warning" :
                          order.paymentMethod === "online" ? "success" :
                          order.paymentMethod === "wallet" ? "info" : "secondary"
                        } bg-opacity-25 text-${
                          order.paymentMethod === "cod" ? "warning" :
                          order.paymentMethod === "online" ? "success" :
                          order.paymentMethod === "wallet" ? "info" : "secondary"
                        }`}>
                          {order.paymentMethod === "cod" ? "COD" :
                           order.paymentMethod === "online" ? "Online" :
                           order.paymentMethod === "wallet" ? "Wallet" : "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          order.paymentStatus === "paid" ? "success" :
                          order.paymentStatus === "failed" ? "danger" :
                          order.paymentStatus === "refunded" ? "info" :
                          "warning"
                        } bg-opacity-25 text-${
                          order.paymentStatus === "paid" ? "success" :
                          order.paymentStatus === "failed" ? "danger" :
                          order.paymentStatus === "refunded" ? "info" :
                          "warning"
                        }`}>
                          {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : "Pending"}
                        </span>
                      </td>
                      <td>
                        {order.status === "pending" && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => handleOpenCancelModal(order._id)}
                          >
                            Cancel Order
                          </Button>
                        )}
                        {order.status === "delivered" && (
                          <Button
                            variant="warning"
                            size="sm"
                            className="ms-2"
                            onClick={() => handleOpenReturnModal(order._id)}
                          >
                            Return Order
                          </Button>
                        )}
                        <a
                          href={`/order-confirmation/${order._id}`}
                          className="btn btn-sm btn-outline-primary ms-2"
                        >
                          View
                        </a>
                      </td>
                    </tr>,
                  ];
                  if (expandedOrderId === order._id) {
                    rows.push(
                      <tr key={order._id + "-expanded"}>
                        <td colSpan={9} style={{ background: "#f8f9fa" }}>
                          <div className="p-3">
                            <h6 className="fw-bold mb-3">Order Items</h6>
                            <div className="row g-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={
                                    item.productVariantId._id ||
                                    item.productVariantId
                                  }
                                  className="col-md-6 col-lg-4"
                                >
                                  <div className="d-flex align-items-center border rounded-3 p-2 bg-white">
                                    <div
                                      style={{
                                        width: 56,
                                        height: 56,
                                        cursor: "pointer",
                                      }}
                                      className="me-3 flex-shrink-0"
                                      onClick={() => {
                                        const productId =
                                          item.productVariantId?.product?._id ||
                                          item.productVariantId?.product ||
                                          item.productVariantId;
                                        if (productId)
                                          navigate(`/products/${productId}`);
                                      }}
                                    >
                                      {item.productVariantId?.imageUrls?.[0] ? (
                                        <img
                                          src={
                                            item.productVariantId.imageUrls[0]
                                          }
                                          alt={
                                            item.productVariantId.product?.name
                                          }
                                          className="img-fluid rounded-3"
                                          style={{
                                            width: 56,
                                            height: 56,
                                            objectFit: "cover",
                                            cursor: "pointer",
                                          }}
                                        />
                                      ) : (
                                        <div
                                          className="bg-secondary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
                                          style={{ width: 56, height: 56 }}
                                        ></div>
                                      )}
                                    </div>
                                    <div className="flex-grow-1">
                                      <div
                                        className="fw-semibold text-dark"
                                        style={{
                                          cursor: "pointer",
                                          textDecoration: "underline",
                                        }}
                                        onClick={() => {
                                          const productId =
                                            item.productVariantId?.product
                                              ?._id ||
                                            item.productVariantId?.product ||
                                            item.productVariantId;
                                          if (productId)
                                            navigate(`/products/${productId}`);
                                        }}
                                      >
                                        {item.productVariantId?.product?.name ||
                                          "Product"}
                                      </div>
                                      <div className="text-muted small">
                                        {item.productVariantId?.colour}{" "}
                                        {item.productVariantId?.capacity &&
                                          `- ${item.productVariantId.capacity}`}
                                      </div>
                                      <div className="text-muted small">
                                        Qty: {item.quantity}
                                      </div>
                                      <div className="text-muted small">
                                        Price: ₹
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}
                                      </div>
                                      <div className="mt-1">
                                        {item.cancelled ? (
                                          <span className="badge bg-danger bg-opacity-25 text-danger">
                                            Cancelled
                                          </span>
                                        ) : order.status === "pending" ? (
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() =>
                                              handleOpenCancelModal(
                                                order._id,
                                                item.productVariantId._id ||
                                                  item.productVariantId
                                              )
                                            }
                                          >
                                            Cancel Product
                                          </Button>
                                        ) : (
                                          <span className="badge bg-success bg-opacity-25 text-success">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      {item.cancellationReason &&
                                        item.cancelled && (
                                          <div className="text-muted small mt-1">
                                            Reason: {item.cancellationReason}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4">
                              <h6 className="fw-bold mb-2">
                                Order Status:{" "}
                                {(() => {
                                  const statusInfo = getStatusInfo(order.status);
                                  return (
                                    <span
                                      className={`badge bg-${statusInfo.color} bg-opacity-25 text-${statusInfo.color}`}
                                      title={statusInfo.message}
                                    >
                                      {statusInfo.text}
                                    </span>
                                  );
                                })()}
                              </h6>
                              {/* Status-specific messages */}
                              {(() => {
                                const statusInfo = getStatusInfo(order.status);
                                if (statusInfo.message && (order.status === "return_verified" || order.status === "rejected" || order.status === "returned")) {
                                  return (
                                    <div className={`text-${statusInfo.color} small mb-2`}>
                                      <strong>{statusInfo.text}:</strong> {statusInfo.message}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {order.cancellationReason &&
                                (order.status === "cancelled" || order.status === "returned" || order.status === "return_verified" || order.status === "rejected") && (
                                  <div className="text-muted small">
                                    {order.status === "cancelled"
                                      ? "Order Cancellation Reason: "
                                      : order.status === "rejected"
                                      ? "Return Rejection Reason: "
                                      : "Order Return Reason: "}
                                    {order.cancellationReason}
                                  </div>
                                )}
                              {order.status === "return_verified" && (
                                <div className="text-success small">
                                  <strong>Return Verified:</strong> Your return request has been verified by admin.
                                  {order.paymentStatus === "refunded" && (
                                    <div>
                                      <strong>Refund Processed:</strong> ₹{order.total?.toFixed(2)} has been refunded to your wallet.
                                      {order.paymentMethod === "cod" && (
                                        <div className="text-muted">
                                          <em>This refund was provided as a goodwill gesture for your COD order.</em>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {order.paymentStatus !== "refunded" && (
                                    <div>
                                      <strong>No Refund:</strong> This return was verified without processing a refund.
                                      <div className="text-muted">
                                        <em>This typically occurs when the product was not accepted during delivery.</em>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {order.status === "rejected" && (
                                <div className="text-danger small">
                                  <strong>Return Rejected:</strong> Your return request has been rejected by admin.
                                </div>
                              )}
                              <div className="text-muted small">
                                Order Date:{" "}
                                {(() => {
                                  const d = new Date(order.createdAt);
                                  const day = String(d.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  const month = String(
                                    d.getMonth() + 1
                                  ).padStart(2, "0");
                                  const year = d.getFullYear();
                                  const hours = String(d.getHours()).padStart(
                                    2,
                                    "0"
                                  );
                                  const minutes = String(
                                    d.getMinutes()
                                  ).padStart(2, "0");
                                  return `${day}/${month}/${year}, ${hours}:${minutes}`;
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
              </tbody>
            </table>
          </div>
        )}
        {orders.length > 0 && totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li
                    key={page}
                    className={`page-item${currentPage === page ? " active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(page)}
                      disabled={currentPage === page}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item${currentPage === totalPages ? " disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  // Cancel Orders content
  const cancelOrdersContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5 className="fw-bold mb-3">Cancel Orders</h5>
        <div className="text-center py-5">
          <FaTimesCircle size={48} className="text-muted mb-3" />
          <h6 className="text-muted">Order Cancellation</h6>
          <p className="text-muted small">Cancel your pending orders here</p>
          <p className="text-muted small">This feature is coming soon!</p>
        </div>
      </Card.Body>
    </Card>
  );

  useEffect(() => {
    if (addSuccess) {
      const timer = setTimeout(() => setAddSuccess(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [addSuccess]);

  useEffect(() => {
    if (editAddressSuccess) {
      const timer = setTimeout(() => setEditAddressSuccess(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [editAddressSuccess]);

  useEffect(() => {
    if (editEmailSuccess && editEmailSuccess.includes("updated")) {
      const timer = setTimeout(() => setEditEmailSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [editEmailSuccess]);

  // Handler to open cancel modal
  const handleOpenCancelModal = (orderId, productVariantId = null) => {
    setCancelTarget({ orderId, productVariantId });
    setCancelReason("");
    setShowCancelModal(true);
  };

  // Handler to submit cancellation
  const handleSubmitCancel = async () => {
    if (!cancelTarget) return;
    const { orderId, productVariantId } = cancelTarget;
    try {
      await dispatch(
        cancelOrder({
          orderId,
          reason: cancelReason,
          productVariantIds: productVariantId ? [productVariantId] : undefined,
        })
      ).unwrap();
      setShowCancelModal(false);
      setCancelTarget(null);
      setCancelReason("");
      // Optionally, show a toast or alert for success
    } catch (err) {
      // Optionally, show a toast or alert for error
    }
  };

  // Add state and handler for return modal
  const handleOpenReturnModal = (orderId) => {
    setReturnTarget({ orderId });
    setReturnReason("");
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!returnTarget || !returnReason.trim()) return;
    try {
      await userAxios.post(`/users/orders/${returnTarget.orderId}/return`, { reason: returnReason });
      setShowReturnModal(false);
      setReturnTarget(null);
      setReturnReason("");
      // Refresh orders list
      dispatch(fetchUserOrders());
      // Optionally, show a toast or alert for success
    } catch (err) {
      // Optionally, show a toast or alert for error
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={3}>
          <Card
            className="mb-4 shadow-sm border-0"
            style={{ background: "#f8f9fa" }}
          >
            <Card.Body className="text-center pb-2 pt-4">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Image
                  src={avatar}
                  roundedCircle
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    border: "3px solid #0d6efd",
                    cursor: uploading ? "not-allowed" : "pointer",
                  }}
                  className="mb-2 shadow-sm"
                  alt="User Avatar"
                  onClick={uploading ? undefined : handleAvatarClick}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    background: "#fff",
                    borderRadius: "50%",
                    padding: 4,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    cursor: uploading ? "not-allowed" : "pointer",
                  }}
                  onClick={uploading ? undefined : handleAvatarClick}
                  title="Change profile picture"
                >
                  {uploading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <FaCamera color="#0d6efd" size={18} />
                  )}
                </span>
                <Form style={{ display: "none" }}>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </Form>
              </div>
              <h5 className="fw-bold mb-1 mt-2">
                {user?.username || "User Name"}
              </h5>
              <div className="text-muted small mb-3">
                {user?.email || "user@email.com"}
              </div>
            </Card.Body>
            <ListGroup variant="flush" className="mb-3">
              {sidebarItems.map((item, idx) => (
                <ListGroup.Item
                  key={idx}
                  action
                  style={{
                    cursor: "pointer",
                    background: idx === activeIndex ? "#e7f1ff" : "inherit",
                    color: idx === activeIndex ? "#0d6efd" : "#333",
                    fontWeight: idx === activeIndex ? 600 : 400,
                    borderLeft:
                      idx === activeIndex
                        ? "4px solid #0d6efd"
                        : "4px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 16,
                    padding: "14px 18px",
                  }}
                  className="border-0"
                  onClick={() => setActiveIndex(idx)}
                >
                  <span style={{ fontSize: 18, marginRight: 10 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        <Col md={9}>
          {activeIndex === 0 && userDetailsContent}
          {activeIndex === 1 && editProfileContent}
          {activeIndex === 2 && showAddressContent}
          {activeIndex === 3 && showOrdersContent}
          {activeIndex === 4 && cancelOrdersContent}
          {activeIndex === 5 && forgotPasswordContent}
          {activeIndex === 6 && editEmailContent}
        </Col>
      </Row>
      {/* Add Modal for cancellation reason */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Cancel {cancelTarget?.productVariantId ? "Product" : "Order"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reason for cancellation (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason (optional)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleSubmitCancel}>
            Confirm Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Add Return Order Modal at the end */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Return Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reason for return <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="Enter reason for return (required)"
              required
              isInvalid={!returnReason.trim()}
            />
            <Form.Control.Feedback type="invalid">
              Reason is required.
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnModal(false)}>
            Close
          </Button>
          <Button
            variant="warning"
            onClick={handleSubmitReturn}
            disabled={!returnReason.trim()}
          >
            Confirm Return
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;
