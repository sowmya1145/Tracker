import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [incomeByCategory, setIncomeByCategory] = useState([]);
  const [expenseByCategory, setExpenseByCategory] = useState([]);
  const [topIncomeCategory, setTopIncomeCategory] = useState("");
  const [topIncomeAmount, setTopIncomeAmount] = useState(0);
  const [topExpenseCategory, setTopExpenseCategory] = useState("");
  const [topExpenseAmount, setTopExpenseAmount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const res = await axios.get("http://localhost:5000/api/transactions");
    const transactions = res.data;

    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + +t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + +t.amount, 0);

    setTotalIncome(income);
    setTotalExpense(expense);

    const incomeCat = {};
    const expenseCat = {};
    transactions.forEach((t) => {
      if (t.type === "Income")
        incomeCat[t.category] = (incomeCat[t.category] || 0) + +t.amount;
      if (t.type === "Expense")
        expenseCat[t.category] = (expenseCat[t.category] || 0) + +t.amount;
    });

    setIncomeByCategory(
      Object.keys(incomeCat).map((cat) => ({
        name: cat,
        amount: incomeCat[cat],
      }))
    );

    setExpenseByCategory(
      Object.keys(expenseCat).map((cat) => ({
        name: cat,
        amount: expenseCat[cat],
      }))
    );

    const topIncomeKey = Object.keys(incomeCat).reduce(
      (a, b) => (incomeCat[a] > incomeCat[b] ? a : b),
      ""
    );

    const topExpenseKey = Object.keys(expenseCat).reduce(
      (a, b) => (expenseCat[a] > expenseCat[b] ? a : b),
      ""
    );

    setTopIncomeCategory(topIncomeKey);
    setTopIncomeAmount(incomeCat[topIncomeKey]);
    setTopExpenseCategory(topExpenseKey);
    setTopExpenseAmount(expenseCat[topExpenseKey]);
  };

  const expensePercentage = totalIncome
    ? ((totalExpense / totalIncome) * 100).toFixed(0)
    : 0;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <h1 className="dashboard-title">Dashboard</h1>

        <div className="summary-row">
          <div
            className="summary-box summary-income"
            onClick={() => navigate("/income")}
            style={{ cursor: "pointer" }}
          >
            <div className="summary-header summary-income-header">Total Income</div>
            <div className="summary-body summary-income-body">
              ₹{totalIncome.toLocaleString()}
            </div>
          </div>

          <div
            className="summary-box summary-expense"
            onClick={() => navigate("/expense")}
            style={{ cursor: "pointer" }}
          >
            <div className="summary-header summary-expense-header">Total Expense</div>
            <div className="summary-body summary-expense-body">
              ₹{totalExpense.toLocaleString()}
            </div>
          </div>

          <div className="summary-box summary-percent">
            <div className="summary-header summary-percent-header">Expense %</div>
            <div className="summary-body summary-percent-body">
              <PieChart width={100} height={100}>
                <Pie
                  data={[
                    { name: "Expense", value: totalExpense },
                    { name: "Remaining", value: totalIncome - totalExpense },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={40}
                >
                  <Cell fill="#c62828" />
                  <Cell fill="#a5d6a7" />
                </Pie>
              </PieChart>
              <span>{expensePercentage}%</span>
              <div className="expense-feedback">
                {totalIncome === 0 ? (
                  <p style={{ fontSize: "12px", color: "#999" }}>
                    No income data available.
                  </p>
                ) : expensePercentage > 70 ? (
                  <p style={{ fontSize: "12px", color: "#d32f2f" }}>
                    Your expenses are too high. Consider budgeting.
                  </p>
                ) : expensePercentage > 40 ? (
                  <p style={{ fontSize: "12px", color: "#f9a825" }}>
                    Your expenses are moderate. Keep an eye on them.
                  </p>
                ) : (
                  <p style={{ fontSize: "12px", color: "#388e3c" }}>
                    Your expenses are well within a healthy range.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="summary-box summary-income-cat">
            <div className="summary-header summary-income-cat-header">
              Top Income Category
            </div>
            <div className="summary-body summary-income-cat-body">
              <div className="category-and-value">
                <span className="category-name">{topIncomeCategory}</span>
                <span className="category-value">₹{topIncomeAmount}</span>
              </div>
            </div>
          </div>

          <div className="summary-box summary-expense-cat">
            <div className="summary-header summary-expense-cat-header">
              Top Expense Category
            </div>
            <div className="summary-body summary-expense-cat-body">
              <div className="category-and-value">
                <span className="category-name">{topExpenseCategory}</span>
                <span className="category-value">₹{topExpenseAmount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-box">
            <h3>Income Category</h3>
            <BarChart width={400} height={250} data={incomeByCategory}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#388e3c" />
            </BarChart>
          </div>

          <div className="chart-box">
            <h3>Expense Category</h3>
            <BarChart width={400} height={250} data={expenseByCategory}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#c62828" />
            </BarChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
