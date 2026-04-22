import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import OwnerDashboard from "./pages/OwnerDashboard";
import CafeProfile from "./pages/CafeProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import Menu from "./pages/Menu";
import PublicPreview from "./pages/PublicPreview";
import Admin from "./pages/Admin";
import ClientView from "./pages/ClientView";
import useAutoLogout from "./hooks/useAutoLogout";

// 🔥 Wrapper component INSIDE Router
function AppRoutes() {
  useAutoLogout(); // ✅ now safe

  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<ClientView />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* OWNER ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute role="owner">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cafe-profile"
        element={
          <ProtectedRoute role="owner">
            <CafeProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/menu"
        element={
          <ProtectedRoute role="owner">
            <Menu />
          </ProtectedRoute>
        }
      />

      <Route
        path="/preview"
        element={
          <ProtectedRoute role="owner">
            <PublicPreview />
          </ProtectedRoute>
        }
      />

      {/* CLIENT */}
      <Route
        path="/client"
        element={
          <ClientView />
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
