import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../api/authApi";

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
<p className="small">Welcome, {user}</p>
  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Dashboard</h1>

        <div className="form-inline">
          <button onClick={() => navigate("/cafe-profile")}>
            Cafe Profile
          </button>

          <button onClick={() => navigate("/menu")}>
            Menu Management
          </button>

          <button onClick={() => navigate("/preview")}>
            Public Website Preview
          </button>

          <button onClick={() => navigate("/admin")}>
            Admin Panel
          </button>
        </div>

        <button className="ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;