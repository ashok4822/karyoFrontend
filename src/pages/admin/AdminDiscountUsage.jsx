import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
} from 'react-bootstrap';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUsers,
  FaChartBar,
} from 'react-icons/fa';
import AdminLeftbar from '../../components/AdminLeftbar';
import {
  fetchDiscounts,
  clearError,
} from '../../redux/reducers/discountSlice';
import adminAxios from '../../lib/adminAxios';
import Swal from 'sweetalert2';

const AdminDiscountUsage = () => {
  const dispatch = useDispatch();
  const { discounts } = useSelector((state) => state.discounts);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [usageStats, setUsageStats] = useState(null);
  const [userUsages, setUserUsages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    // Fetch discounts for dropdown
    dispatch(fetchDiscounts({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchUsageStats();
    } else if (activeTab === 'details' && selectedDiscount) {
      fetchUserUsages();
    }
  }, [activeTab, selectedDiscount, searchQuery, currentPage]);

  const fetchUsageStats = async () => {
    setLoading(true);
    try {
      const response = await adminAxios.get('/discounts/usage-stats', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery,
        }
      });
      setUsageStats(response.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch usage statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserUsages = async () => {
    setLoading(true);
    try {
      const response = await adminAxios.get(`/discounts/${selectedDiscount}/user-usage`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery,
        }
      });
      setUserUsages(response.data.userUsages);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch user usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountChange = (discountId) => {
    setSelectedDiscount(discountId);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSortIcon = (key) => {
    return <FaSort className="text-muted" />;
  };

  return (
    <Container fluid>
      <Row>
        <Col md={2}>
          <AdminLeftbar />
        </Col>
        <Col md={10} className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Discount Usage Analytics</h2>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
            <Tab eventKey="summary" title="Usage Summary">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Overall Usage Statistics</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading usage statistics...</p>
                    </div>
                  ) : usageStats ? (
                    <>
                      <Row className="mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Search Discounts</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaSearch />
                              </span>
                              <Form.Control
                                type="text"
                                placeholder="Search by discount name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="table-responsive">
                        <Table hover className="align-middle">
                          <thead>
                            <tr>
                              <th>Discount Name</th>
                              <th>Total Users</th>
                              <th>Total Usage</th>
                              <th>Avg Usage Per User</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageStats.discountSummary?.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">
                                  No usage data found.
                                </td>
                              </tr>
                            ) : (
                              usageStats.discountSummary?.map((summary, index) => (
                                <tr key={index}>
                                  <td>{summary.discountName}</td>
                                  <td>
                                    <Badge bg="info">{summary.totalUsers}</Badge>
                                  </td>
                                  <td>
                                    <Badge bg="success">{summary.totalUsage}</Badge>
                                  </td>
                                  <td>{summary.avgUsagePerUser}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>

                      <div className="table-responsive mt-4">
                        <Table hover className="align-middle">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Discount</th>
                              <th>Usage Count</th>
                              <th>Last Used</th>
                              <th>Per User Limit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageStats.usageStats?.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center text-muted py-4">
                                  No detailed usage data found.
                                </td>
                              </tr>
                            ) : (
                              usageStats.usageStats?.map((usage) => (
                                <tr key={usage._id}>
                                  <td>
                                    <div>
                                      <div>{usage.user?.firstName} {usage.user?.lastName}</div>
                                      <small className="text-muted">{usage.user?.email}</small>
                                    </div>
                                  </td>
                                  <td>{usage.discount?.name}</td>
                                  <td>
                                    <Badge bg="primary">{usage.usageCount}</Badge>
                                  </td>
                                  <td>
                                    {usage.lastUsedAt ? formatDate(usage.lastUsedAt) : 'Never'}
                                  </td>
                                  <td>
                                    {usage.discount?.maxUsagePerUser ? usage.discount.maxUsagePerUser : 'Unlimited'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <FaChartBar className="mb-2" style={{ fontSize: '2rem' }} />
                      <p>No usage data available.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="details" title="User Details">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">User Usage Details</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Select Discount</Form.Label>
                        <Form.Select
                          value={selectedDiscount}
                          onChange={(e) => handleDiscountChange(e.target.value)}
                        >
                          <option value="">Choose a discount...</option>
                          {discounts.map((discount) => (
                            <option key={discount._id} value={discount._id}>
                              {discount.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Search Users</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaSearch />
                          </span>
                          <Form.Control
                            type="text"
                            placeholder="Search by user name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  {selectedDiscount ? (
                    loading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading user usage data...</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="align-middle">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Email</th>
                              <th>Usage Count</th>
                              <th>Last Used</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userUsages.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center text-muted py-4">
                                  No user usage data found for this discount.
                                </td>
                              </tr>
                            ) : (
                              userUsages.map((usage) => (
                                <tr key={usage._id}>
                                  <td>
                                    {usage.user?.firstName} {usage.user?.lastName}
                                  </td>
                                  <td>{usage.user?.email}</td>
                                  <td>
                                    <Badge bg="primary">{usage.usageCount}</Badge>
                                  </td>
                                  <td>
                                    {usage.lastUsedAt ? formatDate(usage.lastUsedAt) : 'Never'}
                                  </td>
                                  <td>
                                    {usage.discount?.maxUsagePerUser && 
                                     usage.usageCount >= usage.discount.maxUsagePerUser ? (
                                      <Badge bg="danger">Limit Reached</Badge>
                                    ) : (
                                      <Badge bg="success">Available</Badge>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4">
                      <FaUsers className="mb-2" style={{ fontSize: '2rem' }} />
                      <p>Please select a discount to view user usage details.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDiscountUsage; 