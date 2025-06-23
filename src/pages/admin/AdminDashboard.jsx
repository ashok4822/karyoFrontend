import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// import api from "@/lib/utils";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Spinner,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import {
  FaUsers,
  FaShoppingCart,
  FaBox,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
} from "../../redux/reducers/dashboardSlice";
import AdminLeftbar from "../../components/AdminLeftbar";
import adminAxios from "../../lib/adminAxios";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { loading, error, stats } = useSelector((state) => state.dashboard);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        dispatch(fetchDashboardStart());
        // Use axios instance for API call
        // const { data } = await api.get("/dashboard");
        const { data } = await adminAxios.get("/dashboard");
        dispatch(fetchDashboardSuccess(data));
      } catch (error) {
        dispatch(fetchDashboardFailure(error.message));
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  if (loading) {
    return (
      <Container fluid className="py-5">
        <Row>
          <Col xs={12} md={3} lg={2} className="p-0">
            <AdminLeftbar />
          </Col>
          <Col xs={12} md={9} lg={10}>
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

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
                <h1 className="h2 mb-0">Dashboard</h1>
              </Col>
              <Col xs="auto">
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2"
                >
                  <FaChartLine /> Generate Report
                </Button>
              </Col>
            </Row>

            {error && (
              <Alert variant="danger" className="mb-4">
                <FaExclamationTriangle className="me-2" />
                {error}
              </Alert>
            )}

            {/* Statistics Cards */}
            <Row className="g-4 mb-4">
              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Total Sales</h6>
                        <h3 className="mb-0">
                          ${stats.totalSales.toLocaleString()}
                        </h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 p-3 rounded">
                        <FaDollarSign className="text-primary" size={24} />
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <span
                        className={`me-2 ${
                          stats.salesGrowth >= 0
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {stats.salesGrowth >= 0 ? (
                          <FaArrowUp />
                        ) : (
                          <FaArrowDown />
                        )}
                        {Math.abs(stats.salesGrowth)}%
                      </span>
                      <span className="text-muted">vs last month</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Total Orders</h6>
                        <h3 className="mb-0">{stats.totalOrders}</h3>
                      </div>
                      <div className="bg-success bg-opacity-10 p-3 rounded">
                        <FaShoppingCart className="text-success" size={24} />
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <span
                        className={`me-2 ${
                          stats.orderGrowth >= 0
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {stats.orderGrowth >= 0 ? (
                          <FaArrowUp />
                        ) : (
                          <FaArrowDown />
                        )}
                        {Math.abs(stats.orderGrowth)}%
                      </span>
                      <span className="text-muted">vs last month</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Total Products</h6>
                        <h3 className="mb-0">{stats.totalProducts}</h3>
                      </div>
                      <div className="bg-info bg-opacity-10 p-3 rounded">
                        <FaBox className="text-info" size={24} />
                      </div>
                    </div>
                    <div className="text-muted">Active products</div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-muted mb-1">Total Customers</h6>
                        <h3 className="mb-0">{stats.totalCustomers}</h3>
                      </div>
                      <div className="bg-warning bg-opacity-10 p-3 rounded">
                        <FaUsers className="text-warning" size={24} />
                      </div>
                    </div>
                    <div className="text-muted">Registered users</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Orders and Low Stock Products */}
            <Row className="g-4">
              <Col lg={8}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0">Recent Orders</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.customer}</td>
                              <td>${order.amount}</td>
                              <td>
                                <Badge
                                  bg={
                                    order.status === "completed"
                                      ? "success"
                                      : order.status === "pending"
                                      ? "warning"
                                      : "danger"
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0">Low Stock Products</h5>
                  </Card.Header>
                  <Card.Body>
                    {stats.lowStockProducts.map((product) => (
                      <div key={product.id} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span>{product.name}</span>
                          <span className="text-muted">
                            {product.stock} units left
                          </span>
                        </div>
                        <ProgressBar
                          now={(product.stock / product.maxStock) * 100}
                          variant={
                            product.stock < 5
                              ? "danger"
                              : product.stock < 10
                              ? "warning"
                              : "success"
                          }
                        />
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
