import React, { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Container, Row, Col, ListGroup, Card, Image, Button, Form, Spinner } from "react-bootstrap";
import { FaUser, FaMapMarkerAlt, FaBoxOpen, FaEdit, FaTimesCircle, FaKey, FaCamera } from "react-icons/fa";
import userAxios from "../../lib/userAxios";

const sidebarItems = [
  { label: "Show user details", icon: <FaUser /> },
  { label: "Show address", icon: <FaMapMarkerAlt /> },
  { label: "Show orders", icon: <FaBoxOpen /> },
  { label: "Edit profile", icon: <FaEdit /> },
  { label: "Cancel orders", icon: <FaTimesCircle /> },
  { label: "Forgot password", icon: <FaKey /> },
];

const UserProfile = () => {
  const activeIndex = 0;
  const { user } = useSelector((state) => state.auth);
  const [avatar, setAvatar] = useState(user?.profileImage || "/profile.png");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
        }
      } catch (err) {
        alert("Image upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

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
                >
                  <span style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</span>
                  {item.label}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        <Col md={9}>
          {/* Main profile content goes here */}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;
