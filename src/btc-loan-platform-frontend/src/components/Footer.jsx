import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="footer-content">
      <div className="footer-section description">
        <h3>BTC Loan Platform</h3>
        <p>Secure Bitcoin-backed loans with collateral management and instant iUSD borrowing.</p>
      </div>
      <div className="footer-section links">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/loan-actions">Loan Actions</a></li>
          <li><a href="/terms">Terms & Conditions</a></li>
          <li><a href="/support">Support</a></li>
        </ul>
      </div>
      <div className="footer-section social">
        <h4>Follow Us</h4>
        <div className="social-icons">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">🐦 Twitter</a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">📘 Facebook</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">🔗 LinkedIn</a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2025 BTC Loan Platform. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
