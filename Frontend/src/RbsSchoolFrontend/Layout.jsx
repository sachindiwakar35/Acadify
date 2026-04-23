import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Dashboard.css";

export const Layout = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="layout">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">✦ Logo</div>

        {/* Hamburger (mobile only) */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {/* Desktop Nav Links */}
        <ul className="nav-links desktop-only">
          <li><Link to="/Dashboard">Dashboard</Link></li>
          <li><Link to="/Students">Student Data Management</Link></li>
          <li><Link to="/FeeManagement">Fee Management</Link></li>
          <li><Link to="/Classes">Classes</Link></li>
          <li><Link to="/Report">Report</Link></li>
          {/* <li><Link to="/AboutDeveloper">AboutDeveloper</Link></li> */}
        </ul>

        <button className="logout-btn desktop-only" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li><Link to="/Dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
          <li><Link to="/Students" onClick={() => setMenuOpen(false)}>Student Data Management</Link></li>
          <li><Link to="/FeeManagement" onClick={() => setMenuOpen(false)}>Fee Management</Link></li>
          <li><Link to="/Classes" onClick={() => setMenuOpen(false)}>Classes</Link></li>
          <li><Link to="/Report" onClick={() => setMenuOpen(false)}>Report</Link></li>
          {/* <li><Link to="/AboutDeveloper" onClick={() => setMenuOpen(false)}>AboutDeveloper</Link></li> */}
        </ul>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Page content */}
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};
