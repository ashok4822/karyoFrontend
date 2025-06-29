import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "../../hooks/use-toast";
import { fetchCart } from "../../redux/reducers/cartSlice";
import { createOrder } from "../../redux/reducers/orderSlice";
import { fetchShippingAddresses, createShippingAddress, updateShippingAddress } from "../../redux/reducers/shippingAddressSlice";

const Checkout = () => {
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const shippingAddress = useSelector((state) => state.shippingAddress);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showEditAddressForm, setShowEditAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [cartInitialized, setCartInitialized] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
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
        firstName: auth.user.firstName || "",
        lastName: auth.user.lastName || "",
        email: auth.user.email || "",
        phone: auth.user.phone || "",
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";

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
        recipientName: `${formData.firstName} ${formData.lastName}`,
        addressLine1: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipCode,
        country: formData.country,
        phoneNumber: formData.phone,
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
        firstName: "",
        lastName: "",
        email: auth.user?.email || "",
        phone: auth.user?.phone || "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
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

  const getSelectedAddress = () => {
    if (selectedAddressId) {
      return shippingAddress.addresses.find(addr => addr._id === selectedAddressId);
    }
    return null;
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const calculateShipping = () => {
    // Free shipping for orders above ₹500, otherwise ₹50
    return calculateSubtotal() > 500 ? 0 : 50;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
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

    setLoading(true);

    try {
      let shippingAddressData;
      
      if (selectedAddressId) {
        // Use selected address
        const selectedAddress = getSelectedAddress();
        shippingAddressData = {
          firstName: selectedAddress.recipientName.split(' ')[0] || "",
          lastName: selectedAddress.recipientName.split(' ').slice(1).join(' ') || "",
          email: auth.user.email,
          phone: selectedAddress.phoneNumber,
          address: selectedAddress.addressLine1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.postalCode,
          country: selectedAddress.country
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
        shipping: calculateShipping(),
        total: calculateTotal()
      };

      await dispatch(createOrder(orderData)).unwrap();
      
      toast({
        title: "Order placed successfully!",
        description: "Your order has been placed and you will receive a confirmation email shortly.",
        variant: "default",
      });

      // Redirect to order confirmation page
      navigate("/order-confirmation");
      
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
                <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Saved Addresses</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {shippingAddress.addresses.map((address) => (
                    <div
                      key={address._id}
                      style={{
                        border: selectedAddressId === address._id ? "2px solid #4f46e5" : "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "1rem",
                        cursor: "pointer",
                        backgroundColor: selectedAddressId === address._id ? "#f8f9ff" : "#fff",
                        position: "relative"
                      }}
                      onClick={() => handleAddressSelect(address._id)}
                    >
                      {address.isDefault && (
                        <span style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          backgroundColor: "#10b981",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}>
                          Default
                        </span>
                      )}
                      <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                        {address.recipientName}
                      </div>
                      <div style={{ color: "#666", fontSize: "0.875rem", lineHeight: "1.4" }}>
                        <div>{address.addressLine1}</div>
                        {address.addressLine2 && <div>{address.addressLine2}</div>}
                        <div>{address.city}, {address.state} {address.postalCode}</div>
                        <div>{address.country}</div>
                        <div style={{ marginTop: "0.5rem" }}>
                          <strong>Phone:</strong> {address.phoneNumber}
                        </div>
                      </div>
                      <div style={{ 
                        position: "absolute", 
                        top: "0.5rem", 
                        right: address.isDefault ? "5rem" : "0.5rem",
                        display: "flex",
                        gap: "0.5rem"
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          style={{
                            padding: "0.25rem 0.5rem",
                            background: "transparent",
                            color: "#4f46e5",
                            border: "1px solid #4f46e5",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleAddNewAddress}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "transparent",
                    color: "#4f46e5",
                    border: "1px solid #4f46e5",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    marginTop: "1rem"
                  }}
                >
                  + Add New Address
                </button>
              </div>
            ) : null}

            {/* Show form for new users with no addresses */}
            {!shippingAddress.loading && (!shippingAddress.addresses || shippingAddress.addresses.length === 0) && !showNewAddressForm && (
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ color: "#666", marginBottom: "1rem" }}>
                  You don't have any saved addresses. Please add a shipping address to continue.
                </p>
                <button
                  onClick={handleAddNewAddress}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  + Add Shipping Address
                </button>
              </div>
            )}

            {/* New Address Form */}
            {showNewAddressForm && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Add New Address</h3>
                <form>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: errors.firstName ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: errors.lastName ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: errors.email ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: errors.phone ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter phone number"
                      />
                      {errors.phone && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: errors.address ? "1px solid #dc3545" : "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "1rem",
                        resize: "vertical"
                      }}
                      placeholder="Enter your complete address"
                    />
                    {errors.address && (
                      <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
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
                    
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: errors.zipCode ? "1px solid #dc3545" : "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "1rem"
                        }}
                        placeholder="Enter ZIP code"
                      />
                      {errors.zipCode && (
                        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          {errors.zipCode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "1rem"
                      }}
                      placeholder="Enter country"
                    />
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
                        <span>Set as default address</span>
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
              <div style={{ display: "flex", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span>Cash on Delivery</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span>Online Payment</span>
                </label>
              </div>
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

            {/* Price Breakdown */}
            <div style={{ borderTop: "1px solid #eee", paddingTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
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
                background: loading || (!selectedAddressId && !showNewAddressForm) ? "#ccc" : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1.125rem",
                fontWeight: "600",
                cursor: loading || (!selectedAddressId && !showNewAddressForm) ? "not-allowed" : "pointer",
                marginTop: "2rem"
              }}
            >
              {loading ? "Processing..." : "Place Order"}
            </button>

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
    </div>
  );
};

export default Checkout; 