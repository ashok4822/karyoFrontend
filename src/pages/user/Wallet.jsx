import React, { useEffect, useState } from "react";
import { Modal, Button, Toast, ToastContainer, Spinner } from "react-bootstrap";
import {
  FaWallet,
  FaPlusCircle,
  FaMinusCircle,
  FaRupeeSign,
  FaArrowDown,
  FaArrowUp,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  addFunds,
  deductFunds,
  getWallet,
  createWalletRazorpayOrder,
  verifyWalletPayment,
} from "../../services/user/walletService";
import { getWalletTransactions } from "../../services/user/transactionService";
import { useSelector } from "react-redux";

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState(null); // 'add' or 'deduct'
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVariant, setToastVariant] = useState("success");
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    const { success, data, error } = await getWallet();

    if (success) {
      setWallet(data);
    } else {
      setToastMsg("Failed to fetch wallet");
      setToastVariant("danger");
      setShowToast(true);
      console.error("Wallet fetch error:", error);
    }

    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { success, data, error } = await getWalletTransactions();

    if (success) {
      setTransactions(data.reverse());
    } else {
      setToastMsg("Failed to fetch transactions");
      setToastVariant("danger");
      setShowToast(true);
      console.error("Transaction fetch error:", error);
    }
  };

  const handleFunds = async (type) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setToastMsg("Amount must be positive");
      setToastVariant("danger");
      setShowToast(true);
      return;
    }

    if (type === "add" && numAmount < 1) {
      setToastMsg("Minimum amount for wallet recharge is ₹1");
      setToastVariant("danger");
      setShowToast(true);
      return;
    }

    if (type === "add" && numAmount > 5000) {
      setToastMsg("Maximum amount you can add at a time is ₹5,000");
      setToastVariant("danger");
      setShowToast(true);
      return;
    }

    if (type === "add" && wallet?.balance + numAmount > 10000) {
      setToastMsg("Wallet balance cannot exceed ₹10,000. Please enter a lower amount.");
      setToastVariant("danger");
      setShowToast(true);
      return;
    }

    if (type === "add") {
      // Handle Razorpay payment for adding funds
      await handleRazorpayPayment(numAmount);
    } else {
      // Handle direct deduction (existing logic)
      setLoading(true);
      const payload = { amount: numAmount, description };
      const response = await deductFunds(payload);

      if (response.success) {
        setToastMsg("Funds deducted successfully");
        setToastVariant("success");
        setAmount("");
        setDescription("");
        setModalType(null);
        fetchWallet();
        fetchTransactions();
      } else {
        setToastMsg(response.error || "Failed to deduct funds");
        setToastVariant("danger");
      }

      setShowToast(true);
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (amount) => {
    try {
      setLoading(true);
      
      // Create Razorpay order
      const orderResponse = await createWalletRazorpayOrder({
        amount,
        description: description || "Wallet recharge"
      });

      if (!orderResponse.success) {
        setToastMsg(orderResponse.error || "Failed to create payment order");
        setToastVariant("danger");
        setShowToast(true);
        setLoading(false);
        return;
      }

      const { order, key_id } = orderResponse.data;

      // Configure Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Caryo",
        description: description || "Wallet Recharge",
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await verifyWalletPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
              description: description || "Wallet recharge"
            });

            if (verifyResponse.success) {
              setToastMsg("Payment successful! Funds added to wallet");
              setToastVariant("success");
              setAmount("");
              setDescription("");
              setModalType(null);
              fetchWallet();
              fetchTransactions();
            } else {
              setToastMsg(verifyResponse.error || "Payment verification failed");
              setToastVariant("danger");
            }
            setShowToast(true);
          } catch (error) {
            console.error("Payment verification error:", error);
            setToastMsg("Payment verification failed");
            setToastVariant("danger");
            setShowToast(true);
          }
        },
        prefill: {
          name: user?.username || "User",
          email: user?.email || "user@example.com",
        },
        theme: {
          color: "#0d6efd",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setToastMsg("Payment was cancelled or failed. No funds were added.");
            setToastVariant("danger");
            setShowToast(true);
          },
        },
      };

      // Initialize Razorpay
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Razorpay payment error:", error);
      setToastMsg("Failed to initiate payment");
      setToastVariant("danger");
      setShowToast(true);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${day}/${month}/${year}, ${time}`;
  };

  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <div className="mb-3">
        <Button
          variant="outline-secondary"
          onClick={() => navigate("/profile")}
          className="d-flex align-items-center gap-2"
        >
          <FaArrowLeft /> Back to Profile
        </Button>
      </div>
      <h2 className="mb-4 d-flex align-items-center gap-2">
        <FaWallet style={{ color: "#0d6efd" }} /> Wallet
      </h2>
      {/* Wallet Card */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: 16 }}>
        <div className="card-body d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{ background: "#e9f5ff", borderRadius: 12, padding: 16 }}
            >
              <FaRupeeSign size={32} style={{ color: "#0d6efd" }} />
            </div>
            <div>
              <div className="text-muted">Current Balance</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#222" }}>
                ₹{wallet?.balance?.toFixed(2) || "0.00"}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="success"
              className="d-flex align-items-center gap-2"
              onClick={() => {
                if (wallet?.balance < 10000) setModalType("add");
              }}
              disabled={loading || wallet?.balance >= 10000}
            >
              <FaPlusCircle /> Add Funds
            </Button>
            {/* <Button
              variant="danger"
              className="d-flex align-items-center gap-2"
              onClick={() => setModalType("deduct")}
              disabled={loading}
            >
              <FaMinusCircle /> Deduct Funds
            </Button> */}
          </div>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="card shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h5 className="mb-3">Transaction History</h5>
          {transactions.length === 0 ? (
            <div className="text-muted text-center py-4">
              No transactions yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(txn.date)}</td>
                      <td>
                        {txn.type === "credit" ? (
                          <span className="text-success d-flex align-items-center gap-1">
                            <FaArrowDown /> Credit
                          </span>
                        ) : (
                          <span className="text-danger d-flex align-items-center gap-1">
                            <FaArrowUp /> Debit
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: txn.type === "credit" ? "#198754" : "#dc3545",
                        }}
                      >
                        {txn.type === "debit" ? "-" : "+"}₹
                        {txn.amount.toFixed(2)}
                      </td>
                      <td>{txn.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Deduct Modal */}
      <Modal show={!!modalType} onHide={() => setModalType(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === "add" ? (
              <span className="text-success">
                <FaPlusCircle /> Add Funds via Payment
              </span>
            ) : (
              <span className="text-danger">
                <FaMinusCircle /> Deduct Funds
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalType === "add" && wallet?.balance >= 10000 && (
            <div className="alert alert-warning text-center">
              Your wallet balance is already at the maximum limit (₹10,000). You cannot add more funds.
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFunds(modalType);
            }}
          >
            <div className="mb-3">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min={1}
                max={5000}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description (optional)</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
            <div className="d-flex justify-content-end">
              <Button
                variant={modalType === "add" ? "success" : "danger"}
                type="submit"
                disabled={loading}
              >
                {loading && <Spinner size="sm" className="me-2" />}{" "}
                {modalType === "add" ? "Pay Now" : "Deduct"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Toast Feedback */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          bg={toastVariant}
          delay={1500}
          autohide
        >
          <Toast.Body className="text-white">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default Wallet;
