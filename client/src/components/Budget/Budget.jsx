import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import "./Budget.css";

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBudgets();
    fetchTransactions();
  }, [month]);

  const fetchBudgets = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/budgets/${month}`);
      setBudgets(res.data);
    } catch (err) {
      console.error("Error fetching budgets:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      const filtered = res.data.filter(
        (t) => t.type === "Expense" && t.date.startsWith(month)
      );
      setTransactions(filtered);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const handleSave = async () => {
    if (!category || !amount) return alert("Please enter category and amount");

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/budgets/${editingId}`, {
          category,
          amount,
          month,
        });
        alert("Budget updated");
      } else {
        await axios.post("http://localhost:5000/api/budgets", {
          category,
          amount,
          month,
        });
        alert("Budget added");
      }

      setCategory("");
      setAmount("");
      setEditingId(null);
      fetchBudgets();
    } catch (err) {
      console.error("Error saving budget:", err);
    }
  };

  const handleEdit = (budget) => {
    setCategory(budget.category);
    setAmount(budget.amount);
    setEditingId(budget._id);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this budget?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:5000/api/budgets/${id}`);
        fetchBudgets();
      } catch (err) {
        console.error("Error deleting budget:", err);
      }
    }
  };

  const getSpent = (cat) =>
    transactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="budget-planner-container">
      <Sidebar />

      <div className="budget-content">
        <h2 className="title">Budget Planner</h2>

        <div className="month-select">
          <label>Select Month:</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>

        <div className="budget-form">
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            type="number"
            placeholder="Budget Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleSave}>{editingId ? "Update" : "Save"} Budget</button>
        </div>

        <table className="budget-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Budgeted (₹)</th>
              <th>Spent (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => {
              const spent = getSpent(b.category);
              const exceeded = spent > b.amount;
              return (
                <tr key={b._id}>
                  <td>{b.category}</td>
                  <td>₹{b.amount.toFixed(2)}</td>
                  <td>₹{spent.toFixed(2)}</td>
                  <td style={{ color: exceeded ? "red" : "green", fontWeight: "bold" }}>
                    {exceeded ? "Exceeded" : "Within Limit"}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(b)} style={{ marginRight: "5px" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(b._id)} >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budget;
