import React, { useState, useEffect } from 'react';
import { mintBtcTokens, getBtcBalance } from './canisterConnections';
import Header from './Header';
import Footer from './Footer';

const MintTokens = ({ principal }) => {
  const [pi, setPi] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [btcBalance, setBtcBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (principal) {
      setPi(principal);
      fetchBtcBalance(principal);
    }
  }, [principal]);

  const fetchBtcBalance = async (pid) => {
    const balance = await getBtcBalance(pid);
    setBtcBalance(balance);
  };

  const formatBTC = (sats) => (Number(sats) / 100_000_000).toFixed(8);

  const handleMint = async () => {
    if (!pi || !amount) {
      setStatus('⚠️ Please fill in both fields');
      return;
    }

    try {
      setLoading(true);
      setStatus('⏳ Minting tokens...');
      await mintBtcTokens(pi, amount);
      setStatus(`✅ Successfully minted ${amount} sats (${formatBTC(amount)} BTC) to your wallet`);
      setAmount('');
      await fetchBtcBalance(pi);
    } catch (err) {
      setStatus(`❌ Mint failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Mint BTC Tokens" showBack={true} />

      <div
        style={{
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          wordBreak: 'break-all',
        }}
      >
        <strong>Your Principal ID:</strong> {principal || 'Loading...'}
      </div>

      <main style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Mint BTC Tokens</h2>
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '-1rem', marginBottom: '1rem' }}>
            💡 Note: 1 BTC = 100,000,000 sats
          </p>


          <label style={styles.label}>Principal ID</label>
          <input
            type="text"
            value={pi}
            onChange={(e) => setPi(e.target.value)}
            disabled={loading}
            style={styles.input}
          />

          <label style={styles.label}>Amount to Mint (in sats)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100000 (0.001 BTC)"
            disabled={loading}
            style={styles.input}
          />

          <button onClick={handleMint} disabled={loading} style={styles.button}>
            {loading ? 'Minting...' : 'Mint Tokens'}
          </button>

          {status && <p style={styles.status}>{status}</p>}

          {btcBalance !== null && (
            <p style={styles.balance}>
              💰 <strong>Your Total BTC Balance:</strong><br />
              {btcBalance} sats = {formatBTC(btcBalance)} BTC
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

const styles = {
  container: {
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    minHeight: '80vh',
  },
  card: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '450px',
    width: '100%',
  },
  title: {
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#333',
  },
  label: {
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '1.25rem',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  status: {
    marginTop: '1rem',
    fontSize: '0.95rem',
    color: '#333',
    textAlign: 'center',
  },
  balance: {
    marginTop: '1.5rem',
    fontSize: '1rem',
    textAlign: 'center',
    backgroundColor: '#f0fff4',
    padding: '0.75rem',
    borderRadius: '8px',
    color: '#056344',
    lineHeight: '1.6',
  },
};

export default MintTokens;
