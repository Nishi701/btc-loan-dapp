import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from './Header';
import Footer from './Footer';
import './Dashboard.css';
import {
  getLoanData,
  getBtcPrice,
  getProtocolStats,
  getLoanHistory,
} from "./canisterConnections";

const Dashboard = ({ principal, onLogout }) => {
  const [btcPrice, setBtcPrice] = useState(0);
  const [loan, setLoan] = useState({ btc: 0, iusd: 0 });
  const [stats, setStats] = useState({ total_btc_locked: 0, total_iusd_borrowed: 0 });
  const [history, setHistory] = useState([]);

  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-5)}`
    : "";


  const navigate = useNavigate();



  useEffect(() => {
    const fetchData = async () => {
      const [btc, iusd] = await getLoanData();
      const price = await getBtcPrice();
      const protocolStats = await getProtocolStats();
      const loanHistory = await getLoanHistory();

      setLoan({ btc, iusd });
      setBtcPrice(price);
      setStats(protocolStats);
      setHistory(loanHistory);
    };

    fetchData();
  }, []);

  return (
    <>
      {/* Header without back button, but with logout */}
      <Header title="Dashboard" onLogout={onLogout} />

      <main className="dashboard-container">
        <h2 className="dashboard-title">Welcome, {shortPrincipal}</h2>
        <div className="loan-actions-button-wrapper">
          <button
            className="navigate-button"
            onClick={() => navigate("/loan-actions")}
          >
            ➕ Loan Actions
          </button>
        </div>

        <div className="cards-wrapper">
          <div className="card slide-in delay-1">
            <h3>Loan Details</h3>
            <p><strong>BTC Locked:</strong> {loan.btc} sats</p>
            <p><strong>iUSD Borrowed:</strong> {loan.iusd} iUSD</p>
          </div>

          <div className="card slide-in delay-2">
            <h3>Live BTC Price</h3>
            <p>${btcPrice.toLocaleString()} / BTC</p>
          </div>

          <div className="card slide-in delay-3">
            <h3>Protocol Stats</h3>
            <p><strong>Total BTC Locked:</strong> {stats.total_btc_locked} sats</p>
            <p><strong>Total iUSD Borrowed:</strong> {stats.total_iusd_borrowed} iUSD</p>
          </div>
        </div>

        <div className="history-wrapper">
          <h2>Loan History</h2>
          <ul>
            {history.length === 0 && <li>No events found.</li>}
            {history.map((event, idx) => (
              <li key={idx}>
                [{new Date(event.timestamp / 1e6).toLocaleString()}] → <b>{event.action}</b>: {event.amount}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Dashboard;
