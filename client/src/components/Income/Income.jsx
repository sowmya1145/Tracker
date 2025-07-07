import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./Income.css";

const Income = () => {
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      const incomeOnly = res.data.filter((txn) => txn.type === "Income");
      setIncomeTransactions(incomeOnly);
      setFilteredTransactions(incomeOnly);
    } catch (error) {
      console.error("Error fetching income data:", error);
    }
  };

  const filterByDate = () => {
    if (!fromDate || !toDate) return;
    const filtered = incomeTransactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return txnDate >= new Date(fromDate) && txnDate <= new Date(toDate);
    });
    setFilteredTransactions(filtered);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Income Transactions", 14, 10);
    autoTable(doc, {
      head: [["Date", "Amount", "Category", "Notes"]],
      body: filteredTransactions.map((txn) => [
        txn.date?.split("T")[0],
        `₹${txn.amount}`,
        txn.category,
        txn.notes,
      ]),
    });
    doc.save("income-transactions.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredTransactions.map((txn) => ({
        Date: txn.date?.split("T")[0],
        Amount: txn.amount,
        Category: txn.category,
        Notes: txn.notes,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Income");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "income-transactions.xlsx");
  };

  return (
    <div className="income-transactions-container">
    
      <div className="income-content">
        <h2>Income Transactions</h2>

        <div className="filter-section">
          <label>
            From: <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            To: <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <button onClick={filterByDate}>Filter</button>
          <button onClick={exportPDF}>Export PDF</button>
          <button onClick={exportExcel}>Export Excel</button>
        </div>

        {filteredTransactions.length === 0 ? (
          <p>No income transactions available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn._id}>
                  <td>{txn.date?.split("T")[0]}</td>
                  <td>₹{txn.amount}</td>
                  <td>{txn.category}</td>
                  <td>{txn.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Income;
