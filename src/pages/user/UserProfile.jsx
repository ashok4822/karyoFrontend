import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Container, Row, Col, ListGroup, Card, Image, Button, Form, Spinner, Alert, Modal } from "react-bootstrap";
import { FaUser, FaMapMarkerAlt, FaBoxOpen, FaEdit, FaTimesCircle, FaKey, FaCamera } from "react-icons/fa";
import userAxios from "../../lib/userAxios";
import { loginSuccess } from "../../redux/reducers/authSlice";
import { OTP_EXPIRY_SECONDS } from "../../lib/utils";

const sidebarItems = [
  { label: "User Details", icon: <FaUser /> },
  { label: "Edit profile", icon: <FaEdit /> },
  { label: "Show address", icon: <FaMapMarkerAlt /> },
  { label: "Show orders", icon: <FaBoxOpen /> },
  { label: "Cancel orders", icon: <FaTimesCircle /> },
  { label: "Forgot password", icon: <FaKey /> },
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
  const [editEmail, setEditEmail] = useState("");
  const [editEmailError, setEditEmailError] = useState("");
  const [editEmailSuccess, setEditEmailSuccess] = useState("");
  const [editEmailLoading, setEditEmailLoading] = useState(false);
  const [editEmailOtp, setEditEmailOtp] = useState("");
  const [editEmailVerifyLoading, setEditEmailVerifyLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

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
          dispatch(loginSuccess({ user: { ...user, profileImage: res.data.profileImage }, userAccessToken }));
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Edit Profile submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const res = await userAxios.put(
        "/users/profile",
        editForm,
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
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
      const timer = setTimeout(() => setEditSuccess("") , 5000);
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
      const res = await userAxios.post(
        "/users/shipping-address",
        newAddress,
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
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
      setShippingAddresses((prev) => [res.data.address, ...prev.filter(a => !a.isDefault)]);
      // If new address is default, update others
      if (res.data.address.isDefault) {
        setShippingAddresses((prev) => [res.data.address, ...prev.filter(a => !a.isDefault)]);
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
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );
      // Refetch addresses to update UI
      setShippingLoading(true);
      const res = await userAxios.get("/users/shipping-addresses", {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });
      setShippingAddresses(res.data.addresses || []);
    } catch (err) {
      alert("Failed to set default address");
    } finally {
      setSetDefaultLoadingId(null);
      setShippingLoading(false);
    }
  };

  // User Details content
  const userDetailsContent = (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div className="d-flex flex-column align-items-center mb-4">
          <Image
            src={avatar}
            roundedCircle
            style={{ width: 120, height: 120, objectFit: "cover", border: "4px solid #0d6efd" }}
            className="mb-3 shadow-sm"
            alt="User Avatar"
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
              onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
              placeholder="Enter first name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              value={editForm.lastName}
              onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
              placeholder="Enter last name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mobile Number</Form.Label>
            <Form.Control
              type="tel"
              value={editForm.mobileNo}
              onChange={e => setEditForm(f => ({ ...f, mobileNo: e.target.value }))}
              placeholder="Enter mobile number"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={editForm.address}
              onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
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
        <div className="text-center py-4"><Spinner animation="border" /></div>
      ) : shippingError ? (
        <Alert variant="danger">{shippingError}</Alert>
      ) : (
        <Row>
          {shippingAddresses.length === 0 && <div className="text-muted text-center">No addresses found.</div>}
          {shippingAddresses.map((addr) => (
            <Col md={6} lg={4} key={addr._id || addr.id} className="mb-4">
              <Card className={addr.isDefault ? "border-primary shadow-sm" : "shadow-sm"}>
                <Card.Body>
                  <div className="mb-2 d-flex align-items-center justify-content-between">
                    <div>
                      <strong>{addr.recipientName}</strong>
                      {addr.isDefault && <span className="badge bg-primary ms-2">Default</span>}
                    </div>
                    {!addr.isDefault && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={setDefaultLoadingId === addr._id}
                        onClick={() => handleSetDefault(addr._id)}
                      >
                        {setDefaultLoadingId === addr._id ? <Spinner size="sm" animation="border" /> : "Set as Default"}
                      </Button>
                    )}
                  </div>
                  <div>{addr.addressLine1}</div>
                  {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                  <div>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </div>
                  <div>{addr.country}</div>
                  <div className="mt-2 text-muted small">Phone: {addr.phoneNumber}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
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
                onChange={e => setNewAddress(a => ({ ...a, recipientName: e.target.value }))}
                placeholder="Enter recipient name"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address Line 1</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.addressLine1}
                onChange={e => setNewAddress(a => ({ ...a, addressLine1: e.target.value }))}
                placeholder="Enter address line 1"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address Line 2</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.addressLine2}
                onChange={e => setNewAddress(a => ({ ...a, addressLine2: e.target.value }))}
                placeholder="Enter address line 2 (optional)"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.city}
                onChange={e => setNewAddress(a => ({ ...a, city: e.target.value }))}
                placeholder="Enter city"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>State</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.state}
                onChange={e => setNewAddress(a => ({ ...a, state: e.target.value }))}
                placeholder="Enter state"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.postalCode}
                onChange={e => setNewAddress(a => ({ ...a, postalCode: e.target.value }))}
                placeholder="Enter postal code"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.country}
                onChange={e => setNewAddress(a => ({ ...a, country: e.target.value }))}
                placeholder="Enter country"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={newAddress.phoneNumber}
                onChange={e => setNewAddress(a => ({ ...a, phoneNumber: e.target.value }))}
                placeholder="Enter phone number"
              />
            </Form.Group>
            <Form.Check
              className="mb-2"
              type="checkbox"
              label="Set as default address"
              checked={newAddress.isDefault}
              onChange={e => setNewAddress(a => ({ ...a, isDefault: e.target.checked }))}
            />
            <Button variant="primary" className="w-100 mt-2" type="submit" disabled={addLoading}>
              {addLoading ? "Adding..." : "Add Address"}
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
      dispatch(loginSuccess({ user: { ...user, email: res.data.email }, userAccessToken }));
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
        {editEmailSuccess && <Alert variant="success">{editEmailSuccess}</Alert>}
        <Form autoComplete="off">
          <Form.Group className="mb-3">
            <Form.Label>New Email</Form.Label>
            <Form.Control
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="Enter new email"
              disabled={editEmailLoading || editEmailSuccess}
            />
          </Form.Group>
          <Button variant="primary" type="button" onClick={handleSendEmailOtp} disabled={editEmailLoading || !editEmail || editEmailSuccess} className="mb-3">
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
                  onChange={e => setEditEmailOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                  disabled={editEmailVerifyLoading || otpTimer === 0}
                />
              </Form.Group>
              <div className="mb-2 text-muted">
                {otpTimer > 0
                  ? `OTP expires in ${otpTimer} second${otpTimer !== 1 ? "s" : ""}`
                  : "OTP expired. Please resend OTP."}
              </div>
              <Button variant="success" type="button" onClick={handleVerifyEmailOtp} disabled={editEmailVerifyLoading || !editEmailOtp || otpTimer === 0}>
                {editEmailVerifyLoading ? "Verifying..." : "Verify & Update Email"}
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

  useEffect(() => {
    if (addSuccess) {
      const timer = setTimeout(() => setAddSuccess("") , 2000);
      return () => clearTimeout(timer);
    }
  }, [addSuccess]);

  useEffect(() => {
    if (editEmailSuccess && editEmailSuccess.includes("updated")) {
      const timer = setTimeout(() => setEditEmailSuccess("") , 4000);
      return () => clearTimeout(timer);
    }
  }, [editEmailSuccess]);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={3}>
          <Card className="mb-4 shadow-sm border-0" style={{ background: "#f8f9fa" }}>
            <Card.Body className="text-center pb-2 pt-4">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Image
                  src={avatar}
                  roundedCircle
                  style={{ width: 80, height: 80, objectFit: "cover", border: "3px solid #0d6efd", cursor: uploading ? "not-allowed" : "pointer" }}
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
                  {uploading ? <Spinner animation="border" size="sm" /> : <FaCamera color="#0d6efd" size={18} />}
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
              <h5 className="fw-bold mb-1 mt-2">{user?.username || "User Name"}</h5>
              <div className="text-muted small mb-3">{user?.email || "user@email.com"}</div>
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
                    borderLeft: idx === activeIndex ? "4px solid #0d6efd" : "4px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 16,
                    padding: "14px 18px",
                  }}
                  className="border-0"
                  onClick={() => setActiveIndex(idx)}
                >
                  <span style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</span>
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
          {activeIndex === 6 && editEmailContent}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;
