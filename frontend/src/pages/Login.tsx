import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            Sign in to manage your cafe profile, menu, preview website,
            and admin tools from one place.
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
    </div>
  );
}

export default Login;
