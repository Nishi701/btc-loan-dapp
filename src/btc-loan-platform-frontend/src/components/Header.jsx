import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ title, showBack = false, onLogout }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {showBack && (
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>

      <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
        ☰
      </button>

      <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => handleNavigate('/dashboard')} className="nav-link">
          Dashboard
        </button>
        <button onClick={() => handleNavigate('/loan-actions')} className="nav-link">
          Loan Actions
        </button>
        {onLogout && (
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
