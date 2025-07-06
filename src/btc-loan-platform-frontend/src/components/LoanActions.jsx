

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanActor, getUserLoanData } from './canisterConnections'; 
import Header from './Header';
import Footer from './Footer';
import './LoanActions.css';

const LoanActions = ({ principal, onLogout }) => {
  const navigate = useNavigate();
  const [depositAmount, setDepositAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [btcLocked, setBtcLocked] = useState(null);

  const handleDeposit = async () => {
    if (!depositAmount || BigInt(depositAmount) <= 0) {
      setStatus('⚠️ Enter a valid amount to deposit.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Depositing BTC...');
      await loanActor.deposit_btc(BigInt(depositAmount));
      setStatus(`✅ Deposited ${depositAmount} sats.`);
      setDepositAmount('');
    } catch (err) {
      console.error(err);
      setStatus(`❌ Deposit Failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      setLoading(true);
      setStatus('Borrowing...');
      const borrowed = await loanActor.borrow_iusd();
      setStatus(`✅ Borrowed ${Number(borrowed)} iUSD.`);
    } catch (err) {
      console.error(err);
      setStatus(`❌ Borrow Failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || BigInt(repayAmount) <= 0) {
      setStatus('⚠️ Enter a valid amount to repay.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Repaying...');
      await loanActor.repay_iusd(BigInt(repayAmount));
      setStatus(`✅ Repaid ${repayAmount} iUSD.`);
      setRepayAmount('');
    } catch (err) {
      console.error(err);
      setStatus(`❌ Repay Failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLocked = async () => {
    setStatus('Fetching deposit...');
    try {
      const { btcLocked } = await getUserLoanData();
      setBtcLocked(btcLocked);
      setStatus('');
    } catch (err) {
      setStatus('❌ Failed to fetch deposit.');
    }
  };

  const handleMintBtc = async () => {
    try {
      setLoading(true);
      const amount = BigInt(1_000_000); // 0.01 BTC in sats
      await ckbtcActor.mint(principal, amount);
      setStatus(`✅ Minted ${amount} sats of BTC.`);
    } catch (err) {
      setStatus(`❌ Minting failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Loan Actions" showBack={true} onLogout={onLogout} />
      <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', marginBottom: '1rem', fontSize: '0.9rem' }}>
        <strong>Your Principal ID:</strong> {principal}
      </div>

      <main className="loan-actions-container">
        <h2 className="page-title">Manage Your Loans</h2>

        <div className="action-section">
          <input
            type="number"
            placeholder="Enter BTC amount (sats)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="action-input"
            min="1"
            disabled={loading}
          />
          <button
            className="action-button deposit"
            onClick={handleDeposit}
            disabled={loading || !depositAmount || BigInt(depositAmount) <= 0}
          >
            Deposit BTC
          </button>
        </div>

        <div className="action-section">
          <button className="action-button borrow" onClick={handleBorrow} disabled={loading}>
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
            min="1"
            disabled={loading}
          />
          <button
            className="action-button repay"
            onClick={handleRepay}
            disabled={loading || !repayAmount || BigInt(repayAmount) <= 0}
          >
            Repay iUSD
          </button>
        </div>

        <div className="action-section">
          <button className="action-button" onClick={handleCheckLocked} disabled={loading}>
            Show My Deposited BTC
          </button>
          {btcLocked !== null && (
            <p className="status-message">
              🔐 BTC Locked as Collateral: <strong>{btcLocked}</strong> sats
            </p>
          )}
        </div>

        <div className="action-section">
          <button className="action-button" onClick={handleMintBtc} disabled={loading}>
            🪙 Mint BTC for Testing
          </button>
        </div>

        {status && <p className="status-message">{status}</p>}
      </main>

      <Footer />
    </>
  );
};

export default LoanActions;
