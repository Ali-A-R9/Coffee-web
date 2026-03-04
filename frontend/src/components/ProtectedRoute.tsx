import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/authApi";

type Props = {
  children: React.ReactNode;
};

function ProtectedRoute({ children }: Props) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;