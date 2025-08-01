import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Modal,
} from "react-bootstrap";
import { FaSearch, FaPlus, FaUserTimes, FaUserCheck } from "react-icons/fa";
import AdminLeftbar from "../../components/AdminLeftbar";
import {
  getUsers,
  toggleBlockUser,
} from "../../services/admin/adminUserService";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const usersPerPage = 5;
  const [statusFilter, setStatusFilter] = useState("all"); // 'active', 'blocked', 'all'

  const fetchUsers = async (page = 1, search = "", status = statusFilter) => {
    setLoading(true);
    setError("");

    const result = await getUsers({
      page,
      limit: usersPerPage,
      search,
      status,
    });

    if (result.success) {
      setUsers(result.data.users);
      setTotalPages(result.data.totalPages);
      setTotal(result.data.total);
      setCurrentPage(result.data.page);
    } else {
      setError(result.error || "Failed to fetch users");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, statusFilter);
    // eslint-disable-next-line
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleBlockUnblock = async (user) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  };

  const confirmBlockUnblock = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError("");

    const result = await toggleBlockUser(selectedUser._id);

    if (result.success) {
      fetchUsers(currentPage, searchTerm, statusFilter);
      setShowStatusModal(false);
      setSelectedUser(null);
    } else {
      setError(result.error || "Failed to update user status");
    }

    setLoading(false);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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
                <h2 className="mb-0">User Management</h2>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  onClick={() => navigate("/admin/users/new")}
                  className="d-flex align-items-center gap-2"
                >
                  <FaPlus /> Add User
                </Button>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by email or username"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select value={statusFilter} onChange={handleStatusFilter}>
                  <option value="active">Active Users</option>
                  <option value="blocked">Blocked Users</option>
                  <option value="all">All Users</option>
                </Form.Select>
              </Col>
            </Row>
            {error && <Alert variant="danger">{error}</Alert>}
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <Card className="shadow-sm">
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        users.map((user, idx) => (
                          <tr key={user._id}>
                            <td>
                              {(currentPage - 1) * usersPerPage + idx + 1}
                            </td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge
                                bg={
                                  user.role === "admin"
                                    ? "primary"
                                    : "secondary"
                                }
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={user.isDeleted ? "danger" : "success"}>
                                {user.isDeleted ? "Blocked" : "Active"}
                              </Badge>
                            </td>
                            <td>{formatDateTime(user.createdAt)}</td>
                            <td>
                              {/* Only show block/unblock button for non-admin users */}
                              {user.role !== "admin" && (
                                <Button
                                  variant={user.isDeleted ? "success" : "danger"}
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleBlockUnblock(user)}
                                >
                                  {user.isDeleted ? (
                                    <FaUserCheck />
                                  ) : (
                                    <FaUserTimes />
                                  )}
                                  {user.isDeleted ? " Unblock" : " Block"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>Total Users: {total}</div>
              <Pagination>
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={currentPage === idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
            <Modal
              show={showStatusModal}
              onHide={() => setShowStatusModal(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>
                  {selectedUser?.isDeleted ? "Unblock User" : "Block User"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to{" "}
                {selectedUser?.isDeleted ? "unblock" : "block"} user{" "}
                <b>{selectedUser?.username}</b>?
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant={selectedUser?.isDeleted ? "success" : "danger"}
                  onClick={confirmBlockUnblock}
                >
                  {selectedUser?.isDeleted ? "Unblock" : "Block"}
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default UserManagement;
