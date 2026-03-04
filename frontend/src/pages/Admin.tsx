import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";

function Admin() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Admin Panel</h1>

        <p className="small">
          Admin will view, approve, deactivate, or delete cafes here.
        </p>

        <button
          className="ghost"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>

        <button
          className="ghost"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Admin;