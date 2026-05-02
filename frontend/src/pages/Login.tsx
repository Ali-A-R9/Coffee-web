import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/authApi";
import { Eye, EyeOff, LifeBuoy } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const data = await login(email.trim(), password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate(data.role === "owner" ? "/dashboard" : "/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-side-content">
          <h1>Welcome Back</h1>
          <p>
            Access your CafeSite account to manage cafes, explore menus,
            and keep your workspace organized in one place.
          </p>
        </div>
      </div>

      <div className="auth-form-area">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your CafeSite account</p>

          <form className="form-inline" onSubmit={handleSubmit}>
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />

            <label>Password</label>
            <div className="password-field-wrap">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                className="password-eye-btn"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="login-meta-row">
              <span />
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => setShowResetHelp(true)}
              >
                Forgot / reset password?
              </button>
            </div>

            <button type="submit">Sign in</button>

            {message && <p className="error">{message}</p>}
          </form>

          <div className="link">
            Don't have an account?{" "}
            <Link to="/register">Create your account</Link>
          </div>

          <div className="link">
            Want to browse first?{" "}
            <Link to="/">View cafes</Link>
          </div>
        </div>
      </div>

      {showResetHelp && (
        <div className="reset-modal-backdrop" role="presentation">
          <section
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >
            <div className="reset-modal-icon" aria-hidden="true">
              <LifeBuoy size={26} />
            </div>
            <h2 id="reset-modal-title">Password Reset Support</h2>
            <p>
              To reset your password, please contact support at{" "}
              <strong>s202253340@kfupm.edu.sa</strong>.
            </p>
            <p>
              We will verify your account and provide a temporary password for you.
            </p>
            <button
              type="button"
              className="reset-modal-close"
              onClick={() => setShowResetHelp(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default Login;
