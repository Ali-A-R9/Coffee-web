import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/authApi";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e:React.FormEvent) {
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
          <h2>Login</h2>

          <form className="form-inline" onSubmit={handleSubmit} noValidate>
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />

            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <button type="submit">Sign in</button>

            <p className={message ? "error" : ""} aria-live="polite">
              {message}
            </p>
          </form>

          <div className="link">
            You do not have an account yet? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;