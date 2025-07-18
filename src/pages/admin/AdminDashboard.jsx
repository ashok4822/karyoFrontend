import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { getDashboardData } from "../../services/admin/adminDashboaredServices";
import { ChartContainer } from "../../components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, stats } = useSelector((state) => state.dashboard);
  const { admin, adminAccessToken } = useSelector((state) => state.auth);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    const fetchDashboardData = async () => {
      dispatch(fetchDashboardStart());
      const result = await getDashboardData({ period });
      if (result.success) {
        dispatch(fetchDashboardSuccess(result.data));
      } else {
        dispatch(fetchDashboardFailure(result.error));
      }
    };
    fetchDashboardData();
  }, [dispatch, period]);

  // Prevent navigating back to login if already authenticated
  useEffect(() => {
    const handlePopState = () => {
      if (admin && admin.role === "admin" && adminAccessToken) {
        if (window.location.pathname === "/admin/login") {
          navigate("/admin", { replace: true });
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [admin, adminAccessToken, navigate]);

  // Map backend recentOrders to frontend format
  const recentOrders = (stats.recentOrders || []).map(order => ({
    id: order.orderNumber || order._id,
    customer: order.user
      ? (order.user.firstName
          ? `${order.user.firstName} ${order.user.lastName || ""}`.trim()
          : order.user.username || order.user.email)
      : "Unknown",
    amount: order.total,
    status: order.status,
  }));

  // Preprocess chartData for x-axis labels
  const chartData = (stats.chartData || []).map(item => {
    let label = "";
    if (item._id) {
      if (item._id.day && item._id.month && item._id.year) {
        // Format as dd/mm/yyyy
        label = `${item._id.day.toString().padStart(2, "0")}/${item._id.month.toString().padStart(2, "0")}/${item._id.year}`;
      } else if (item._id.month && item._id.year) {
        // Format as mm/yyyy
        label = `${item._id.month.toString().padStart(2, "0")}/${item._id.year}`;
      } else if (item._id.year) {
        label = `${item._id.year}`;
      }
    }
    return { ...item, label };
  });

  // Debug logs for dashboard data
  console.log("DASHBOARD STATS:", stats);
  console.log("Recent Orders:", recentOrders);
  console.log("Chart Data:", chartData);
  console.log("Best Selling Products:", stats.bestSellingProducts);
  console.log("Best Selling Categories:", stats.bestSellingCategories);
  console.log("Best Selling Brands:", stats.bestSellingBrands);

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
            {/* Chart Filter and Chart */}
            <Row className="mb-4 align-items-center">
              <Col xs="auto">
                <h4 className="mb-0">Sales & Orders Chart</h4>
              </Col>
              <Col xs="auto">
                <select
                  className="form-select"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  style={{ width: 140, display: "inline-block" }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </Col>
            </Row>
            <Row className="mb-4">
              <Col>
                <ChartContainer id="dashboard-chart">
                  {/* Line Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalSales" stroke="#8884d8" name="Total Sales" />
                      <Line type="monotone" dataKey="orderCount" stroke="#82ca9d" name="Order Count" />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Bar Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalSales" fill="#8884d8" name="Total Sales" />
                      <Bar dataKey="orderCount" fill="#82ca9d" name="Order Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
                          ₹{(stats.totalSales ?? 0).toLocaleString()}
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
                          {/* Use mapped recentOrders here */}
                          {recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.customer}</td>
                              <td>₹{order.amount}</td>
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
                    {(stats.lowStockProducts || []).map((product) => (
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

            {/* After recent orders/low stock section, add best selling tables */}
            <Row className="g-4 mt-4">
              <Col lg={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0">Best Selling Products</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" hover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Brand</th>
                          <th>Qty Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats.bestSellingProducts || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.productName}</td>
                            <td>{item.brand}</td>
                            <td>{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0">Best Selling Categories</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" hover>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Qty Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats.bestSellingCategories || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.categoryName}</td>
                            <td>{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent">
                    <h5 className="mb-0">Best Selling Brands</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" hover>
                      <thead>
                        <tr>
                          <th>Brand</th>
                          <th>Qty Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats.bestSellingBrands || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.brand}</td>
                            <td>{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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
