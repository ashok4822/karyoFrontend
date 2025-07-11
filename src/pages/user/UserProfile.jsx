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
} from "react-icons/fa";
import Swal from "sweetalert2";
import { loginSuccess, logoutUser } from "../../redux/reducers/authSlice";
import { OTP_EXPIRY_SECONDS } from "../../lib/utils";
import { cancelOrder } from "../../redux/reducers/orderSlice";
import { fetchUserOrders } from "../../services/user/orderService";
import { fetchWalletBalance } from "../../services/user/walletService";
import {
  updateUserProfile,
  uploadProfileImage,
} from "../../services/user/profileService";
import {
  addUserShippingAddress,
  deleteUserShippingAddress,
  fetchUserShippingAddresses,
  setDefaultAddress,
  updateUserShippingAddress,
} from "../../services/user/addressService";
import {
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from "../../services/user/authService";
import {
  getUserProfile,
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
} from "../../services/user/userService";
import { submitReturnRequest } from "../../services/user/orderService";

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
  console.log("(UserProfile.jsx) user : ", user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Note: UserProtectedRoute handles basic authentication
  // We'll handle deleted user case in the useEffect when fetching fresh data
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
  const [forgotPasswordResetToken, setForgotPasswordResetToken] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordTimer, setForgotPasswordTimer] = useState(0);

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);

  // Add state for cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null); // { orderId, productVariantId (optional) }

  // Add state for return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null); // { orderId, items }
  const [returnItems, setReturnItems] = useState([]); // [{ productVariantId, checked, reason }]

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

  // Add state for edit field errors
  const [editFieldErrors, setEditFieldErrors] = useState({});

  // Add state for add field errors
  const [addFieldErrors, setAddFieldErrors] = useState({});

  // Fetch paginated orders from backend
  useEffect(() => {
    if (activeIndex === 3) {
      const loadOrders = async () => {
        try {
          const result = await fetchUserOrders({
            page: currentPage,
            limit: ordersPerPage,
            search: orderSearch,
          });

          if (result.success) {
            // Update Redux state with the fetched orders
            dispatch({
              type: "order/fetchUserOrders/fulfilled",
              payload: { orders: result.data.orders },
            });
            setTotal(result.data.total || 0);
          } else {
            console.error("Failed to fetch user orders:", result.error);
            // Set error in Redux state
            dispatch({
              type: "order/fetchUserOrders/rejected",
              payload: result.error,
            });
          }
        } catch (error) {
          console.error("Error fetching user orders:", error);
          dispatch({
            type: "order/fetchUserOrders/rejected",
            payload: "Failed to fetch orders",
          });
        }
      };

      loadOrders();
    }
  }, [activeIndex, currentPage, ordersPerPage, orderSearch, dispatch]);

  // Calculate correct start and end indices for the current page
  const startOrder =
    orders.length === 0 ? 0 : (currentPage - 1) * ordersPerPage + 1;
  const endOrder =
    orders.length === 0 ? 0 : Math.min(currentPage * ordersPerPage, total);
  const totalPages = Math.ceil(total / ordersPerPage);

  // Keyboard shortcut for clearing filters (Escape key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && activeIndex === 3) {
        clearFilters();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  useEffect(() => {
    const getWallet = async () => {
      setWalletLoading(true);
      setWalletError("");

      const result = await fetchWalletBalance();

      if (result.success) {
        setWalletBalance(result.data.balance);
      } else {
        setWalletError("Could not load wallet");
      }

      setWalletLoading(false);
    };

    getWallet();
  }, []);

  // Clear filters function for orders
  const clearFilters = () => {
    setOrderSearch("");
    setSearchInput("");
    setCurrentPage(1);
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const result = await uploadProfileImage(file);

    if (result.success && result.data?.profileImage) {
      setAvatar(result.data.profileImage);

      dispatch(
        loginSuccess({
          user: { ...user, profileImage: result.data.profileImage },
          userAccessToken,
        })
      );
    } else {
      alert("Image upload failed");
    }

    setUploading(false);
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
          message: "Your return has been verified and processed",
        };
      case "rejected":
        return {
          text: "Return Rejected",
          color: "danger",
          message: "Your return request has been rejected",
        };
      case "returned":
        return {
          text: "Return Requested",
          color: "warning",
          message: "Return request submitted and under review",
        };
      case "delivered":
        return {
          text: "Delivered",
          color: "success",
          message: "Order has been delivered successfully",
        };
      case "cancelled":
        return {
          text: "Cancelled",
          color: "danger",
          message: "Order has been cancelled",
        };
      case "pending":
        return {
          text: "Pending",
          color: "info",
          message: "Order is pending processing",
        };
      default:
        return {
          text: status.charAt(0).toUpperCase() + status.slice(1),
          color: "info",
          message: "Order status updated",
        };
    }
  };

  // Validate edit form
  const validateEditForm = () => {
    const errors = {};
    if (!editForm.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (!/^[A-Za-z]{2,30}$/.test(editForm.firstName.trim())) {
      errors.firstName = "First name must be 2-30 letters";
    }
    if (!editForm.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (!/^[A-Za-z]{2,30}$/.test(editForm.lastName.trim())) {
      errors.lastName = "Last name must be 2-30 letters";
    }
    if (!editForm.mobileNo.trim()) {
      errors.mobileNo = "Mobile number is required";
    } else if (!/^\d{10}$/.test(editForm.mobileNo.trim())) {
      errors.mobileNo = "Mobile number must be 10 digits";
    }
    if (!editForm.address.trim()) {
      errors.address = "Address is required";
    } else if (
      editForm.address.trim().length < 5 ||
      editForm.address.trim().length > 100
    ) {
      errors.address = "Address must be 5-100 characters";
    }
    return errors;
  };

  // Edit Profile submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");

    const errors = validateEditForm();
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setEditLoading(true);

    const result = await updateUserProfile(editForm, userAccessToken);

    if (result.success && result.data?.user) {
      dispatch(loginSuccess({ user: result.data.user, userAccessToken }));
      setEditSuccess("Profile updated successfully");
    } else {
      setEditError(result.error || "Failed to update profile");
    }

    setEditLoading(false);
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

      const getAddresses = async () => {
        const result = await fetchUserShippingAddresses(userAccessToken);

        if (result.success) {
          setShippingAddresses(result.data.addresses || []);
        } else {
          setShippingError("Failed to load addresses");
        }

        setShippingLoading(false);
      };

      getAddresses();
    }
  }, [activeIndex, userAccessToken]);

  // Add new shipping address
  const validateAddAddressForm = () => {
    const errors = {};
    if (!newAddress.recipientName.trim()) {
      errors.recipientName = "Recipient name is required";
    }
    if (!newAddress.addressLine1.trim()) {
      errors.addressLine1 = "Address Line 1 is required";
    }
    if (!newAddress.city.trim()) {
      errors.city = "City is required";
    }
    if (!newAddress.state.trim()) {
      errors.state = "State is required";
    }
    if (!newAddress.postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    } else if (!/^\d{4,10}$/.test(newAddress.postalCode.trim())) {
      errors.postalCode = "Postal code must be 4-10 digits";
    }
    if (!newAddress.country.trim()) {
      errors.country = "Country is required";
    }
    if (!newAddress.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(newAddress.phoneNumber.trim())) {
      errors.phoneNumber = "Phone number must be 10-15 digits";
    }
    return errors;
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");

    const errors = validateAddAddressForm();
    setAddFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAddLoading(false);
      return;
    }

    const result = await addUserShippingAddress(newAddress, userAccessToken);

    if (result.success && result.data?.address) {
      const newAddr = result.data.address;

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
      setAddFieldErrors({});

      // Update address list
      setShippingAddresses((prev) =>
        newAddr.isDefault
          ? [newAddr, ...prev.filter((a) => !a.isDefault)]
          : [...prev, newAddr]
      );
    } else if (result.status === 400 && result.data?.errors) {
      setAddFieldErrors(result.data.errors);
    } else {
      setAddError(result.error || "Failed to add address");
    }

    setAddLoading(false);
  };

  // Set default shipping address
  const handleSetDefault = async (addressId) => {
    setSetDefaultLoadingId(addressId);

    const result = await setDefaultAddress(addressId, userAccessToken);

    if (result.success) {
      const fetchResult = await fetchUserShippingAddresses(userAccessToken);
      if (fetchResult.success) {
        setShippingAddresses(fetchResult.data.addresses || []);
      } else {
        console.error("Failed to refresh addresses:", fetchResult.error);
      }
    } else {
      console.error("Failed to set default address:", result.error);
    }

    setSetDefaultLoadingId(null);
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

    const result = await updateUserShippingAddress(
      editingAddress._id,
      editAddressForm,
      userAccessToken
    );

    if (result.success) {
      setEditAddressSuccess("Address updated successfully");
      setEditAddressModal(false);

      const refreshResult = await fetchUserShippingAddresses(userAccessToken);
      if (refreshResult.success) {
        setShippingAddresses(refreshResult.data.addresses || []);
      } else {
        setEditAddressError("Updated but failed to refresh address list");
      }
    } else {
      setEditAddressError(result.error || "Failed to update address");
    }

    setEditAddressLoading(false);
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

    if (!result.isConfirmed) return;

    setDeleteAddressLoading(addressId);
    setDeleteAddressError("");

    const deleteResult = await deleteUserShippingAddress(
      addressId,
      userAccessToken
    );

    if (deleteResult.success) {
      Swal.fire({
        title: "Deleted!",
        text: "Address has been deleted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      const refreshResult = await fetchUserShippingAddresses(userAccessToken);
      if (refreshResult.success) {
        setShippingAddresses(refreshResult.data.addresses || []);
      } else {
        setDeleteAddressError("Deleted but failed to refresh address list");
      }
    } else {
      const errorMessage = deleteResult.error || "Failed to delete address";
      setDeleteAddressError(errorMessage);
      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }

    setDeleteAddressLoading(null);
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

    const result = await requestPasswordResetOtp(forgotPasswordEmail);

    if (result.success) {
      setForgotPasswordSuccess(
        isResend ? "OTP resent to your email." : "OTP sent to your email."
      );
      setForgotPasswordStep(2);
      setForgotPasswordTimer(OTP_EXPIRY_SECONDS);
    } else {
      setForgotPasswordError(result.error || "Failed to send OTP");
    }

    setForgotPasswordLoading(false);
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

    const result = await verifyPasswordResetOtp(
      forgotPasswordEmail,
      forgotPasswordOtp
    );

    if (result.success) {
      setForgotPasswordSuccess("OTP verified. Please enter your new password.");
      setForgotPasswordStep(3);
      setForgotPasswordTimer(0); // Stop timer
      if (result.data?.resetToken) {
        setForgotPasswordResetToken(result.data.resetToken);
      }
    } else {
      setForgotPasswordError(result.error || "OTP verification failed");
    }

    setForgotPasswordLoading(false);
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

    const result = await resetPassword(
      forgotPasswordEmail,
      forgotPasswordResetToken,
      forgotPasswordNewPassword
    );

    if (result.success) {
      setForgotPasswordSuccess("Password reset successful!");
      // Reset form
      setForgotPasswordStep(1);
      setForgotPasswordEmail("");
      setForgotPasswordOtp("");
      setForgotPasswordNewPassword("");
      setForgotPasswordConfirmPassword("");
      setForgotPasswordResetToken("");
      setForgotPasswordTimer(0);
    } else {
      setForgotPasswordError(result.error || "Password reset failed");
    }

    setForgotPasswordLoading(false);
  };

  // User Details content
  const userDetailsContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        {/* Wallet UI */}
        <div className="d-flex flex-column align-items-center mb-3">
          <div
            style={{
              background: "#f6fafd",
              border: "2px solid #0d6efd",
              borderRadius: 12,
              padding: 12,
              width: "100%",
              maxWidth: 220,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 600, color: "#0d6efd", fontSize: 16 }}>
              Wallet Balance
            </div>
            {walletLoading ? (
              <div className="text-muted small">Loading...</div>
            ) : walletError ? (
              <div className="text-danger small">{walletError}</div>
            ) : (
              <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>
                ₹{walletBalance?.toFixed(2) || "0.00"}
              </div>
            )}
            <a
              href="/wallet"
              style={{
                fontSize: 13,
                color: "#0d6efd",
                textDecoration: "underline",
                display: "block",
                marginTop: 4,
              }}
            >
              View Wallet
            </a>
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
              isInvalid={!!editFieldErrors.firstName}
              isValid={!editFieldErrors.firstName}
            />
            {editFieldErrors.firstName && (
              <Form.Control.Feedback type="invalid">
                {editFieldErrors.firstName}
              </Form.Control.Feedback>
            )}
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
              isInvalid={!!editFieldErrors.lastName}
              isValid={!editFieldErrors.lastName}
            />
            {editFieldErrors.lastName && (
              <Form.Control.Feedback type="invalid">
                {editFieldErrors.lastName}
              </Form.Control.Feedback>
            )}
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
              isInvalid={!!editFieldErrors.mobileNo}
              isValid={!editFieldErrors.mobileNo}
            />
            {editFieldErrors.mobileNo && (
              <Form.Control.Feedback type="invalid">
                {editFieldErrors.mobileNo}
              </Form.Control.Feedback>
            )}
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
              isInvalid={!!editFieldErrors.address}
              isValid={!editFieldErrors.address}
            />
            {editFieldErrors.address && (
              <Form.Control.Feedback type="invalid">
                {editFieldErrors.address}
              </Form.Control.Feedback>
            )}
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
                isInvalid={!!addFieldErrors.recipientName}
              />
              {addFieldErrors.recipientName && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.recipientName}
                </Form.Control.Feedback>
              )}
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
                isInvalid={!!addFieldErrors.addressLine1}
              />
              {addFieldErrors.addressLine1 && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.addressLine1}
                </Form.Control.Feedback>
              )}
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
                isInvalid={!!addFieldErrors.city}
              />
              {addFieldErrors.city && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.city}
                </Form.Control.Feedback>
              )}
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
                isInvalid={!!addFieldErrors.state}
              />
              {addFieldErrors.state && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.state}
                </Form.Control.Feedback>
              )}
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
                isInvalid={!!addFieldErrors.postalCode}
              />
              {addFieldErrors.postalCode && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.postalCode}
                </Form.Control.Feedback>
              )}
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
                isInvalid={!!addFieldErrors.country}
              />
              {addFieldErrors.country && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.country}
                </Form.Control.Feedback>
              )}
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
                isInvalid={!!addFieldErrors.phoneNumber}
              />
              {addFieldErrors.phoneNumber && (
                <Form.Control.Feedback type="invalid">
                  {addFieldErrors.phoneNumber}
                </Form.Control.Feedback>
              )}
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

    const result = await requestEmailChangeOtp(editEmail, userAccessToken);

    if (result.success) {
      setEditEmailSuccess(result.data?.message || "OTP sent to email");
      setOtpTimer(OTP_EXPIRY_SECONDS);
    } else {
      setEditEmailError(
        result.error || "Failed to send OTP. Please try again."
      );
    }

    setEditEmailLoading(false);
  };

  const handleVerifyEmailOtp = async () => {
    setEditEmailError("");
    setEditEmailSuccess("");
    setEditEmailVerifyLoading(true);

    const result = await verifyEmailChangeOtp(
      editEmail,
      editEmailOtp,
      userAccessToken
    );

    if (result.success) {
      setEditEmailSuccess(result.data.message || "Email updated successfully");

      // Update Redux state with new email
      dispatch(
        loginSuccess({
          user: { ...user, email: result.data.email },
          userAccessToken,
        })
      );

      // Cleanup
      setOtpTimer(0);
      setEditEmail("");
      setEditEmailOtp("");
    } else {
      setEditEmailError(
        result.error || "Failed to verify OTP. Please try again."
      );
    }

    setEditEmailVerifyLoading(false);
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
              isInvalid={!!editEmailError}
            />
            {editEmailError && (
              <Form.Control.Feedback type="invalid">
                {editEmailError}
              </Form.Control.Feedback>
            )}
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
              className="d-flex align-items-center"
              onSubmit={(e) => {
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
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ maxWidth: 180 }}
              />
              <button type="submit" className="btn btn-primary btn-sm me-2">
                Search
              </button>
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
            <p className="text-muted small">
              You have not placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Order #</th>
                  <th>Order Date</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Flatten all order items and sort by order date (newest first)
                  const allItems = [];
                  orders.forEach((order) => {
                    order.items.forEach((item) => {
                      allItems.push({
                        ...item,
                        order,
                        orderDate: new Date(order.createdAt),
                      });
                    });
                  });

                  // Sort by order date (newest first)
                  allItems.sort((a, b) => b.orderDate - a.orderDate);

                  return allItems.map((item, index) => {
                    const order = item.order;
                    const itemStatus = item.itemStatus || "pending";
                    const payStatus =
                      item.itemPaymentStatus ||
                      order.paymentStatus ||
                      "pending";

                    return (
                      <tr
                        key={`${order._id}-${
                          item.productVariantId._id || item.productVariantId
                        }-${index}`}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                width: 48,
                                height: 48,
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
                                  src={item.productVariantId.imageUrls[0]}
                                  alt={item.productVariantId.product?.name}
                                  className="img-fluid rounded-3"
                                  style={{
                                    width: 48,
                                    height: 48,
                                    objectFit: "cover",
                                    cursor: "pointer",
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-secondary bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center"
                                  style={{ width: 48, height: 48 }}
                                ></div>
                              )}
                            </div>
                            <div>
                              <div
                                className="fw-semibold text-dark"
                                style={{
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                                onClick={() => {
                                  const productId =
                                    item.productVariantId?.product?._id ||
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
                            </div>
                          </div>
                        </td>
                        <td className="fw-semibold">{order.orderNumber}</td>
                        <td>
                          {(() => {
                            const d = new Date(order.createdAt);
                            const day = String(d.getDate()).padStart(2, "0");
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const year = d.getFullYear();
                            const hours = String(d.getHours()).padStart(2, "0");
                            const minutes = String(d.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            return `${day}/${month}/${year}, ${hours}:${minutes}`;
                          })()}
                        </td>
                        <td>{item.quantity}</td>
                        <td className="fw-bold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td>
                          {(() => {
                            if (item.cancelled) {
                              return (
                                <span className="badge bg-danger bg-opacity-25 text-danger">
                                  Cancelled
                                </span>
                              );
                            } else if (itemStatus === "return_verified") {
                              return (
                                <span className="badge bg-success bg-opacity-25 text-success">
                                  Return Verified
                                </span>
                              );
                            } else if (
                              itemStatus === "returned" ||
                              (item.returned &&
                                itemStatus !== "return_verified")
                            ) {
                              return (
                                <span className="badge bg-warning bg-opacity-25 text-warning">
                                  Return Requested
                                </span>
                              );
                            } else if (itemStatus === "delivered") {
                              return (
                                <span className="badge bg-info bg-opacity-25 text-info">
                                  Delivered
                                </span>
                              );
                            } else {
                              return (
                                <span className="badge bg-secondary bg-opacity-25 text-secondary">
                                  {itemStatus.charAt(0).toUpperCase() +
                                    itemStatus.slice(1)}
                                </span>
                              );
                            }
                          })()}
                        </td>
                        <td>
                          {(() => {
                            let color = "warning";
                            if (payStatus === "paid") color = "success";
                            else if (payStatus === "failed") color = "danger";
                            else if (payStatus === "refunded") color = "info";
                            return (
                              <span
                                className={`badge bg-${color} bg-opacity-25 text-${color}`}
                              >
                                {payStatus.charAt(0).toUpperCase() +
                                  payStatus.slice(1)}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <a
                              href={`/order-confirmation/${order._id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View Order
                            </a>
                            {itemStatus === "delivered" &&
                              !item.cancelled &&
                              !item.returned &&
                              itemStatus !== "return_verified" && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenReturnModal(
                                      order._id,
                                      item.productVariantId._id ||
                                        item.productVariantId
                                    )
                                  }
                                >
                                  Return
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
        {orders.length > 0 && totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4">
            <nav>
              <ul className="pagination mb-0">
                <li
                  className={`page-item${currentPage === 1 ? " disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={`page-item${
                        currentPage === page ? " active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}
                        disabled={currentPage === page}
                      >
                        {page}
                      </button>
                    </li>
                  )
                )}
                <li
                  className={`page-item${
                    currentPage === totalPages ? " disabled" : ""
                  }`}
                >
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
  const handleOpenReturnModal = (orderId, productVariantId = null) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    let itemsToReturn = order.items;
    if (productVariantId) {
      itemsToReturn = order.items.filter(
        (item) =>
          (item.productVariantId._id || item.productVariantId) ===
          productVariantId
      );
    }
    setReturnTarget({ orderId, items: itemsToReturn });
    setReturnItems(
      itemsToReturn.map((item) => ({
        productVariantId: item.productVariantId._id || item.productVariantId,
        checked: true,
        reason: "",
        name: item.productVariantId?.product?.name || "Product",
        details: `${item.productVariantId?.colour || ""} ${
          item.productVariantId?.capacity || ""
        }`.trim(),
      }))
    );
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!returnTarget) return;

    const item = returnItems[0]; // only one item, always checked

    const result = await submitReturnRequest(returnTarget.orderId, [
      {
        productVariantId: item.productVariantId,
        reason: item.reason,
      },
    ]);

    if (result.success) {
      setShowReturnModal(false);
      setReturnTarget(null);
      setReturnItems([]);
      // Refresh orders after return request
      const refreshResult = await fetchUserOrders({
        page: currentPage,
        limit: ordersPerPage,
        search: orderSearch,
      });
      
      if (refreshResult.success) {
        dispatch({
          type: "order/fetchUserOrders/fulfilled",
          payload: { orders: refreshResult.data.orders },
        });
        setTotal(refreshResult.data.total || 0);
      }
      Swal.fire({
        icon: "success",
        title: "Return Requested",
        text: "Your return request has been submitted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Return Failed",
        text:
          result.error ||
          "An error occurred while submitting your return request.",
      });
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("UserProfile: Starting to fetch user profile");
      try {
        const { success, data, error } = await getUserProfile();
        console.log("UserProfile: getUserProfile result:", { success, hasData: !!data, error });

        if (!success) {
          // Check if it's a 401 error (user deleted or token invalid)
          if (error && (error.includes("deleted") || error.includes("401"))) {
            console.log("UserProfile: User is deleted or unauthorized, logging out");
            dispatch(logoutUser());
            navigate("/login", { replace: true });
            return;
          }
          // For other errors, just log them but don't logout
          console.error("UserProfile: Failed to fetch user profile:", error);
          return;
        }

        const user = data.user;
        console.log("UserProfile: Received user data:", { hasUser: !!user, isDeleted: user?.isDeleted });
        
        if (user && user.isDeleted) {
          console.log("UserProfile: User is deleted, logging out");
          dispatch(logoutUser());
          navigate("/login", { replace: true });
          return;
        }

        if (user && !user.isDeleted) {
          console.log("UserProfile: Updating Redux state with user data");
          dispatch(loginSuccess({ user, userAccessToken }));
        }
      } catch (err) {
        console.error("UserProfile: Error fetching user profile:", err);
        // Don't automatically logout on network errors
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line
  }, []);

  // Add useEffect to reset forgotPasswordTimer if step changes away from OTP entry
  useEffect(() => {
    if (forgotPasswordStep !== 2 && forgotPasswordTimer !== 0) {
      setForgotPasswordTimer(0);
    }
  }, [forgotPasswordStep]);

  // Add useEffect to reset otpTimer if not in email OTP entry state
  useEffect(() => {
    // Assuming editEmailSuccess is set to a string containing 'updated' after success
    if (
      editEmailSuccess &&
      editEmailSuccess.includes("updated") &&
      otpTimer !== 0
    ) {
      setOtpTimer(0);
    }
  }, [editEmailSuccess]);

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
          {/* {activeIndex === 4 && cancelOrdersContent} */}
          {activeIndex === 4 && forgotPasswordContent}
          {activeIndex === 5 && editEmailContent}
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
      {/* Add Return Product Modal at the end (per-item only) */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Return Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {returnItems.length > 0 && (
            <div className="border rounded-3 p-2 mb-2">
              <div>
                <strong>{returnItems[0].name}</strong>
                {returnItems[0].details && (
                  <span className="text-muted small ms-2">
                    {returnItems[0].details}
                  </span>
                )}
              </div>
              <Form.Group className="mt-2">
                <Form.Label>Reason for return (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={returnItems[0].reason}
                  onChange={(e) => {
                    const updated = [...returnItems];
                    updated[0].reason = e.target.value;
                    setReturnItems(updated);
                  }}
                  placeholder="Enter reason for return (optional)"
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnModal(false)}>
            Close
          </Button>
          <Button
            variant="warning"
            onClick={handleSubmitReturn}
            disabled={returnItems.length === 0}
          >
            Confirm Return
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;
