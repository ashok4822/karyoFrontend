import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import api from "@/lib/utils";
import { BiRupee } from "react-icons/bi";
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
import {
  getDashboardData,
  getLedgerBook,
} from "../../services/admin/adminDashboaredServices";
import { ChartContainer } from "../../components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, stats } = useSelector((state) => state.dashboard);
  const { admin, adminAccessToken } = useSelector((state) => state.auth);
  const [period, setPeriod] = useState("monthly");
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState({
    period: "monthly",
    dateFrom: "",
    dateTo: "",
  });

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
  const recentOrders = (stats.recentOrders || []).map((order) => ({
    id: order.orderNumber || order._id,
    customer: order.user
      ? order.user.firstName
        ? `${order.user.firstName} ${order.user.lastName || ""}`.trim()
        : order.user.username || order.user.email
      : "Unknown",
    amount: order.total,
    status: order.status,
  }));

  // Preprocess chartData for x-axis labels
  const chartData = (stats.chartData || []).map((item) => {
    let label = "";
    if (item._id) {
      if (item._id.day && item._id.month && item._id.year) {
        // Format as dd/mm/yyyy
        label = `${item._id.day.toString().padStart(2, "0")}/${item._id.month
          .toString()
          .padStart(2, "0")}/${item._id.year}`;
      } else if (item._id.month && item._id.year) {
        // Format as mm/yyyy
        label = `${item._id.month.toString().padStart(2, "0")}/${
          item._id.year
        }`;
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
  console.log("Low Stock Products:", stats.lowStockProducts);

  const handleGenerateLedger = async () => {
    setLedgerLoading(true);
    try {
      const result = await getLedgerBook(ledgerFilters);
      console.log("ledger result: ", result);
      if (result.success) {
        setLedgerData(result.data); // This is the correct fix
        setShowLedger(true);
      } else {
        console.error("Failed to generate ledger:", result.error);
      }
    } catch (error) {
      console.error("Ledger generation error:", error);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleClearLedgerFilters = () => {
    setLedgerFilters({ period: "monthly", dateFrom: "", dateTo: "" });
    // Optionally reload the ledger with default filters
    handleGenerateLedger();
  };

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
                  onChange={(e) => setPeriod(e.target.value)}
                  style={{ width: 140, display: "inline-block" }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </Col>
              <Col xs="auto" className="ms-auto">
                {/*<Button
                  variant="outline-primary"
                  onClick={handleGenerateLedger}
                  disabled={ledgerLoading}
                  className="d-flex align-items-center gap-2"
                >
                  {ledgerLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <FaChartLine />
                  )}
                  Generate Ledger
                </Button>*/}
              </Col>
            </Row>
            <Row className="mb-4">
              <Col>
                <ChartContainer id="dashboard-chart">
                  {/* Line Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalSales"
                        stroke="#8884d8"
                        name="Total Sales"
                      />
                      <Line
                        type="monotone"
                        dataKey="orderCount"
                        stroke="#82ca9d"
                        name="Order Count"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Bar Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="totalSales"
                        fill="#8884d8"
                        name="Total Sales"
                      />
                      <Bar
                        dataKey="orderCount"
                        fill="#82ca9d"
                        name="Order Count"
                      />
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
                        <BiRupee className="text-primary" size={24} />
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
                    {(stats.lowStockProducts || []).length > 0 ? (
                      (stats.lowStockProducts || []).map((product, index) => (
                        <div
                          key={product.variant || product._id || index}
                          className="mb-3"
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-medium">{product.name}</span>
                            <span className="text-muted small">
                              {product.stock} units ({product.stock}%)
                            </span>
                          </div>
                          <ProgressBar
                            now={product.stock}
                            variant={
                              product.stock < 5
                                ? "danger"
                                : product.stock < 10
                                ? "warning"
                                : "success"
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted py-3">
                        <FaBox className="mb-2" size={24} />
                        <p className="mb-0">No low stock products</p>
                      </div>
                    )}
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
                        {(stats.bestSellingCategories || []).map(
                          (item, idx) => (
                            <tr key={idx}>
                              <td>{item.categoryName}</td>
                              <td>{item.quantity}</td>
                            </tr>
                          )
                        )}
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

            {/* Ledger Book Modal */}
            {showLedger && (
              <div
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
                style={{ zIndex: 1050 }}
              >
                <div
                  className="bg-white rounded p-4"
                  style={{
                    width: "95%",
                    maxWidth: "1200px",
                    maxHeight: "90vh",
                    overflow: "auto",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>Ledger Book</h4>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowLedger(false)}
                    >
                      Close
                    </Button>
                  </div>

                  {ledgerData && (
                    <>
                      {console.log("LEDGER DATA:", ledgerData)}
                      {/* Ledger Filters */}
                      <Row className="mb-4">
                        <Col md={3}>
                          <label className="form-label">Period</label>
                          <select
                            className="form-select"
                            value={ledgerFilters.period}
                            onChange={(e) =>
                              setLedgerFilters({
                                ...ledgerFilters,
                                period: e.target.value,
                              })
                            }
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </Col>
                        <Col md={3}>
                          <label className="form-label">From Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={ledgerFilters.dateFrom}
                            onChange={(e) =>
                              setLedgerFilters({
                                ...ledgerFilters,
                                dateFrom: e.target.value,
                              })
                            }
                          />
                        </Col>
                        <Col md={3}>
                          <label className="form-label">To Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={ledgerFilters.dateTo}
                            onChange={(e) =>
                              setLedgerFilters({
                                ...ledgerFilters,
                                dateTo: e.target.value,
                              })
                            }
                          />
                        </Col>
                        <Col md={3} className="d-flex align-items-end gap-2">
                          <Button
                            onClick={handleGenerateLedger}
                            disabled={ledgerLoading}
                          >
                            {ledgerLoading ? "Generating..." : "Update Ledger"}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            onClick={handleClearLedgerFilters}
                            disabled={ledgerLoading}
                          >
                            Clear Filters
                          </Button>
                        </Col>
                      </Row>

                      {/* Summary Cards */}
                      <Row className="mb-4">
                        <Col md={2}>
                          <Card className="text-center">
                            <Card.Body>
                              <h6>Total Orders</h6>
                              <h4>
                                {ledgerData?.data?.summary?.totalOrders ?? 0}
                              </h4>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={2}>
                          <Card className="text-center">
                            <Card.Body>
                              <h6>Total Revenue</h6>
                              <h4>
                                ₹
                                {ledgerData?.data?.summary?.totalRevenue?.toLocaleString() ??
                                  0}
                              </h4>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={2}>
                          <Card className="text-center">
                            <Card.Body>
                              <h6>Total Discounts</h6>
                              <h4>
                                ₹
                                {ledgerData?.data?.summary?.totalDiscounts?.toLocaleString() ??
                                  0}
                              </h4>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={2}>
                          <Card className="text-center">
                            <Card.Body>
                              <h6>Total Offers</h6>
                              <h4>
                                ₹
                                {ledgerData?.data?.summary?.totalOffers?.toLocaleString() ??
                                  0}
                              </h4>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={2}>
                          <Card className="text-center">
                            <Card.Body>
                              <h6>Total Shipping</h6>
                              <h4>
                                ₹
                                {ledgerData?.data?.summary?.totalShipping?.toLocaleString() ??
                                  0}
                              </h4>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={2}>
                          <Card className="text-center">
                            <Card.Body>
                              <h6>Total Refunds</h6>
                              <h4>
                                ₹
                                {ledgerData?.data?.summary?.totalRefunds?.toLocaleString() ??
                                  0}
                              </h4>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* Ledger Table */}
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Order/Refund</th>
                              <th>Customer</th>
                              <th>Items</th>
                              <th>Subtotal</th>
                              <th>Discount</th>
                              <th>Offers</th>
                              <th>Shipping</th>
                              <th>Total</th>
                              <th>Payment Method</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ledgerData?.data?.ledgerEntries || []).length ===
                            0 ? (
                              <tr>
                                <td
                                  colSpan={11}
                                  className="text-center text-muted"
                                >
                                  No ledger entries found.
                                </td>
                              </tr>
                            ) : (
                              (ledgerData?.data?.ledgerEntries || []).map(
                                (entry, idx) => (
                                  <tr key={idx}>
                                    <td>
                                      {new Date(
                                        entry.date
                                      ).toLocaleDateString()}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "Refund"
                                        : entry.orderNumber}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "N/A"
                                        : entry.customer}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? entry.description
                                        : (entry.items || []).map((item, i) => (
                                            <div key={i}>
                                              {item.productName} (
                                              {item.quantity}x ₹{item.price})
                                            </div>
                                          ))}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "N/A"
                                        : `₹${(
                                            entry.subtotal ?? 0
                                          ).toLocaleString()}`}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "N/A"
                                        : `₹${(
                                            entry.discount ?? 0
                                          ).toLocaleString()}`}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "N/A"
                                        : `₹${(
                                            entry.offers ?? 0
                                          ).toLocaleString()}`}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "N/A"
                                        : `₹${(
                                            entry.shipping ?? 0
                                          ).toLocaleString()}`}
                                    </td>
                                    <td>
                                      {entry.type === "refund" ? (
                                        <span className="text-danger">
                                          -₹
                                          {(entry.amount ?? 0).toLocaleString()}
                                        </span>
                                      ) : (
                                        `₹${(
                                          entry.total ?? 0
                                        ).toLocaleString()}`
                                      )}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "N/A"
                                        : (
                                            entry.paymentMethod || ""
                                          ).toUpperCase()}
                                    </td>
                                    <td>
                                      {entry.type === "refund"
                                        ? "Refunded"
                                        : entry.orderStatus}
                                    </td>
                                  </tr>
                                )
                              )
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
