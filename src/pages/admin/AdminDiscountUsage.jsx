import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-bootstrap';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChartBar,
} from 'react-icons/fa';
import AdminLeftbar from '../../components/AdminLeftbar';
import {
  fetchDiscounts,
  clearError,
} from '../../redux/reducers/discountSlice';
import adminAxios from '../../lib/adminAxios';
import Swal from 'sweetalert2';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const AdminDiscountUsage = () => {
  const dispatch = useDispatch();
  const { discounts } = useSelector((state) => state.discounts);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    // Fetch discounts for dropdown
    dispatch(fetchDiscounts({ limit: 100 }));
  }, [dispatch]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchUsageStats();
  }, [debouncedSearchQuery, currentPage]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    console.log('AdminDiscountUsage mounted');
  }, []);

  const fetchUsageStats = async () => {
    setLoading(true);
    try {
      const response = await adminAxios.get('/discounts/usage-stats', {
        params: {
          page: currentPage,
          limit: 10,
          search: debouncedSearchQuery,
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Overall Usage Statistics</h5>
            </Card.Header>
            <Card.Body>
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
                        ref={el => {
                          inputRef.current = el;
                          if (el) console.log('Search input mounted');
                        }}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading usage statistics...</p>
                </div>
              ) : usageStats ? (
                <>
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
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDiscountUsage; 