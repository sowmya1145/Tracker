import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import "./Analytics.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [insights, setInsights] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      setTransactions(res.data);
      prepareAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const prepareAnalytics = (data) => {
    const monthMap = {};
    const categoryMap = {};
    const dayMap = {};

    data.forEach((t) => {
      const month = t.date.slice(0, 7);
      const day = new Date(t.date).toLocaleDateString();

      if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
      if (t.type === "Income") monthMap[month].income += t.amount;
      else if (t.type === "Expense") monthMap[month].expense += t.amount;

      if (t.type === "Expense") {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }

      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    const formatted = Object.keys(monthMap)
      .sort()
      .map((month) => ({
        month,
        income: monthMap[month].income,
        expense: monthMap[month].expense,
        savings: monthMap[month].income - monthMap[month].expense,
      }));

    const topCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    const topCat = topCategories[0]?.name || "N/A";
    const totalSavings = formatted.reduce((sum, m) => sum + m.savings, 0);
    const avgSavings =
      formatted.length > 0 ? (totalSavings / formatted.length).toFixed(2) : 0;
    const mostActiveDay =
      Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    setMonthlyData(formatted);
    setCategoryTotals(topCategories);
    setInsights({
      topCategory: topCat,
      avgSavings,
      mostActiveDay,
    });
  };

  const highestMonth = monthlyData.reduce(
    (max, item) => (item.income - item.expense > max.diff ? { month: item.month, diff: item.income - item.expense } : max),
    { month: "N/A", diff: -Infinity }
  );

  return (
    <div className="analytics-container">
      <Sidebar />
      <div className="analytics-content">
        <h2 className="analytics-title">📊 Monthly Income vs Expense</h2>

        <div className="insights">
          <h3>💡 Key Insights</h3>
          <ul>
            <li>
              📌 Top Spending Category: <strong>{insights.topCategory}</strong>
            </li>
            <li>
              💰 Average Monthly Savings: <strong>₹{insights.avgSavings}</strong>
            </li>
            <li>
              📅 Most Active Day: <strong>{insights.mostActiveDay}</strong>
            </li>
            <li>
              🔝 Best Month (Net Savings): <strong>{highestMonth.month}</strong>
            </li>
          </ul>
        </div>

        <div className="chart-section">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#4CAF50" name="Income" />
              <Bar dataKey="expense" fill="#F44336" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>📈 Enhanced Monthly Savings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="savings" stroke="#2196F3" fillOpacity={1} fill="url(#colorSavings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>💸 Top Spending Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryTotals.slice(0, 5)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {categoryTotals.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
