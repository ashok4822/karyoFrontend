import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser,
  FaUserShield,
  FaUserTimes,
  FaUserCheck,
} from 'react-icons/fa';

const AdminUsers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const usersPerPage = 10;

  useEffect(() => {
    dispatch({ type: 'FETCH_USERS' });
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = async () => {
    try {
      await dispatch({
        type: 'UPDATE_USER_STATUS',
        payload: {
          id: selectedUser.id,
          status: selectedUser.status === 'active' ? 'blocked' : 'active',
        },
      });
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await dispatch({ type: 'DELETE_USER', payload: selectedUser.id });
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter ? user.role === roleFilter : true;
      const matchesStatus = statusFilter ? user.status === statusFilter : true;

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      return direction * a[sortField].localeCompare(b[sortField]);
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      blocked: 'danger',
      pending: 'warning',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'primary',
      user: 'secondary',
    };
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Users</h2>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/users/new')}
            className="d-flex align-items-center gap-2"
          >
            <FaPlus /> Add User
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                    dispatch({ type: 'FETCH_USERS' }); // Fetch all users from backend
                  }}
                  disabled={!searchTerm}
                >
                  Clear
                </Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={roleFilter}
                onChange={handleRoleFilter}
                className="d-flex align-items-center gap-2"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="d-flex align-items-center gap-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                <FaFilter /> Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="d-flex align-items-center gap-2">
                    User
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Email
                    <SortIcon field="email" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Role
                    <SortIcon field="role" />
                  </div>
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="d-flex align-items-center gap-2">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <FaUser />
                      </div>
                      <div>
                        <h6 className="mb-0">{user.name}</h6>
                        <small className="text-muted">{user.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaEye /> View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/users/${user.id}/edit`)
                        }
                        className="d-flex align-items-center gap-1"
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button
                        variant={
                          user.status === 'active'
                            ? 'outline-danger'
                            : 'outline-success'
                        }
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowStatusModal(true);
                        }}
                        className="d-flex align-items-center gap-1"
                      >
                        {user.status === 'active' ? (
                          <>
                            <FaUserTimes /> Block
                          </>
                        ) : (
                          <>
                            <FaUserCheck /> Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaTrash /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {currentUsers.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No users found</p>
          </div>
        )}

        {totalPages > 1 && (
          <Card.Footer className="bg-transparent border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {indexOfFirstUser + 1} to{' '}
                {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedUser?.name}? This action
          cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser?.status === 'active'
              ? 'Block User'
              : 'Activate User'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to{' '}
          {selectedUser?.status === 'active' ? 'block' : 'activate'}{' '}
          {selectedUser?.name}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant={selectedUser?.status === 'active' ? 'danger' : 'success'}
            onClick={handleStatusChange}
          >
            {selectedUser?.status === 'active' ? 'Block' : 'Activate'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers; 