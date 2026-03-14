import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Admin");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("auth_user");
    const savedName = localStorage.getItem("auth_name");
    const savedPhone = localStorage.getItem("auth_phone");
    const savedRole = localStorage.getItem("auth_role");

    if (!savedEmail) {
      navigate("/");
      return;
    }

    setEmail(savedEmail);
    setName(savedName || "");
    setPhone(savedPhone || "");
    setRole(savedRole || "Admin");
  }, [navigate]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setMessage("Name and email are required.");
      setMessageType("error");
      return;
    }

    localStorage.setItem("auth_name", name.trim());
    localStorage.setItem("auth_user", email.trim());
    localStorage.setItem("auth_phone", phone.trim());
    localStorage.setItem("auth_role", role.trim());

    setMessage("Profile updated successfully.");
    setMessageType("success");
  }

  function handleLogout() {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_name");
    localStorage.removeItem("auth_phone");
    localStorage.removeItem("auth_role");

    navigate("/");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>My Profile</h1>

        <form className="form-inline" onSubmit={handleSave} noValidate>
          <label>Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label>Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />

          <p className={messageType} aria-live="polite">
            {message}
          </p>

          <div className="profile-actions">
            <button className="ghost" type="button" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>

            <button type="submit">Save Changes</button>

            <button className="ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;