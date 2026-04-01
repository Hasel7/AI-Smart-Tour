import { Navigate } from "react-router-dom";

// Checks for a JWT token in sessionStorage.
// If found → renders the protected page.
// If not  → redirects to /login.
const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
