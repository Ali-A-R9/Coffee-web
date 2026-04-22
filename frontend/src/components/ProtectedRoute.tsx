import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  role?: string;
};

function ProtectedRoute({ children, role }: Props) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // wrong role
  if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;