import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import "./Search.css";

const Search = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/transactions");
      setTransactions(res.data);
      setFilteredTransactions(res.data);

      const uniqueCategories = [...new Set(res.data.map((txn) => txn.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleSearch = () => {
    let results = [...transactions];
    if (dateFrom) results = results.filter((t) => new Date(t.date) >= new Date(dateFrom));
    if (dateTo) results = results.filter((t) => new Date(t.date) <= new Date(dateTo));
    if (category) results = results.filter((t) => t.category.toLowerCase().includes(category.toLowerCase()));
    if (amountMin) results = results.filter((t) => Number(t.amount) >= Number(amountMin));
    if (amountMax) results = results.filter((t) => Number(t.amount) <= Number(amountMax));
    setFilteredTransactions(results);
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategory("");
    setAmountMin("");
    setAmountMax("");
    setFilteredTransactions(transactions);
  };

  const closeDropdown = () => setShowExportOptions(false);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Transactions Report", 14, 22);
    const tableColumn = ["Date", "Type", "Amount", "Category", "Notes"];
    const tableRows = filteredTransactions.map((txn) => [
      txn.date?.split("T")[0],
      txn.type,
      `₹${txn.amount}`,
      txn.category,
      txn.notes,
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    doc.save("transactions.pdf");
    closeDropdown();
  };

  const exportToWord = () => {
    const tableRows = [
      new TableRow({
        children: ["Date", "Type", "Amount", "Category", "Notes"].map(
          (text) => new TableCell({ children: [new Paragraph(text)] })
        ),
      }),
      ...filteredTransactions.map(
        (txn) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(txn.date?.split("T")[0])] }),
              new TableCell({ children: [new Paragraph(txn.type)] }),
              new TableCell({ children: [new Paragraph(`₹${txn.amount}`)] }),
              new TableCell({ children: [new Paragraph(txn.category)] }),
              new TableCell({ children: [new Paragraph(txn.notes)] }),
            ],
          })
      ),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "Transactions Report", heading: "Heading1" }),
            new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "transactions.docx");
      closeDropdown();
    });
  };

  const exportToExcel = () => {
    const data = filteredTransactions.map((txn) => ({
      Date: txn.date?.split("T")[0],
      Type: txn.type,
      Amount: txn.amount,
      Category: txn.category,
      Notes: txn.notes,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions.xlsx");
    closeDropdown();
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(category.toLowerCase())
  );

  return (
    <div className="transaction-page-container">
      <Sidebar />
      <div className="transaction-content">
        <h2>Search & Filter Transactions</h2>
        <div className="form">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <div className="category-dropdown-wrapper">
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setShowCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
            />
            {showCategoryDropdown && filteredCategories.length > 0 && (
              <ul className="custom-category-dropdown">
                {filteredCategories.map((cat, idx) => (
                  <li key={idx} onMouseDown={() => setCategory(cat)}>
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            placeholder="Min Amount"
            type="number"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
          />
          <input
            placeholder="Max Amount"
            type="number"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
          />
        </div>

        <div className="button-container">
          <button onClick={handleSearch}>Search</button>
          <button onClick={resetFilters}>Reset</button>
          <div className="export-dropdown-wrapper">
            <button onClick={() => setShowExportOptions(!showExportOptions)}>Export ▼</button>
            {showExportOptions && (
              <div className="export-options">
                <button onClick={exportToPDF}>PDF</button>
                <button onClick={exportToWord}>Word</button>
                <button onClick={exportToExcel}>Excel</button>
              </div>
            )}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn) => (
              <tr key={txn._id}>
                <td>{txn.date?.split("T")[0]}</td>
                <td>{txn.type}</td>
                <td>₹{txn.amount}</td>
                <td>{txn.category}</td>
                <td>{txn.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <p style={{ textAlign: "center" }}>No transactions found.</p>
        )}
      </div>
    </div>
  );
};

export default Search;
