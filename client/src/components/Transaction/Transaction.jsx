import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import "./Transaction.css";

const Transaction = () => {
  const [type, setType] = useState("Income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000); // Clear after 4 seconds
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      setTransactions(res.data);

      const income = res.data
        .filter((txn) => txn.type === "Income")
        .reduce((sum, txn) => sum + Number(txn.amount), 0);

      const expense = res.data
        .filter((txn) => txn.type === "Expense")
        .reduce((sum, txn) => sum + Number(txn.amount), 0);

      setTotalIncome(income);
      setTotalExpense(expense);
      setBalance(income - expense);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setErrorMessage("Error fetching transactions. Please try again.");
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!amount || !category || !date || !notes) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/transactions/${editingId}`,
          { type, amount, category, date, notes }
        );
        showNotification("Transaction updated successfully");
      } else {
        const response = await axios.post("http://localhost:5000/api/transactions", {
          type,
          amount,
          category,
          date,
          notes,
        });

        if (response.data.warning) {
          showNotification(response.data.warning);
        } else {
          showNotification("Transaction added successfully");
        }
      }
      fetchTransactions();
      clearFields();
    } catch (error) {
      console.error("Error saving transaction:", error);
      setErrorMessage("Error saving transaction. Please try again.");
    }
  };

  const clearFields = () => {
    setAmount("");
    setCategory("");
    setDate("");
    setNotes("");
    setEditingId(null);
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);
      showNotification("Transaction deleted successfully");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setErrorMessage("Error deleting transaction. Please try again.");
    }
  };

  const handleEdit = (txn) => {
    setType(txn.type);
    setAmount(txn.amount);
    setCategory(txn.category);
    setDate(txn.date?.split("T")[0]);
    setNotes(txn.notes);
    setEditingId(txn._id);
  };

  return (
    <div className="transaction-page-container">
      <Sidebar />

      <div className="transaction-content">
        <h2>Transaction Manager</h2>

        {notification && (
          <div className="toast-notification">
            {notification}
          </div>
        )}

        {errorMessage && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            {errorMessage}
          </div>
        )}

        <div className="form">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <input
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button onClick={handleSubmit}>{editingId ? "Update" : "Add"} Transaction</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>No transactions found</td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn._id}>
                  <td>{txn.date?.split("T")[0]}</td>
                  <td>{txn.type}</td>
                  <td>₹{txn.amount}</td>
                  <td>{txn.category}</td>
                  <td>{txn.notes}</td>
                  <td>
                    <button onClick={() => handleEdit(txn)}>Edit</button>
                    <button onClick={() => handleDeleteTransaction(txn._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="summary">
          <p><strong>Total Income:</strong> ₹{totalIncome}</p>
          <p><strong>Total Expense:</strong> ₹{totalExpense}</p>
          <p style={{ color: balance >= 0 ? "green" : "red" }}>
            <strong>Balance:</strong> ₹{balance}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Transaction;
