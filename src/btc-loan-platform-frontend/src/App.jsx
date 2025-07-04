// import { useEffect } from 'react';
// import LandingPage from './LandingPage';
// import { useAuth } from './auth/AuthProvider';
// import Dashboard from './components/Dashboard';
// import LoanActions from './components/LoanActions';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// function App() {
//   const { isAuthenticated, login, logout, principal } = useAuth();

//   useEffect(() => {
//     if (!isAuthenticated) {
//       login(); // or prompt login somewhere
//     }
//   }, [isAuthenticated]);

//   return (
//     <Router>
//       <Routes>
//         <Route
//           path="/"
//           element={
//             isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage onGetStarted={login} />
//           }
//         />
//         <Route
//           path="/dashboard"
//           element={
//             isAuthenticated ? (
//               <Dashboard principal={principal} onLogout={logout} />
//             ) : (
//               <Navigate to="/" />
//             )
//           }
//         />
//         <Route
//           path="/loan-actions"
//           element={
//             isAuthenticated ? (
//               <LoanActions principal={principal} />
//             ) : (
//               <Navigate to="/" />
//             )
//           }
//         />
//         {/* Add a catch-all redirect if you want */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
import { useEffect } from 'react';
import LandingPage from './LandingPage';
import { useAuth } from './auth/AuthProvider';
import Dashboard from './components/Dashboard';
import LoanActions from './components/LoanActions';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const { isAuthenticated, login, logout, principal } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      login(); // Prompt login if not logged in
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

        {/* Optional: catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
