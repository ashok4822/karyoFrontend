import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "../../hooks/use-toast";
import { fetchCart } from "../../redux/reducers/cartSlice";
import { createOrder } from "../../redux/reducers/orderSlice";
import { fetchShippingAddresses, createShippingAddress, updateShippingAddress, setDefaultShippingAddress } from "../../redux/reducers/shippingAddressSlice";
import { fetchUserActiveDiscounts, setSelectedDiscount, clearSelectedDiscount } from "../../redux/reducers/userDiscountSlice";
import userAxios from "../../lib/userAxios";

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
  }, [dispatch, cartInitialized, userDiscounts.loading, userDiscounts.activeDiscounts.length, discountsFetchAttempted, userDiscounts.error]);

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
    const hasDisabledItems = cart.items.some(item => {
      const variant = item.productVariantId;
      const product = variant?.product;
      const isInactive = product?.status === 'inactive' || variant?.status === 'inactive';
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
      setFormData(prev => ({
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
  }, [cartInitialized, cart.items, auth.user, navigate, dispatch, addressesLoaded]);

  // Set default address when addresses are loaded
  useEffect(() => {
    if (shippingAddress.addresses && shippingAddress.addresses.length > 0 && !selectedAddressId && !shippingAddress.loading) {
      const defaultAddress = shippingAddress.addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else {
        setSelectedAddressId(shippingAddress.addresses[0]._id);
      }
    }
  }, [shippingAddress.addresses, selectedAddressId, shippingAddress.loading]);

  // Calculation functions
  const getSelectedAddress = () => {
    return shippingAddress.addresses?.find(addr => addr._id === selectedAddressId);
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!userDiscounts.selectedDiscount) return 0;
    
    const subtotal = calculateSubtotal();
    const discount = userDiscounts.selectedDiscount;
    
    let discountAmount = 0;
    
    if (discount.discountType === "percentage") {
      discountAmount = (subtotal * discount.discountValue) / 100;
      
      // Apply maximum discount limit if set
      if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
        discountAmount = discount.maximumDiscount;
      }
    } else {
      discountAmount = Math.min(discount.discountValue, subtotal);
    }
    
    // Ensure discount doesn't exceed order amount
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
    try {
      const response = await userAxios.post('/orders/check-cod', {
        state: selectedAddress.state,
        total: calculateTotal()
      });
      
      setCodAvailable(response.data.isAvailable);
      
      // If COD is not available and currently selected, switch to online payment
      if (!response.data.isAvailable && paymentMethod === "cod") {
        setPaymentMethod("online");
      }
    } catch (error) {
      console.error("Error checking COD availability:", error);
      setCodAvailable(false);
      // If there's an error and COD is currently selected, switch to online payment
      if (paymentMethod === "cod") {
        setPaymentMethod("online");
      }
    } finally {
      setCodChecking(false);
    }
  }, [selectedAddressId, cart.items, userDiscounts.selectedDiscount, paymentMethod]);

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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ""
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
        description: "The selected address has been set as your default shipping address",
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

    if (!formData.recipientName.trim()) newErrors.recipientName = "Recipient name is required";
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address line 1 is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.recipientName.trim()) newErrors.recipientName = "Recipient name is required";
    if (!editFormData.addressLine1.trim()) newErrors.addressLine1 = "Address line 1 is required";
    if (!editFormData.city.trim()) newErrors.city = "City is required";
    if (!editFormData.state.trim()) newErrors.state = "State is required";
    if (!editFormData.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    if (!editFormData.country.trim()) newErrors.country = "Country is required";
    if (!editFormData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNewAddress = async () => {
    if (!validateForm()) {
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
      
      toast({
        title: "Address saved successfully",
        description: "Your new shipping address has been saved",
        variant: "default",
      });

      setShowNewAddressForm(false);
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
      
    } catch (error) {
      toast({
        title: "Failed to save address",
        description: error.message || "Please try again",
        variant: "destructive",
      });
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
      await dispatch(updateShippingAddress({ id: editingAddress._id, addressData: editFormData })).unwrap();
      
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
    return userDiscounts.activeDiscounts.filter(discount => {
      const subtotal = calculateSubtotal();
      // Backend already filters by status, validity, and usage limits
      // Frontend only needs to check minimum amount requirement
      const meetsMinimumAmount = subtotal >= discount.minimumAmount;
      
      // Additional frontend check for usage limits (backup to backend)
      const hasUsageLeft = !discount.maxUsagePerUser || 
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
        description: "Cash on Delivery is not available for your location or order amount. Please select online payment.",
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
        items: cart.items.map(item => ({
          productVariantId: item.productVariantId._id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: shippingAddressData,
        paymentMethod,
        subtotal: calculateSubtotal(),
        subtotalAfterDiscount: calculateSubtotalAfterDiscount(),
        discount: userDiscounts.selectedDiscount ? {
          discountId: userDiscounts.selectedDiscount._id,
          discountName: userDiscounts.selectedDiscount.name,
          discountAmount: calculateDiscount(),
          discountType: userDiscounts.selectedDiscount.discountType,
          discountValue: userDiscounts.selectedDiscount.discountValue
        } : null,
        shipping: calculateShipping(),
        total: calculateTotal()
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      const orderId = result.order?._id;
      toast({
        title: "Order placed successfully!",
        description: "Your order has been placed and you will receive a confirmation email shortly.",
        variant: "default",
      });
      // Redirect to order confirmation page with orderId
      navigate(`/order-confirmation/${orderId}`);
      
    } catch (error) {
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order. Please try again.",
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
        {/* Left Column - Shipping Form */}
        <div>
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "2rem", 
            borderRadius: "8px", 
            border: "1px solid #eee",
            marginBottom: "2rem"
          }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Shipping Information</h2>
            
            {/* Existing Addresses */}
            {shippingAddress.loading && addressesLoaded ? (
              <div style={{ marginBottom: "2rem", textAlign: "center", padding: "2rem" }}>
                <p>Loading shipping addresses...</p>
              </div>
            ) : shippingAddress.addresses && shippingAddress.addresses.length > 0 ? (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: 0 }}>Select Shipping Address</h3>
                  <span style={{ fontSize: "0.875rem", color: "#666" }}>
                    {shippingAddress.addresses.length} saved address{shippingAddress.addresses.length > 1 ? 'es' : ''}
                  </span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {shippingAddress.addresses.map((address) => (
                    <div
                      key={address._id}
                      style={{
                        border: selectedAddressId === address._id ? "2px solid #4f46e5" : "1px solid #ddd",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        cursor: "pointer",
                        backgroundColor: selectedAddressId === address._id ? "#f8f9ff" : "#fff",
                        position: "relative",
                        transition: "all 0.2s ease",
                        boxShadow: selectedAddressId === address._id ? "0 2px 8px rgba(79, 70, 229, 0.1)" : "none"
                      }}
                      onClick={() => handleAddressSelect(address._id)}
                    >
                      {/* Selection Indicator */}
                      <div style={{
                        position: "absolute",
                        top: "1rem",
                        left: "1rem",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        border: selectedAddressId === address._id ? "2px solid #4f46e5" : "2px solid #ddd",
                        backgroundColor: selectedAddressId === address._id ? "#4f46e5" : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {selectedAddressId === address._id && (
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#fff"
                          }} />
                        )}
                      </div>

                      {/* Default Badge */}
                      {address.isDefault && (
                        <span style={{
                          position: "absolute",
                          top: "1rem",
                          right: "1rem",
                          backgroundColor: "#10b981",
                          color: "white",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}>
                          Default
                        </span>
                      )}

                      {/* Address Content */}
                      <div style={{ marginLeft: "2rem", marginRight: address.isDefault ? "6rem" : "2rem" }}>
                        <div style={{ marginBottom: "0.75rem", fontWeight: "600", fontSize: "1.1rem", color: "#1f2937" }}>
                          {address.recipientName}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: "1.5" }}>
                          <div>{address.addressLine1}</div>
                          {address.addressLine2 && <div>{address.addressLine2}</div>}
                          <div style={{ marginTop: "0.25rem" }}>
                            {address.city}, {address.state} {address.postalCode}
                          </div>
                          <div>{address.country}</div>
                          <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ color: "#4f46e5" }}>📞</span>
                            <span>{address.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        position: "absolute", 
                        bottom: "1rem", 
                        right: "1rem",
                        display: "flex",
                        gap: "0.5rem"
                      }}>
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
                              transition: "all 0.2s ease"
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
                            transition: "all 0.2s ease"
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
                        <div style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          backgroundColor: "#4f46e5",
                          color: "#fff",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}>
                          Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <button
                    onClick={handleAddNewAddress}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "transparent",
                      color: "#4f46e5",
                      border: "2px dashed #4f46e5",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "500",
                      transition: "all 0.2s ease"
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
                  <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: 0, color: "#92400e", fontSize: "0.875rem" }}>
                      ⚠️ Please select a shipping address to continue with your order
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Show form for new users with no addresses */}
            {!shippingAddress.loading && (!shippingAddress.addresses || shippingAddress.addresses.length === 0) && !showNewAddressForm && (
              <div style={{ 
                marginBottom: "2rem",
                padding: "2rem",
                backgroundColor: "#f8fafc",
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#e2e8f0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    fontSize: "1.5rem"
                  }}>
                    📍
                  </div>
                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "#1f2937" }}>
                    No Saved Addresses
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "1rem", margin: 0 }}>
                    You don't have any saved addresses. Please add a shipping address to continue with your order.
                  </p>
                </div>
                <button
                  onClick={handleAddNewAddress}
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
                    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#4338ca";
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 4px 8px rgba(79, 70, 229, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#4f46e5";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 4px rgba(79, 70, 229, 0.2)";
                  }}
                >
                  + Add Your First Shipping Address
                </button>
              </div>
            )}

            {/* Edit Address Modal */}
            {showEditAddressForm && editingAddress && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem"
              }}>
                <div style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  padding: "2rem",
                  maxWidth: "600px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  position: "relative"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "1rem"
                  }}>
                    <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Edit Address</h3>
                    <button
                      onClick={() => {
                        setShowEditAddressForm(false);
                        setEditingAddress(null);
                        setEditErrors({});
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        color: "#666",
                        padding: "0.25rem",
                        borderRadius: "4px",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <form>
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        name="recipientName"
                        value={editFormData.recipientName}
                        onChange={handleEditInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: editErrors.recipientName ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter recipient name"
                      />
                      {editErrors.recipientName && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {editErrors.recipientName}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        name="addressLine1"
                        value={editFormData.addressLine1}
                        onChange={handleEditInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: editErrors.addressLine1 ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter address line 1"
                      />
                      {editErrors.addressLine1 && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {editErrors.addressLine1}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="addressLine2"
                        value={editFormData.addressLine2}
                        onChange={handleEditInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter address line 2 (optional)"
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={editFormData.city}
                          onChange={handleEditInputChange}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: editErrors.city ? "1px solid #dc3545" : "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "1rem"
                          }}
                          placeholder="Enter city"
                        />
                        {editErrors.city && (
                          <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                            {editErrors.city}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={editFormData.state}
                          onChange={handleEditInputChange}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: editErrors.state ? "1px solid #dc3545" : "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "1rem"
                          }}
                          placeholder="Enter state"
                        />
                        {editErrors.state && (
                          <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                            {editErrors.state}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={editFormData.postalCode}
                          onChange={handleEditInputChange}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: editErrors.postalCode ? "1px solid #dc3545" : "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "1rem"
                          }}
                          placeholder="Enter postal code"
                        />
                        {editErrors.postalCode && (
                          <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                            {editErrors.postalCode}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                          Country *
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={editFormData.country}
                          onChange={handleEditInputChange}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: editErrors.country ? "1px solid #dc3545" : "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "1rem"
                          }}
                          placeholder="Enter country"
                        />
                        {editErrors.country && (
                          <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                            {editErrors.country}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={editFormData.phoneNumber}
                        onChange={handleEditInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: editErrors.phoneNumber ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter phone number"
                      />
                      {editErrors.phoneNumber && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {editErrors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={editFormData.isDefault}
                          onChange={handleEditInputChange}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontWeight: "500" }}>Set as default address</span>
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditAddressForm(false);
                          setEditingAddress(null);
                          setEditErrors({});
                        }}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: "transparent",
                          color: "#666",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "1rem"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateAddress}
                        disabled={editLoading}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: editLoading ? "#ccc" : "#4f46e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: editLoading ? "not-allowed" : "pointer",
                          fontSize: "1rem"
                        }}
                      >
                        {editLoading ? "Updating..." : "Update Address"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Payment Method</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label 
                  style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: "0.75rem", 
                    cursor: codAvailable ? "pointer" : "not-allowed",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: paymentMethod === "cod" ? "2px solid #10b981" : "1px solid #ddd",
                    backgroundColor: paymentMethod === "cod" ? "#f0fdf4" : "#fff",
                    opacity: codAvailable ? 1 : 0.6,
                    transition: "all 0.2s ease"
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
                    <div style={{ fontWeight: "600", fontSize: "1rem", color: "#10b981" }}>
                      Cash on Delivery (COD)
                      {codChecking && (
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#666" }}>
                          Checking availability...
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
                      Pay with cash when your order is delivered. No upfront payment required.
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.5rem", fontWeight: "500" }}>
                      ✓ Secure and convenient
                    </div>
                    {!codAvailable && !codChecking && (
                      <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.5rem", fontWeight: "500" }}>
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
                    border: paymentMethod === "online" ? "2px solid #4f46e5" : "1px solid #ddd",
                    backgroundColor: paymentMethod === "online" ? "#f8f9ff" : "#fff",
                    transition: "all 0.2s ease"
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
                    <div style={{ fontWeight: "600", fontSize: "1rem", color: "#4f46e5" }}>
                      Online Payment
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
                      Pay securely online using credit/debit cards, UPI, or digital wallets.
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#4f46e5", marginTop: "0.5rem", fontWeight: "500" }}>
                      ✓ Instant confirmation
                    </div>
                  </div>
                </label>
              </div>
              
              {/* COD Information */}
              {paymentMethod === "cod" && codAvailable && (
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "1rem", 
                  backgroundColor: "#f0fdf4", 
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>ℹ️</span>
                    <span style={{ fontWeight: "600", color: "#10b981" }}>Cash on Delivery Information</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "0.875rem", color: "#374151" }}>
                    <li>Pay the exact amount when your order arrives</li>
                    <li>Keep the exact change ready for faster delivery</li>
                    <li>You can inspect the items before payment</li>
                    <li>No additional charges for COD</li>
                  </ul>
                </div>
              )}

              {/* COD Not Available Warning */}
              {paymentMethod === "cod" && !codAvailable && !codChecking && (
                <div style={{ 
                  marginTop: "1rem", 
                  padding: "1rem", 
                  backgroundColor: "#fef2f2", 
                  borderRadius: "8px",
                  border: "1px solid #fecaca"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#ef4444", fontWeight: "bold" }}>⚠️</span>
                    <span style={{ fontWeight: "600", color: "#ef4444" }}>COD Not Available</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#991b1b" }}>
                    Cash on Delivery is not available for your location or order amount. Please select online payment to continue.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div style={{ position: "sticky", top: "2rem" }}>
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "2rem", 
            borderRadius: "8px", 
            border: "1px solid #eee"
          }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>Order Summary</h2>
            
            {/* Payment Method Badge */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.875rem",
                fontWeight: "600",
                backgroundColor: paymentMethod === "cod" ? "#f0fdf4" : "#f8f9ff",
                color: paymentMethod === "cod" ? "#10b981" : "#4f46e5",
                border: `1px solid ${paymentMethod === "cod" ? "#bbf7d0" : "#e0e7ff"}`
              }}>
                {paymentMethod === "cod" ? "💰" : "💳"}
                {paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
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
                      borderBottom: "1px solid #eee"
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
                        justifyContent: "center"
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
                            borderRadius: "4px"
                          }}
                        />
                      ) : (
                        <span style={{ color: "#999", fontSize: "0.75rem" }}>No Image</span>
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>
                        {product?.name || "Product Name"}
                      </h4>
                      <p style={{ margin: "0", color: "#666", fontSize: "0.875rem" }}>
                        {variant?.colour} - {variant?.capacity}
                      </p>
                      <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.875rem" }}>
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
            {getEligibleDiscounts().length > 0 && (
              <div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>Available Discounts</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {/* No Discount Option */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      backgroundColor: !userDiscounts.selectedDiscount ? "#e0e7ff" : "transparent",
                      border: !userDiscounts.selectedDiscount ? "1px solid #4f46e5" : "1px solid #ddd"
                    }}
                  >
                    <input
                      type="radio"
                      name="discount"
                      checked={!userDiscounts.selectedDiscount}
                      onChange={() => dispatch(clearSelectedDiscount())}
                      style={{ margin: 0 }}
                    />
                    <div style={{ flex: 1, fontWeight: "500", fontSize: "0.875rem" }}>
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
                        backgroundColor: userDiscounts.selectedDiscount?._id === discount._id ? "#e0e7ff" : "transparent",
                        border: userDiscounts.selectedDiscount?._id === discount._id ? "1px solid #4f46e5" : "1px solid #ddd"
                      }}
                    >
                      <input
                        type="radio"
                        name="discount"
                        checked={userDiscounts.selectedDiscount?._id === discount._id}
                        onChange={() => handleDiscountSelect(discount)}
                        style={{ margin: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                          {discount.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>
                          {discount.description}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "500" }}>
                          {discount.discountType === "percentage" 
                            ? `${discount.discountValue}% off` 
                            : `₹${discount.discountValue} off`
                          }
                          {discount.minimumAmount > 0 && ` (Min. ₹${discount.minimumAmount})`}
                          {discount.maximumDiscount && discount.discountType === "percentage" && 
                            ` (Max. ₹${discount.maximumDiscount})`
                          }
                        </div>
                        {discount.maxUsagePerUser && (
                          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                            Used: {discount.userUsageCount || 0}/{discount.maxUsagePerUser} times
                            {discount.userUsageCount >= discount.maxUsagePerUser && (
                              <span style={{ color: "#ef4444", fontWeight: "500" }}> (Limit reached)</span>
                            )}
                            {discount.userUsageCount === discount.maxUsagePerUser - 1 && (
                              <span style={{ color: "#f59e0b", fontWeight: "500" }}> (Last use!)</span>
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Subtotal:</span>
                <div style={{ textAlign: "right" }}>
                  {userDiscounts.selectedDiscount ? (
                    <>
                      <div style={{ textDecoration: "line-through", color: "#999", fontSize: "0.875rem" }}>
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
              
              {userDiscounts.selectedDiscount && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#10b981" }}>Discount ({userDiscounts.selectedDiscount.name}):</span>
                  <span style={{ color: "#10b981", fontWeight: "500" }}>
                    -₹{calculateDiscount().toFixed(2)}
                  </span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Shipping:</span>
                <span>{calculateShipping() === 0 ? "Free" : `₹${calculateShipping().toFixed(2)}`}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #eee",
                fontWeight: "bold",
                fontSize: "1.125rem"
              }}>
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
                background: loading || (!selectedAddressId && !showNewAddressForm) ? "#ccc" : 
                          paymentMethod === "cod" ? "#10b981" : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1.125rem",
                fontWeight: "600",
                cursor: loading || (!selectedAddressId && !showNewAddressForm) ? "not-allowed" : "pointer",
                marginTop: "2rem",
                transition: "all 0.2s ease",
                boxShadow: paymentMethod === "cod" && !loading && (selectedAddressId || showNewAddressForm) ? 
                          "0 4px 12px rgba(16, 185, 129, 0.3)" : "none"
              }}
            >
              {loading ? "Processing..." : 
               paymentMethod === "cod" ? "Place Order with Cash on Delivery" : "Place Order"}
            </button>

            {/* COD Notice */}
            {paymentMethod === "cod" && !loading && (selectedAddressId || showNewAddressForm) && (
              <div style={{ 
                marginTop: "1rem", 
                padding: "0.75rem", 
                backgroundColor: "#f0fdf4", 
                borderRadius: "6px",
                border: "1px solid #bbf7d0",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: "500" }}>
                  💰 You'll pay ₹{calculateTotal().toFixed(2)} when your order arrives
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
                marginTop: "1rem"
              }}
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>

      {/* New Address Form */}
      {showNewAddressForm && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Add New Address</h3>
          <form>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Recipient Name *
              </label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: errors.recipientName ? "1px solid #dc3545" : "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
                placeholder="Enter recipient name"
              />
              {errors.recipientName && (
                <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {errors.recipientName}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Address Line 1 *
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: errors.addressLine1 ? "1px solid #dc3545" : "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
                placeholder="Enter address line 1"
              />
              {errors.addressLine1 && (
                <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {errors.addressLine1}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
                placeholder="Enter address line 2 (optional)"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: errors.city ? "1px solid #dc3545" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    {errors.city}
                  </p>
                )}
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: errors.state ? "1px solid #dc3545" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: errors.postalCode ? "1px solid #dc3545" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                  placeholder="Enter postal code"
                />
                {errors.postalCode && (
                  <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    {errors.postalCode}
                  </p>
                )}
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: errors.country ? "1px solid #dc3545" : "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                  placeholder="Enter country"
                />
                {errors.country && (
                  <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    {errors.country}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: errors.phoneNumber ? "1px solid #dc3545" : "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
                placeholder="Enter phone number"
              />
              {errors.phoneNumber && (
                <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  style={{ margin: 0 }}
                />
                <span style={{ fontWeight: "500" }}>Set as default address</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="button"
                onClick={handleSaveNewAddress}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                Save Address
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewAddressForm(false);
                  setErrors({});
                  if (shippingAddress.addresses && shippingAddress.addresses.length > 0) {
                    const defaultAddress = shippingAddress.addresses.find(addr => addr.isDefault);
                    setSelectedAddressId(defaultAddress ? defaultAddress._id : shippingAddress.addresses[0]._id);
                  }
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Checkout; 