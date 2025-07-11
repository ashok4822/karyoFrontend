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
} from "../../services/user/walletService";
import { getWalletTransactions } from "../../services/user/transactionService";

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

    setLoading(true);
    const payload = { amount: numAmount, description };

    const response =
      type === "add" ? await addFunds(payload) : await deductFunds(payload);

    if (response.success) {
      setToastMsg(
        type === "add"
          ? "Funds added successfully"
          : "Funds deducted successfully"
      );
      setToastVariant("success");
      setAmount("");
      setDescription("");
      setModalType(null);
      fetchWallet();
      fetchTransactions();
    } else {
      setToastMsg(response.error || `Failed to ${type} funds`);
      setToastVariant("danger");
    }

    setShowToast(true);
    setLoading(false);
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
              onClick={() => setModalType("add")}
              disabled={loading}
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
                <FaPlusCircle /> Add Funds
              </span>
            ) : (
              <span className="text-danger">
                <FaMinusCircle /> Deduct Funds
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                {modalType === "add" ? "Add" : "Deduct"}
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
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default Wallet;
