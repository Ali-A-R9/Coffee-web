import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";

type Role = "admin" | "owner" | "client";

function Login() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");

  const quickFill: Array<{ role: Role; label: string; email: string; password: string; icon: string }> = [
    { role: "admin", label: "Admin", email: "admin@admin.com", password: "admin1234", icon: "🛠️" },
    { role: "owner", label: "Owner", email: "owner@owner.com", password: "owner1234", icon: "☕" },
    { role: "client", label: "Client", email: "client@client.com", password: "client1234", icon: "👥" },
  ];

  function handleQuickFill(role: Role) {
    const item = quickFill.find((x) => x.role === role);
    if (!item) return;
    setSelectedRole(role);
    setEmail(item.email);
    setPassword(item.password);
    setMessage("");
  }

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();

    const error = login(email.trim(), password);

    if (error) {
      setMessage(error);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-side-content">
          <h1>Welcome Back</h1>
          <p>
            Sign in to manage your cafe profile, menu, preview website,
            and admin tools from one place.
          </p>
        </div>
      </div>

      <div className="auth-form-area">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your CafeSite account</p>

          <div className="login-role-tabs" role="tablist" aria-label="Role selection">
            <button
              type="button"
              className={selectedRole === "admin" ? "active" : ""}
              onClick={() => setSelectedRole("admin")}
            >
              Admin
            </button>
            <button
              type="button"
              className={selectedRole === "owner" ? "active" : ""}
              onClick={() => setSelectedRole("owner")}
            >
              Owner
            </button>
            <button
              type="button"
              className={selectedRole === "client" ? "active" : ""}
              onClick={() => setSelectedRole("client")}
            >
              Client
            </button>
          </div>

          <form className="form-inline" onSubmit={handleSubmit} noValidate>
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@admin"
            />

            <label htmlFor="login-password">Password</label>
            <div className="password-field-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••"
              />
              <button
                type="button"
                className="password-eye-btn"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="login-meta-row">
              <label htmlFor="remember-me" className="remember-me-check">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-link-btn">
                Forgot password?
              </button>
            </div>

            <button type="submit">Sign in</button>

            <p className={message ? "error" : ""} aria-live="polite">
              {message}
            </p>
          </form>

          <div className="quick-fill-box">
            <p>QUICK FILL CREDENTIALS</p>
            {quickFill.map((item) => (
              <button
                key={item.role}
                type="button"
                className="quick-fill-item"
                onClick={() => handleQuickFill(item.role)}
              >
                <span>
                  {item.icon} {item.label}: {item.email}
                </span>
                <span>→</span>
              </button>
            ))}
          </div>

          <div className="link">
            Don't have an account? <Link to="/register">Create your account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;