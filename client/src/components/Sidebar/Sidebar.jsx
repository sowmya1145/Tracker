import React from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom";
import { 
  Home, PlusCircle,Search, LogOut, 
  Wallet,BarChart
} from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Tracker</h2>
      </div>
      <nav className="sidebar-menu">
        <Link to="/dashboard" className="menu-item"><Home /> Dashboard</Link>
        <Link to="/transactions" className="menu-item"><PlusCircle /> Transactions</Link>
        <Link to="/search" className="menu-item"><Search /> Search</Link>
        <Link to="/budget" className="menu-item"><Wallet/> Budget Planner</Link>
      <Link to="/analytics" className="menu-item"><BarChart/> Analytics</Link>
      </nav>
      <div className="sidebar-footer">
        <Link to="/logout" className="menu-item logout"><LogOut /> Logout</Link>
      </div>
    </aside>
  );
};

export default Sidebar;
