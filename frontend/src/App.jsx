import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import StatsDashboard from './pages/StatsDashboard';

function App() {
  return (
    <Router>
      <div className="container-fluid p-0">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor-stats" element={<StatsDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;