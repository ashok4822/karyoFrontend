import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "../../hooks/use-toast";
import { fetchCart } from "../../redux/reducers/cartSlice";
import { createOrder } from "../../redux/reducers/orderSlice";
import {
  fetchShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  setDefaultShippingAddress,
} from "../../redux/reducers/shippingAddressSlice";
import {
  fetchUserActiveDiscounts,
  setSelectedDiscount,
  clearSelectedDiscount,
} from "../../redux/reducers/userDiscountSlice";
import CouponInput from "../../components/CouponInput";
import { Modal, Button, Form, Alert } from "react-bootstrap";

const Checkout = () => {
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const shippingAddress = useSelector((state) => state.shippingAddress);
  const userDiscounts = useSelector((state) => state.userDiscounts);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showEditAddressForm, setShowEditAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [cartInitialized, setCartInitialized] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phoneNumber: "",
    isDefault: false,
  });

  const [editFormData, setEditFormData] = useState({
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

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [codAvailable, setCodAvailable] = useState(true);
  const [codChecking, setCodChecking] = useState(false);
  const [discountsFetchAttempted, setDiscountsFetchAttempted] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Initialize cart if not already done
  useEffect(() => {
    if (!cart.initialized && !cart.loading) {
      dispatch(fetchCart());
    }
  }, [dispatch, cart.initialized, cart.loading]);

  // Mark cart as initialized once it's loaded
  useEffect(() => {
    if (cart.initialized && !cartInitialized) {
      setCartInitialized(true);
    }
  }, [cart.initialized, cartInitialized]);

  // Fetch active discounts when component mounts (prevent infinite loop)
  useEffect(() => {
    if (
      cartInitialized &&
      !userDiscounts.loading &&
      userDiscounts.activeDiscounts.length === 0 &&
      !discountsFetchAttempted &&
      !userDiscounts.error
    ) {
      dispatch(fetchUserActiveDiscounts());
      setDiscountsFetchAttempted(true);
    }
  }, [
    dispatch,
    cartInitialized,
    userDiscounts.loading,
    userDiscounts.activeDiscounts.length,
    discountsFetchAttempted,
    userDiscounts.error,
  ]);

  useEffect(() => {
    // Wait for cart to be initialized before making any checks
    if (!cartInitialized) {
      return;
    }

    // Check if user is authenticated
    if (!auth.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to proceed with checkout",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Redirect if cart is empty (only after cart is initialized)
    if (cart.items.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      navigate("/cart");
      return;
    }

    // Check if there are any disabled items
    const hasDisabledItems = cart.items.some((item) => {
      const variant = item.productVariantId;
      const product = variant?.product;
      const isInactive =
        product?.status === "inactive" || variant?.status === "inactive";
      const isOutOfStock = (variant?.stock || 0) <= 0;
      return isInactive || isOutOfStock;
    });

    if (hasDisabledItems) {
      toast({
        title: "Cannot proceed with checkout",
        description: "Please remove unavailable items from your cart",
        variant: "destructive",
      });
      navigate("/cart");
      return;
    }

    // Fetch shipping addresses only once
    if (!addressesLoaded) {
      dispatch(fetchShippingAddresses());
      setAddressesLoaded(true);
    }

    // Pre-fill form with user data if available
    if (auth.user) {
      setFormData((prev) => ({
        ...prev,
        recipientName: auth.user.firstName || "",
        addressLine1: auth.user.address || "",
        city: auth.user.city || "",
        state: auth.user.state || "",
        postalCode: auth.user.zipCode || "",
        country: auth.user.country || "India",
        phoneNumber: auth.user.phone || "",
      }));
    }
  }, [
    cartInitialized,
    cart.items,
    auth.user,
    navigate,
    dispatch,
    addressesLoaded,
  ]);

  // Set default address when addresses are loaded
  useEffect(() => {
    if (
      shippingAddress.addresses &&
      shippingAddress.addresses.length > 0 &&
      !selectedAddressId &&
      !shippingAddress.loading
    ) {
      const defaultAddress = shippingAddress.addresses.find(
        (addr) => addr.isDefault
      );
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else {
        setSelectedAddressId(shippingAddress.addresses[0]._id);
      }
    }
  }, [shippingAddress.addresses, selectedAddressId, shippingAddress.loading]);

  // Calculation functions
  const getSelectedAddress = () => {
    return shippingAddress.addresses?.find(
      (addr) => addr._id === selectedAddressId
    );
  };

  const calculateSubtotal = () => {
    return cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Update calculateDiscount to use appliedCoupon if present
  const calculateDiscount = () => {
    const discount = appliedCoupon || userDiscounts.selectedDiscount;
    if (!discount) return 0;
    const subtotal = calculateSubtotal();
    let discountAmount = 0;
    if (discount.discountType === "percentage") {
      discountAmount = (subtotal * discount.discountValue) / 100;
      if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
        discountAmount = discount.maximumDiscount;
      }
    } else {
      discountAmount = Math.min(discount.discountValue, subtotal);
    }
    return Math.min(discountAmount, subtotal);
  };

  const calculateSubtotalAfterDiscount = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const calculateShipping = () => {
    const subtotalAfterDiscount = calculateSubtotalAfterDiscount();
    return subtotalAfterDiscount >= 1000 ? 0 : 100; // Free shipping above ₹1000
  };

  const calculateTotal = () => {
    return calculateSubtotalAfterDiscount() + calculateShipping();
  };

  // Check COD availability
  const checkCODAvailability = useCallback(async () => {
    const selectedAddress = getSelectedAddress();
    if (!selectedAddress) return;

    setCodChecking(true);

    const result = await checkCOD(selectedAddress.state, calculateTotal());

    if (result.success) {
      setCodAvailable(result.data.isAvailable);

      if (!result.data.isAvailable && paymentMethod === "cod") {
        setPaymentMethod("online");
      }
    } else {
      console.error("COD check error:", result.error);
      setCodAvailable(false);
      if (paymentMethod === "cod") {
        setPaymentMethod("online");
      }
    }

    setCodChecking(false);
  }, [
    selectedAddressId,
    cart.items,
    userDiscounts.selectedDiscount,
    paymentMethod,
  ]);

  // Check COD availability when address or total changes
  useEffect(() => {
    if (selectedAddressId && cartInitialized) {
      checkCODAvailability();
    }
  }, [selectedAddressId, cartInitialized, checkCODAvailability]);

  // Check COD availability when user switches to COD payment method
  useEffect(() => {
    if (paymentMethod === "cod" && selectedAddressId && cartInitialized) {
      checkCODAvailability();
    }
  }, [paymentMethod, selectedAddressId, cartInitialized, checkCODAvailability]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    setShowNewAddressForm(false);
    setShowEditAddressForm(false);
  };

  const handleAddNewAddress = () => {
    setShowNewAddressForm(true);
    setShowEditAddressForm(false);
    setSelectedAddressId(null);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setEditFormData({
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
    setEditErrors({});
    setShowEditAddressForm(true);
    setShowNewAddressForm(false);
  };

  const handleSetAsDefault = async (addressId) => {
    try {
      await dispatch(setDefaultShippingAddress(addressId)).unwrap();

      toast({
        title: "Default address updated",
        description:
          "The selected address has been set as your default shipping address",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to set default address",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipientName.trim())
      newErrors.recipientName = "Recipient name is required";
    if (!formData.addressLine1.trim())
      newErrors.addressLine1 = "Address line 1 is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.recipientName.trim())
      newErrors.recipientName = "Recipient name is required";
    if (!editFormData.addressLine1.trim())
      newErrors.addressLine1 = "Address line 1 is required";
    if (!editFormData.city.trim()) newErrors.city = "City is required";
    if (!editFormData.state.trim()) newErrors.state = "State is required";
    if (!editFormData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";
    if (!editFormData.country.trim()) newErrors.country = "Country is required";
    if (!editFormData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNewAddress = async () => {
    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields correctly");
      setSuccessMessage("");
      toast({
        title: "Please fix the errors",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      const addressData = {
        recipientName: formData.recipientName,
        addressLine1: formData.addressLine1,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
        isDefault: shippingAddress.addresses.length === 0, // Set as default if first address
      };

      await dispatch(createShippingAddress(addressData)).unwrap();
      setSuccessMessage("Address added successfully");
      setErrorMessage("");
      setTimeout(() => {
        setShowAddressModal(false);
        setSuccessMessage("");
        setFormData({
          recipientName: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          phoneNumber: "",
          isDefault: false,
        });
        setErrors({});
      }, 1200);
    } catch (error) {
      // Check for field-level errors in error.response?.data?.errors or error.errors
      const fieldErrors = error?.errors || error?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object") {
        setErrors(fieldErrors);
        setErrorMessage("Please fix the highlighted fields.");
        setSuccessMessage("");
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted fields.",
          variant: "destructive",
        });
      } else {
        setErrorMessage(
          error.message || "Failed to save address. Please try again."
        );
        setSuccessMessage("");
        toast({
          title: "Failed to save address",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateAddress = async () => {
    if (!validateEditForm()) {
      toast({
        title: "Please fix the errors",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    try {
      setEditLoading(true);
      await dispatch(
        updateShippingAddress({
          id: editingAddress._id,
          addressData: editFormData,
        })
      ).unwrap();

      toast({
        title: "Address updated successfully",
        description: "Your shipping address has been updated",
        variant: "default",
      });

      setShowEditAddressForm(false);
      setEditingAddress(null);
      setEditFormData({
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
      setEditErrors({});
    } catch (error) {
      toast({
        title: "Failed to update address",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDiscountSelect = (discount) => {
    if (userDiscounts.selectedDiscount?._id === discount._id) {
      dispatch(clearSelectedDiscount());
    } else {
      dispatch(setSelectedDiscount(discount));
    }
  };

  const getEligibleDiscounts = () => {
    return userDiscounts.activeDiscounts.filter((discount) => {
      const subtotal = calculateSubtotal();
      // Backend already filters by status, validity, and usage limits
      // Frontend only needs to check minimum amount requirement
      const meetsMinimumAmount = subtotal >= discount.minimumAmount;

      // Additional frontend check for usage limits (backup to backend)
      const hasUsageLeft =
        !discount.maxUsagePerUser ||
        !discount.userUsageCount ||
        discount.userUsageCount < discount.maxUsagePerUser;

      return meetsMinimumAmount && hasUsageLeft;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if an address is selected or new address form is valid
    if (!selectedAddressId && !showNewAddressForm) {
      toast({
        title: "Please select or add a shipping address",
        description: "You need to provide a shipping address to continue",
        variant: "destructive",
      });
      return;
    }

    if (showNewAddressForm && !validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    // Validate COD availability if COD is selected
    if (paymentMethod === "cod" && !codAvailable) {
      toast({
        title: "COD Not Available",
        description:
          "Cash on Delivery is not available for your location or order amount. Please select online payment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let shippingAddressData;

      if (selectedAddressId) {
        // Use selected address
        const selectedAddress = getSelectedAddress();
        shippingAddressData = {
          recipientName: selectedAddress.recipientName,
          addressLine1: selectedAddress.addressLine1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phoneNumber: selectedAddress.phoneNumber,
        };
      } else {
        // Use new address form data
        shippingAddressData = { ...formData };
      }

      const orderData = {
        items: cart.items.map((item) => ({
          productVariantId: item.productVariantId._id,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: shippingAddressData,
        paymentMethod,
        subtotal: calculateSubtotal(),
        subtotalAfterDiscount: calculateSubtotalAfterDiscount(),
        discount: userDiscounts.selectedDiscount
          ? {
              discountId: userDiscounts.selectedDiscount._id,
              discountName: userDiscounts.selectedDiscount.name,
              discountAmount: calculateDiscount(),
              discountType: userDiscounts.selectedDiscount.discountType,
              discountValue: userDiscounts.selectedDiscount.discountValue,
            }
          : null,
        shipping: calculateShipping(),
        total: calculateTotal(),
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      const orderId = result.order?._id;
      toast({
        title: "Order placed successfully!",
        description:
          "Your order has been placed and you will receive a confirmation email shortly.",
        variant: "default",
      });
      // Redirect to order confirmation page with orderId and fresh parameter
      navigate(`/order-confirmation/${orderId}?fresh=true`);
    } catch (error) {
      toast({
        title: "Order failed",
        description:
          error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Optionally, allow retry on error (e.g., via a button)
  const handleRetryFetchDiscounts = () => {
    setDiscountsFetchAttempted(false);
  };

  // Show loading state while cart is being initialized
  if (!cartInitialized || (cart.loading && !cart.initialized)) {
    return (
      <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "1rem" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "1rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Checkout</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          Complete your purchase by filling in the details below
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "2rem",
        }}
      >
        {/* Left Column - Shipping Form */}
        <div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              border: "1px solid #eee",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>
              Shipping Information
            </h2>

            {/* Existing Addresses */}
            {shippingAddress.loading && addressesLoaded ? (
              <div
                style={{
                  marginBottom: "2rem",
                  textAlign: "center",
                  padding: "2rem",
                }}
              >
                <p>Loading shipping addresses...</p>
              </div>
            ) : shippingAddress.addresses &&
              shippingAddress.addresses.length > 0 ? (
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ fontSize: "1.25rem", margin: 0 }}>
                    Select Shipping Address
                  </h3>
                  <span style={{ fontSize: "0.875rem", color: "#666" }}>
                    {shippingAddress.addresses.length} saved address
                    {shippingAddress.addresses.length > 1 ? "es" : ""}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {shippingAddress.addresses.map((address) => (
                    <div
                      key={address._id}
                      style={{
                        border:
                          selectedAddressId === address._id
                            ? "2px solid #4f46e5"
                            : "1px solid #ddd",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        cursor: "pointer",
                        backgroundColor:
                          selectedAddressId === address._id
                            ? "#f8f9ff"
                            : "#fff",
                        position: "relative",
                        transition: "all 0.2s ease",
                        boxShadow:
                          selectedAddressId === address._id
                            ? "0 2px 8px rgba(79, 70, 229, 0.1)"
                            : "none",
                      }}
                      onClick={() => handleAddressSelect(address._id)}
                    >
                      {/* Selection Indicator */}
                      <div
                        style={{
                          position: "absolute",
                          top: "1rem",
                          left: "1rem",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border:
                            selectedAddressId === address._id
                              ? "2px solid #4f46e5"
                              : "2px solid #ddd",
                          backgroundColor:
                            selectedAddressId === address._id
                              ? "#4f46e5"
                              : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selectedAddressId === address._id && (
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#fff",
                            }}
                          />
                        )}
                      </div>

                      {/* Default Badge */}
                      {address.isDefault && (
                        <span
                          style={{
                            position: "absolute",
                            top: "1rem",
                            right: "1rem",
                            backgroundColor: "#10b981",
                            color: "white",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          Default
                        </span>
                      )}

                      {/* Address Content */}
                      <div
                        style={{
                          marginLeft: "2rem",
                          marginRight: address.isDefault ? "6rem" : "2rem",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "0.75rem",
                            fontWeight: "600",
                            fontSize: "1.1rem",
                            color: "#1f2937",
                          }}
                        >
                          {address.recipientName}
                        </div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.95rem",
                            lineHeight: "1.5",
                          }}
                        >
                          <div>{address.addressLine1}</div>
                          {address.addressLine2 && (
                            <div>{address.addressLine2}</div>
                          )}
                          <div style={{ marginTop: "0.25rem" }}>
                            {address.city}, {address.state} {address.postalCode}
                          </div>
                          <div>{address.country}</div>
                          <div
                            style={{
                              marginTop: "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span style={{ color: "#4f46e5" }}>📞</span>
                            <span>{address.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "1rem",
                          right: "1rem",
                          display: "flex",
                          gap: "0.5rem",
                        }}
                      >
                        {!address.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAsDefault(address._id);
                            }}
                            style={{
                              padding: "0.5rem 1rem",
                              background: "transparent",
                              color: "#10b981",
                              border: "1px solid #10b981",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#10b981";
                              e.target.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "transparent";
                              e.target.style.color = "#10b981";
                            }}
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "transparent",
                            color: "#4f46e5",
                            border: "1px solid #4f46e5",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#4f46e5";
                            e.target.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#4f46e5";
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      {/* Selected Indicator */}
                      {selectedAddressId === address._id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "0.5rem",
                            right: "0.5rem",
                            backgroundColor: "#4f46e5",
                            color: "#fff",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <button
                    onClick={() => {
                      setFormData({
                        recipientName: "",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "India",
                        phoneNumber: "",
                        isDefault: false,
                      });
                      setShowAddressModal(true);
                      setErrors({});
                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "transparent",
                      color: "#4f46e5",
                      border: "2px dashed #4f46e5",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#4f46e5";
                      e.target.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#4f46e5";
                    }}
                  >
                    + Add New Address
                  </button>
                </div>

                {/* Selection Instructions */}
                {!selectedAddressId && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: "#fef3c7",
                      border: "1px solid #f59e0b",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#92400e",
                        fontSize: "0.875rem",
                      }}
                    >
                      ⚠️ Please select a shipping address to continue with your
                      order
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Show form for new users with no addresses */}
            {!shippingAddress.loading &&
              (!shippingAddress.addresses ||
                shippingAddress.addresses.length === 0) &&
              !showNewAddressForm && (
                <div
                  style={{
                    marginBottom: "2rem",
                    padding: "2rem",
                    backgroundColor: "#f8fafc",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 1rem",
                        fontSize: "1.5rem",
                      }}
                    >
                      📍
                    </div>
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        marginBottom: "0.5rem",
                        color: "#1f2937",
                      }}
                    >
                      No Saved Addresses
                    </h3>
                    <p
                      style={{ color: "#6b7280", fontSize: "1rem", margin: 0 }}
                    >
                      You don't have any saved addresses. Please add a shipping
                      address to continue with your order.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        recipientName: "",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "India",
                        phoneNumber: "",
                        isDefault: false,
                      });
                      setShowAddressModal(true);
                      setErrors({});
                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    style={{
                      padding: "0.875rem 2rem",
                      background: "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#4338ca";
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow =
                        "0 4px 8px rgba(79, 70, 229, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#4f46e5";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 2px 4px rgba(79, 70, 229, 0.2)";
                    }}
                  >
                    + Add Your First Shipping Address
                  </button>
                </div>
              )}

            {/* New Address Form - moved above Payment Method */}
            <Modal
              show={showAddressModal}
              onHide={() => {
                setShowAddressModal(false);
                setErrors({});
                setSuccessMessage("");
                setErrorMessage("");
                setFormData({
                  recipientName: "",
                  addressLine1: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  postalCode: "",
                  country: "India",
                  phoneNumber: "",
                  isDefault: false,
                });
              }}
              centered
              backdrop="static"
              keyboard={false}
            >
              <Modal.Header closeButton>
                <Modal.Title>Add New Shipping Address</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                {successMessage && (
                  <Alert variant="success">{successMessage}</Alert>
                )}
                <Form autoComplete="off">
                  <Form.Group className="mb-2">
                    <Form.Label>Recipient Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          recipientName: e.target.value,
                        }))
                      }
                      placeholder="Enter recipient name"
                      isInvalid={!!errors.recipientName}
                    />
                    {errors.recipientName && (
                      <Form.Control.Feedback type="invalid">
                        {errors.recipientName}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Address Line 1</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          addressLine1: e.target.value,
                        }))
                      }
                      placeholder="Enter address line 1"
                      isInvalid={!!errors.addressLine1}
                    />
                    {errors.addressLine1 && (
                      <Form.Control.Feedback type="invalid">
                        {errors.addressLine1}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
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
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder="Enter city"
                      isInvalid={!!errors.city}
                    />
                    {errors.city && (
                      <Form.Control.Feedback type="invalid">
                        {errors.city}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, state: e.target.value }))
                      }
                      placeholder="Enter state"
                      isInvalid={!!errors.state}
                    />
                    {errors.state && (
                      <Form.Control.Feedback type="invalid">
                        {errors.state}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="Enter postal code"
                      isInvalid={!!errors.postalCode}
                    />
                    {errors.postalCode && (
                      <Form.Control.Feedback type="invalid">
                        {errors.postalCode}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, country: e.target.value }))
                      }
                      placeholder="Enter country"
                      isInvalid={!!errors.country}
                    />
                    {errors.country && (
                      <Form.Control.Feedback type="invalid">
                        {errors.country}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter phone number"
                      isInvalid={!!errors.phoneNumber}
                    />
                    {errors.phoneNumber && (
                      <Form.Control.Feedback type="invalid">
                        {errors.phoneNumber}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Check
                    className="mb-2"
                    type="checkbox"
                    label="Set as default address"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        isDefault: e.target.checked,
                      }))
                    }
                  />
                  <Button
                    variant="primary"
                    className="w-100 mt-2"
                    type="button"
                    onClick={handleSaveNewAddress}
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Address"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-100 mt-2"
                    type="button"
                    onClick={() => {
                      setShowAddressModal(false);
                      setErrors({});
                      setSuccessMessage("");
                      setErrorMessage("");
                      setFormData({
                        recipientName: "",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "India",
                        phoneNumber: "",
                        isDefault: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>

            {/* Edit Address Modal */}
            <Modal
              show={showEditAddressForm}
              onHide={() => {
                setShowEditAddressForm(false);
                setEditErrors({});
                setEditingAddress(null);
                setEditFormData({
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
              }}
              centered
              backdrop="static"
              keyboard={false}
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Shipping Address</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form autoComplete="off">
                  <Form.Group className="mb-2">
                    <Form.Label>Recipient Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.recipientName}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          recipientName: e.target.value,
                        }))
                      }
                      placeholder="Enter recipient name"
                      isInvalid={!!editErrors.recipientName}
                    />
                    {editErrors.recipientName && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.recipientName}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Address Line 1</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.addressLine1}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          addressLine1: e.target.value,
                        }))
                      }
                      placeholder="Enter address line 1"
                      isInvalid={!!editErrors.addressLine1}
                    />
                    {editErrors.addressLine1 && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.addressLine1}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.addressLine2}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
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
                      value={editFormData.city}
                      onChange={(e) =>
                        setEditFormData((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder="Enter city"
                      isInvalid={!!editErrors.city}
                    />
                    {editErrors.city && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.city}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.state}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          state: e.target.value,
                        }))
                      }
                      placeholder="Enter state"
                      isInvalid={!!editErrors.state}
                    />
                    {editErrors.state && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.state}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.postalCode}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="Enter postal code"
                      isInvalid={!!editErrors.postalCode}
                    />
                    {editErrors.postalCode && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.postalCode}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.country}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          country: e.target.value,
                        }))
                      }
                      placeholder="Enter country"
                      isInvalid={!!editErrors.country}
                    />
                    {editErrors.country && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.country}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={editFormData.phoneNumber}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter phone number"
                      isInvalid={!!editErrors.phoneNumber}
                    />
                    {editErrors.phoneNumber && (
                      <Form.Control.Feedback type="invalid">
                        {editErrors.phoneNumber}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  <Form.Check
                    className="mb-2"
                    type="checkbox"
                    label="Set as default address"
                    checked={editFormData.isDefault}
                    onChange={(e) =>
                      setEditFormData((f) => ({
                        ...f,
                        isDefault: e.target.checked,
                      }))
                    }
                  />
                  <Button
                    variant="primary"
                    className="w-100 mt-2"
                    type="button"
                    onClick={handleUpdateAddress}
                    disabled={editLoading}
                  >
                    {editLoading ? "Updating..." : "Update Address"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-100 mt-2"
                    type="button"
                    onClick={() => {
                      setShowEditAddressForm(false);
                      setEditErrors({});
                      setEditingAddress(null);
                      setEditFormData({
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
                    }}
                  >
                    Cancel
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>

            {/* Payment Method */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
                Payment Method
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    cursor: codAvailable ? "pointer" : "not-allowed",
                    padding: "1rem",
                    borderRadius: "8px",
                    border:
                      paymentMethod === "cod"
                        ? "2px solid #10b981"
                        : "1px solid #ddd",
                    backgroundColor:
                      paymentMethod === "cod" ? "#f0fdf4" : "#fff",
                    opacity: codAvailable ? 1 : 0.6,
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={!codAvailable}
                    style={{ margin: 0, marginTop: "0.25rem" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "1rem",
                        color: "#10b981",
                      }}
                    >
                      Cash on Delivery (COD)
                      {codChecking && (
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#666",
                          }}
                        >
                          Checking availability...
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#666",
                        marginTop: "0.25rem",
                      }}
                    >
                      Pay with cash when your order is delivered. No upfront
                      payment required.
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#10b981",
                        marginTop: "0.5rem",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Secure and convenient
                    </div>
                    {!codAvailable && !codChecking && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#ef4444",
                          marginTop: "0.5rem",
                          fontWeight: "500",
                        }}
                      >
                        ⚠️ Not available for your location or order amount
                      </div>
                    )}
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    cursor: "pointer",
                    padding: "1rem",
                    borderRadius: "8px",
                    border:
                      paymentMethod === "online"
                        ? "2px solid #4f46e5"
                        : "1px solid #ddd",
                    backgroundColor:
                      paymentMethod === "online" ? "#f8f9ff" : "#fff",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ margin: 0, marginTop: "0.25rem" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "1rem",
                        color: "#4f46e5",
                      }}
                    >
                      Online Payment
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#666",
                        marginTop: "0.25rem",
                      }}
                    >
                      Pay securely online using credit/debit cards, UPI, or
                      digital wallets.
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#4f46e5",
                        marginTop: "0.5rem",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Instant confirmation
                    </div>
                  </div>
                </label>
              </div>

              {/* COD Information */}
              {paymentMethod === "cod" && codAvailable && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>
                      ℹ️
                    </span>
                    <span style={{ fontWeight: "600", color: "#10b981" }}>
                      Cash on Delivery Information
                    </span>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.5rem",
                      fontSize: "0.875rem",
                      color: "#374151",
                    }}
                  >
                    <li>Pay the exact amount when your order arrives</li>
                    <li>Keep the exact change ready for faster delivery</li>
                    <li>You can inspect the items before payment</li>
                    <li>No additional charges for COD</li>
                  </ul>
                </div>
              )}

              {/* COD Not Available Warning */}
              {paymentMethod === "cod" && !codAvailable && !codChecking && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                      ⚠️
                    </span>
                    <span style={{ fontWeight: "600", color: "#ef4444" }}>
                      COD Not Available
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "#991b1b",
                    }}
                  >
                    Cash on Delivery is not available for your location or order
                    amount. Please select online payment to continue.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div style={{ position: "sticky", top: "2rem" }}>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              border: "1px solid #eee",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>
              Order Summary
            </h2>

            {/* Payment Method Badge */}
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  backgroundColor:
                    paymentMethod === "cod" ? "#f0fdf4" : "#f8f9ff",
                  color: paymentMethod === "cod" ? "#10b981" : "#4f46e5",
                  border: `1px solid ${
                    paymentMethod === "cod" ? "#bbf7d0" : "#e0e7ff"
                  }`,
                }}
              >
                {paymentMethod === "cod" ? "💰" : "💳"}
                {paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : "Online Payment"}
              </div>
            </div>

            {/* Cart Items */}
            <div style={{ marginBottom: "2rem" }}>
              {cart.items.map((item) => {
                const variant = item.productVariantId;
                const product = variant?.product;

                return (
                  <div
                    key={item.productVariantId._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "1rem 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "4px",
                        marginRight: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {variant?.imageUrls?.[0] ? (
                        <img
                          src={variant.imageUrls[0]}
                          alt={product?.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#999", fontSize: "0.75rem" }}>
                          No Image
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>
                        {product?.name || "Product Name"}
                      </h4>
                      <p
                        style={{
                          margin: "0",
                          color: "#666",
                          fontSize: "0.875rem",
                        }}
                      >
                        {variant?.colour} - {variant?.capacity}
                      </p>
                      <p
                        style={{
                          margin: "0.25rem 0 0 0",
                          color: "#666",
                          fontSize: "0.875rem",
                        }}
                      >
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontWeight: "bold" }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discount Selection */}
            <CouponInput
              orderAmount={calculateSubtotal()}
              appliedCoupon={appliedCoupon}
              onApply={(discount) => {
                setAppliedCoupon(discount);
                dispatch(clearSelectedDiscount());
              }}
              onRemove={() => setAppliedCoupon(null)}
            />

            {getEligibleDiscounts().length > 0 && (
              <div
                style={{
                  marginBottom: "2rem",
                  padding: "1rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
                  Available Discounts
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {/* No Discount Option */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      backgroundColor: !userDiscounts.selectedDiscount
                        ? "#e0e7ff"
                        : "transparent",
                      border: !userDiscounts.selectedDiscount
                        ? "1px solid #4f46e5"
                        : "1px solid #ddd",
                    }}
                  >
                    <input
                      type="radio"
                      name="discount"
                      checked={!userDiscounts.selectedDiscount}
                      onChange={() => dispatch(clearSelectedDiscount())}
                      style={{ margin: 0 }}
                    />
                    <div
                      style={{
                        flex: 1,
                        fontWeight: "500",
                        fontSize: "0.875rem",
                      }}
                    >
                      No Discount
                    </div>
                  </label>
                  {/* Existing discount options below */}
                  {getEligibleDiscounts().map((discount) => (
                    <label
                      key={discount._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        backgroundColor:
                          userDiscounts.selectedDiscount?._id === discount._id
                            ? "#e0e7ff"
                            : "transparent",
                        border:
                          userDiscounts.selectedDiscount?._id === discount._id
                            ? "1px solid #4f46e5"
                            : "1px solid #ddd",
                      }}
                    >
                      <input
                        type="radio"
                        name="discount"
                        checked={
                          userDiscounts.selectedDiscount?._id === discount._id
                        }
                        onChange={() => {
                          handleDiscountSelect(discount);
                          setAppliedCoupon(null);
                        }}
                        style={{ margin: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: "500", fontSize: "0.875rem" }}
                        >
                          {discount.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>
                          {discount.description}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#10b981",
                            fontWeight: "500",
                          }}
                        >
                          {discount.discountType === "percentage"
                            ? `${discount.discountValue}% off`
                            : `₹${discount.discountValue} off`}
                          {discount.minimumAmount > 0 &&
                            ` (Min. ₹${discount.minimumAmount})`}
                          {discount.maximumDiscount &&
                            discount.discountType === "percentage" &&
                            ` (Max. ₹${discount.maximumDiscount})`}
                        </div>
                        {discount.maxUsagePerUser && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#666",
                              marginTop: "0.25rem",
                            }}
                          >
                            Used: {discount.userUsageCount || 0}/
                            {discount.maxUsagePerUser} times
                            {discount.userUsageCount >=
                              discount.maxUsagePerUser && (
                              <span
                                style={{ color: "#ef4444", fontWeight: "500" }}
                              >
                                {" "}
                                (Limit reached)
                              </span>
                            )}
                            {discount.userUsageCount ===
                              discount.maxUsagePerUser - 1 && (
                              <span
                                style={{ color: "#f59e0b", fontWeight: "500" }}
                              >
                                {" "}
                                (Last use!)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div style={{ borderTop: "1px solid #eee", paddingTop: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span>Subtotal:</span>
                <div style={{ textAlign: "right" }}>
                  {appliedCoupon || userDiscounts.selectedDiscount ? (
                    <>
                      <div
                        style={{
                          textDecoration: "line-through",
                          color: "#999",
                          fontSize: "0.875rem",
                        }}
                      >
                        ₹{calculateSubtotal().toFixed(2)}
                      </div>
                      <div style={{ fontWeight: "bold", color: "#10b981" }}>
                        ₹{calculateSubtotalAfterDiscount().toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  )}
                </div>
              </div>

              {appliedCoupon || userDiscounts.selectedDiscount ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#10b981" }}>
                    Discount ({appliedCoupon?.name || userDiscounts.selectedDiscount?.name}):
                  </span>
                  <span style={{ color: "#10b981", fontWeight: "500" }}>
                    -₹{calculateDiscount().toFixed(2)}
                  </span>
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span>Shipping:</span>
                <span>
                  {calculateShipping() === 0
                    ? "Free"
                    : `₹${calculateShipping().toFixed(2)}`}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #eee",
                  fontWeight: "bold",
                  fontSize: "1.125rem",
                }}
              >
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || (!selectedAddressId && !showNewAddressForm)}
              style={{
                width: "100%",
                padding: "1rem",
                background:
                  loading || (!selectedAddressId && !showNewAddressForm)
                    ? "#ccc"
                    : paymentMethod === "cod"
                    ? "#10b981"
                    : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1.125rem",
                fontWeight: "600",
                cursor:
                  loading || (!selectedAddressId && !showNewAddressForm)
                    ? "not-allowed"
                    : "pointer",
                marginTop: "2rem",
                transition: "all 0.2s ease",
                boxShadow:
                  paymentMethod === "cod" &&
                  !loading &&
                  (selectedAddressId || showNewAddressForm)
                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                    : "none",
              }}
            >
              {loading
                ? "Processing..."
                : paymentMethod === "cod"
                ? "Place Order with Cash on Delivery"
                : "Place Order"}
            </button>

            {/* COD Notice */}
            {paymentMethod === "cod" &&
              !loading &&
              (selectedAddressId || showNewAddressForm) && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "6px",
                    border: "1px solid #bbf7d0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#10b981",
                      fontWeight: "500",
                    }}
                  >
                    💰 You'll pay ₹{calculateTotal().toFixed(2)} when your order
                    arrives
                  </div>
                </div>
              )}

            <button
              onClick={() => navigate("/cart")}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "transparent",
                color: "#4f46e5",
                border: "1px solid #4f46e5",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer",
                marginTop: "1rem",
              }}
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
