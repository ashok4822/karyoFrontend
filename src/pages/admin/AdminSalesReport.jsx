import React, { useState, useEffect } from "react";
import AdminLeftbar from "../../components/AdminLeftbar";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import { getAllOrders } from "../../services/admin/adminOrderService";
import { FaDownload } from "react-icons/fa";
import jsPDF from "jspdf";
// REMOVE: import "jspdf-autotable";
import Pagination from "react-bootstrap/Pagination";
import "./AdminSalesReport.css";

const FILTER_TYPES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom", value: "custom" },
];

const QUICK_RANGES = [
  { label: "1 Day", value: "1d" },
  { label: "1 Week", value: "1w" },
  { label: "1 Month", value: "1m" },
];

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getDateRange(filterType, quickRange, customFrom, customTo) {
  const now = new Date();
  let dateFrom = null,
    dateTo = null;

  if (filterType === "custom") {
    dateFrom = customFrom || null;
    dateTo = customTo || null;
  } else if (quickRange) {
    if (quickRange === "1d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      dateFrom = d.toISOString().slice(0, 10);
      dateTo = now.toISOString().slice(0, 10);
    } else if (quickRange === "1w") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      dateFrom = d.toISOString().slice(0, 10);
      dateTo = now.toISOString().slice(0, 10);
    } else if (quickRange === "1m") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      dateFrom = d.toISOString().slice(0, 10);
      dateTo = now.toISOString().slice(0, 10);
    }
  } else {
    if (filterType === "daily") {
      dateFrom = now.toISOString().slice(0, 10);
      dateTo = now.toISOString().slice(0, 10);
    } else if (filterType === "weekly") {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      dateFrom = monday.toISOString().slice(0, 10);
      dateTo = sunday.toISOString().slice(0, 10);
    } else if (filterType === "monthly") {
      // Fix: Get current month's first and last day
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFrom = first.toISOString().slice(0, 10);
      dateTo = last.toISOString().slice(0, 10);
    } else if (filterType === "yearly") {
      const first = new Date(now.getFullYear(), 0, 1);
      const last = new Date(now.getFullYear(), 11, 31);
      dateFrom = first.toISOString().slice(0, 10);
      dateTo = last.toISOString().slice(0, 10);
    }
  }

  return { dateFrom, dateTo };
}

const AdminSalesReport = () => {
  const [filterType, setFilterType] = useState("daily");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [quickRange, setQuickRange] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    salesCount: 0,
    orderAmount: 0,
    discount: 0,
  });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ORDERS_PER_PAGE = 10;

  // Fetch orders when filters change
  const fetchOrders = async (page = currentPage) => {
    setLoading(true);
    setError("");
    let params = { page, limit: ORDERS_PER_PAGE };

    // Date range logic
    const { dateFrom, dateTo } = getDateRange(
      filterType,
      quickRange,
      customFrom,
      customTo
    );

    // Only apply custom if both dates are set
    if (filterType === "custom") {
      if (customFrom && customTo) {
        params.dateFrom = customFrom;
        params.dateTo = customTo;
      } else {
        setOrders([]);
        setSummary({ salesCount: 0, orderAmount: 0, discount: 0 });
        setLoading(false);
        setTotalPages(1);
        return;
      }
    } else {
      // Temporarily comment out date filtering to see all orders
      // if (dateFrom) params.dateFrom = dateFrom;
      // if (dateTo) params.dateTo = dateTo;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
    }

    try {
      const result = await getAllOrders(params);

      if (result.success) {
        setOrders(result.data.orders || []);
        setTotalPages(result.data.totalPages || 1);
        setSummary(
          result.data.summary || { salesCount: 0, orderAmount: 0, discount: 0 }
        );
      } else {
        console.error("API error:", result.error);
        setError(result.error || "Failed to fetch orders");
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch orders");
      setTotalPages(1);
    }
    setLoading(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterType("daily");
    setCustomFrom("");
    setCustomTo("");
    setQuickRange("");
    setCurrentPage(1); // Reset to first page when filters change
    setTimeout(fetchOrders, 0);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filterType, customFrom, customTo, quickRange]);

  useEffect(() => {
    fetchOrders(currentPage);
    // eslint-disable-next-line
  }, [currentPage, filterType, customFrom, customTo, quickRange]);

  // Filter orders to only include those with at least one delivered+paid item, and filter items accordingly
  const filteredOrders = orders
    .map((order) => {
      const deliveredPaidItems = (order.items || []).filter(
        (item) =>
          item.itemStatus === "delivered" && item.itemPaymentStatus === "paid"
      );
      return deliveredPaidItems.length > 0
        ? { ...order, items: deliveredPaidItems }
        : null;
    })
    .filter(Boolean);

  // Adjust summary for filtered orders
  const filteredSummary = {
    salesCount: filteredOrders.length,
    orderAmount: filteredOrders.reduce(
      (sum, order) =>
        sum +
        (order.computedTotal !== undefined
          ? order.computedTotal
          : order.total || 0),
      0
    ),
    discount: filteredOrders.reduce((sum, order) => {
      if (order.computedProportionalDiscount !== undefined) {
        return sum + Number(order.computedProportionalDiscount);
      } else if (typeof order.discount === "number") {
        return sum + order.discount;
      } else if (order.discount && typeof order.discount === "object") {
        return sum + (Number(order.discount.discountAmount) || 0);
      }
      return sum;
    }, 0),
  };

  // Download Excel
  const handleDownloadExcel = () => {
    setDownloadLoading(true);
    const header = [
      "Order Number,Date,Customer,Email,Total,Discount,Coupon Code",
    ];
    const rows = filteredOrders.map((order) => {
      const customer = order.user
        ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
        : "-";
      let discount = "-";
      let coupon = "-";
      if (typeof order.discount === "number") {
        discount = order.discount.toFixed(2);
      } else if (
        order.discount &&
        typeof order.discount === "object" &&
        order.discount.discountAmount
      ) {
        discount = order.discount.discountAmount
          ? Number(order.discount.discountAmount).toFixed(2)
          : "-";
        coupon =
          order.discount.code ||
          order.discount.discountName ||
          order.discount.name ||
          "-";
      }
      return [
        `#${order.orderNumber}`,
        formatDate(order.createdAt || order.date),
        customer,
        order.user?.email || "",
        order.total?.toFixed(2) ?? "-",
        discount,
        coupon,
      ].join(",");
    });
    const csvContent = header.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadLoading(false), 1000);
  };

  // Download PDF (real implementation)
  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    // Dynamic import for autotable
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    // Branding: Company Name
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // blue
    doc.text("Caryo", 14, 16);
    // Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Sales Report", 14, 28);
    // Date range
    const { dateFrom, dateTo } = getDateRange(
      filterType,
      quickRange,
      customFrom,
      customTo
    );
    let dateRangeText = "";
    if (dateFrom && dateTo) {
      dateRangeText = `Date Range: ${formatDate(dateFrom)} - ${formatDate(
        dateTo
      )}`;
    } else if (dateFrom) {
      dateRangeText = `From: ${formatDate(dateFrom)}`;
    } else if (dateTo) {
      dateRangeText = `To: ${formatDate(dateTo)}`;
    }
    doc.setFontSize(10);
    doc.text(dateRangeText, 14, 36);
    // Summary
    doc.setFontSize(12);
    doc.text(`Overall Sales Count: ${filteredSummary.salesCount}`, 14, 46);
    doc.text(
      `Overall Order Amount: INR ${filteredSummary.orderAmount.toLocaleString()}`,
      14,
      54
    );
    doc.text(
      `Overall Discount: INR ${filteredSummary.discount.toLocaleString()}`,
      14,
      62
    );
    // Table
    const tableColumn = [
      "Order Number",
      "Date",
      "Customer",
      "Email",
      "Total (INR)",
      "Discount (INR)",
      "Coupon Code",
    ];
    const tableRows = filteredOrders.map((order) => {
      const customer = order.user
        ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
        : "-";
      let discount = "-";
      let coupon = "-";
      let total =
        order.total != null ? `INR ${Number(order.total).toFixed(2)}` : "-";
      if (typeof order.discount === "number") {
        discount = `INR ${order.discount.toFixed(2)}`;
      } else if (order.discount && typeof order.discount === "object") {
        discount = order.discount.discountAmount
          ? `INR ${Number(order.discount.discountAmount).toFixed(2)}`
          : "-";
        coupon =
          order.discount.code ||
          order.discount.discountName ||
          order.discount.name ||
          "-";
      }
      return [
        `#${order.orderNumber}`,
        formatDate(order.createdAt || order.date),
        customer,
        order.user?.email || "",
        total,
        discount,
        coupon,
      ];
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 68,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14, right: 14 },
      theme: "grid",
    });
    doc.save(`sales_report_${Date.now()}.pdf`);
    setTimeout(() => setDownloadLoading(false), 1000);
  };

  return (
    <Container fluid>
      <Row>
        <Col md={2}>
          <AdminLeftbar />
        </Col>
        <Col md={10} className="p-4">
          <h2 className="mb-4">Sales Report</h2>

          {/* Filter Section */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Report Type</Form.Label>
                    <Form.Select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setQuickRange("");
                      }}
                    >
                      {FILTER_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                {filterType === "custom" && (
                  <>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>From</Form.Label>
                        <Form.Control
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>To</Form.Label>
                        <Form.Control
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}
                {/*{filterType !== "custom" && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Quick Range</Form.Label>
                      <Form.Select
                        value={quickRange}
                        onChange={e => setQuickRange(e.target.value)}
                      >
                        <option value="">Select</option>
                        {QUICK_RANGES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}*/}
                <Col md={3} className="d-flex align-items-end gap-2">
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={handleClearFilters}
                    disabled={loading}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Summary Section */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="text-muted">Overall Sales Count</div>
                  <div className="h4 mb-0">{filteredSummary.salesCount}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="text-muted">Overall Order Amount</div>
                  <div className="h4 mb-0">
                    INR{filteredSummary.orderAmount.toLocaleString()}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="text-muted">Overall Discount</div>
                  <div className="h4 mb-0">
                    INR{filteredSummary.discount.toLocaleString()}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Download Buttons */}
          <div className="mb-3 d-flex gap-2">
            <Button
              variant="success"
              onClick={handleDownloadExcel}
              disabled={downloadLoading}
            >
              <FaDownload className="me-2" /> Download Excel
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadPDF}
              disabled={downloadLoading}
            >
              <FaDownload className="me-2" /> Download PDF
            </Button>
          </div>

          {/* Sales Report Table */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <div
                className="table-container-relative"
                style={{ position: "relative" }}
              >
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Total (INR)</th>
                        <th>Discount (INR)</th>
                        <th>Coupon Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center text-muted py-4"
                          >
                            No orders found.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          let discount = "-";
                          let coupon = "-";
                          // Use computedProportionalDiscount if available
                          if (
                            order.computedProportionalDiscount !== undefined
                          ) {
                            discount = Number(
                              order.computedProportionalDiscount
                            ).toFixed(2);
                          } else if (typeof order.discount === "number") {
                            discount = order.discount.toFixed(2);
                          } else if (
                            order.discount &&
                            typeof order.discount === "object"
                          ) {
                            discount = order.discount.discountAmount
                              ? Number(order.discount.discountAmount).toFixed(2)
                              : "-";
                            coupon =
                              order.discount.code ||
                              order.discount.discountName ||
                              order.discount.name ||
                              "-";
                          }
                          // Use couponCode if present
                          let couponCode = order.couponCode ?? "-";
                          if (
                            couponCode === "-" &&
                            order.discount &&
                            typeof order.discount === "object"
                          ) {
                            couponCode =
                              order.discount.code ||
                              order.discount.discountName ||
                              order.discount.name ||
                              "-";
                          }
                          return (
                            <tr key={order._id || order.id}>
                              <td>#{order.orderNumber}</td>
                              <td>
                                {formatDate(order.createdAt || order.date)}
                              </td>
                              <td>
                                {order.user
                                  ? `${order.user.firstName || ""} ${
                                      order.user.lastName || ""
                                    }`.trim()
                                  : "-"}
                              </td>
                              <td>{order.user?.email || ""}</td>
                              <td>
                                {(order.computedTotal !== undefined
                                  ? order.computedTotal
                                  : order.total
                                )?.toFixed(2) ?? "-"}
                              </td>
                              <td>{discount}</td>
                              <td>{couponCode}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {loading && (
                  <div className="table-overlay-spinner">
                    <Spinner animation="border" />
                  </div>
                )}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      disabled={currentPage === 1}
                    />
                    {Array.from({ length: totalPages }).map((_, idx) => (
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
                        currentPage < totalPages &&
                        setCurrentPage(currentPage + 1)
                      }
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminSalesReport;
