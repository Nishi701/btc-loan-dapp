
import { useEffect } from 'react';
import LandingPage from './LandingPage';
import { useAuth } from './auth/AuthProvider';
import Dashboard from './components/Dashboard';
import LoanActions from './components/LoanActions';
import MintTokens from './components/MintTokens';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


function App() {
  const { isAuthenticated, login, logout, principal } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      login();
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage onGetStarted={login} />
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard principal={principal} onLogout={logout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/loan-actions"
          element={
            isAuthenticated ? (
              <LoanActions principal={principal} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/mint-tokens"
          element={
            isAuthenticated ? (
              <MintTokens principal={principal} />
            ) : (
              <Navigate to="/" />
            )
          }
        />


        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;
