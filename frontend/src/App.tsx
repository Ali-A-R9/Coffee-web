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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route 
        path="/Profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
        />
        <Route
          path="/cafe-profile"
          element={
            <ProtectedRoute>
              <CafeProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/preview"
          element={
            <ProtectedRoute>
              <PublicPreview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client"
          element={
            <ProtectedRoute>
              <ClientView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;