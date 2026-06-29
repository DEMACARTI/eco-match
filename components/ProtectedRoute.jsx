const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/" />;
  };
  
  // Then use it in Routes:
  <Route 
    path="/admin" 
    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
  />