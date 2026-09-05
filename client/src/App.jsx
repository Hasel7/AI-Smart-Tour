import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import CreateAccount from "./components/CreateAccount";
import Onboarding from "./components/Onboarding";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import TourResults from "./components/TourResults";
import PlaceDetails from "./components/PlaceDetails";
import SavedPlaces from "./components/SavedPlaces";
import Profile from "./components/Profile";
import MapExplore from "./components/MapExplore";
import Preferences from "./components/Preferences";
import AdminDashboard from "./components/AdminDashboard";
import { useEffect } from "react";

import OfflineBanner from "./components/OfflineBanner";

function App() {
  const token = sessionStorage.getItem("token");

  // Globally initialize dark mode on initial app render
  useEffect(() => {
    const isDark = JSON.parse(localStorage.getItem("theme_dark")) || false;
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <>
      <OfflineBanner />
      <Routes>
      {/* If already logged in, redirect / to /dashboard */}
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <Onboarding />}
      />
      <Route path="/create-account" element={<CreateAccount />} />
      <Route path="/login" element={<Login />} />

      {/* Protected route — only accessible with a token */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/tour-results"
        element={
          <PrivateRoute>
            <TourResults />
          </PrivateRoute>
        }
      />
      <Route
        path="/places/:id"
        element={
          <PrivateRoute>
            <PlaceDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <PrivateRoute>
            <SavedPlaces />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/map"
        element={
          <PrivateRoute>
            <MapExplore />
          </PrivateRoute>
        }
      />
      <Route
        path="/preferences"
        element={
          <PrivateRoute>
            <Preferences />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      </Routes>
    </>
  );
}

export default App;
