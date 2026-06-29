import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import AdminDashboard from '../components/AdminDashboard';
import UserDashboard from '../components/UserDashboard';
import './App.css';
import VendorDashboard from '../components/VendorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/vendor" element={<VendorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;