import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMe,
  updateMe,
  logout,
  type AuthUser,
} from "../api/authApi";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMe();
        setProfile(data);
        setFullName(data.fullName || "");
        setEmail(data.email || "");
      } catch {
        logout();
        navigate("/");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      setMessage("Name and email are required.");
      setMessageType("error");
      return;
    }

    try {
      const result = await updateMe({
        fullName: fullName.trim(),
        email: email.trim(),
      });

      setProfile(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("role", result.user.role);
      setMessage("Profile updated successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update profile");
      setMessageType("error");
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading profile...</p>;
  }

  if (!profile) {
    return <p style={{ padding: "40px" }}>Profile not found.</p>;
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
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Role</label>
          <input type="text" value={profile.role} disabled />

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
