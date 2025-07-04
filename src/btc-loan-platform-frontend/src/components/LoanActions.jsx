import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanActor } from './canisterConnections';
import Header from './Header';
import Footer from './Footer';
import './LoanActions.css';

const LoanActions = ({ onLogout }) => {
  const navigate = useNavigate();
  const [depositAmount, setDepositAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleDeposit = async () => {
    try {
      setLoading(true);
      setStatus('Depositing...');
      await loanActor.deposit_btc(BigInt(depositAmount));
      setStatus(`✅ Deposited ${depositAmount} sats`);
    } catch (err) {
      console.error(err);
      setStatus(`❌ Deposit Failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      setLoading(true);
      setStatus('Borrowing...');
      const borrowed = await loanActor.borrow_iusd();
      setStatus(`✅ Borrowed ${Number(borrowed)} iUSD`);
    } catch (err) {
      console.error(err);
      setStatus(`❌ Borrow Failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    try {
      setLoading(true);
      setStatus('Repaying...');
      await loanActor.repay_iusd(BigInt(repayAmount));
      setStatus(`✅ Repaid ${repayAmount} iUSD`);
    } catch (err) {
      console.error(err);
      setStatus(`❌ Repay Failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Loan Actions" showBack={true} onLogout={onLogout} />

      <main className="loan-actions-container">
        <h2 className="page-title">Manage Your Loans</h2>

        <div className="action-section">
          <input
            type="number"
            placeholder="Enter BTC amount (sats)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="action-input"
          />
          <button
            className="action-button deposit"
            onClick={handleDeposit}
            disabled={loading}
          >
            Deposit BTC
          </button>
        </div>

        <div className="action-section">
          <button
            className="action-button borrow"
            onClick={handleBorrow}
            disabled={loading}
          >
            Borrow iUSD
          </button>
        </div>

        <div className="action-section">
          <input
            type="number"
            placeholder="Enter iUSD amount"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
            className="action-input"
          />
          <button
            className="action-button repay"
            onClick={handleRepay}
            disabled={loading}
          >
            Repay iUSD
          </button>
        </div>

        {status && <p className="status-message">{status}</p>}
      </main>

      <Footer />
    </>
  );
};

export default LoanActions;
