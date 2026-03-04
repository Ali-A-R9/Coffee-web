import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const error = login(email.trim(), password);

    if (error) {
      setMessage(error);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Login</h1>

        <form className="form-inline" onSubmit={handleSubmit} noValidate>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Sign in</button>

          <p
            className={message ? "error" : ""}
            aria-live="polite"
          >
            {message}
          </p>
        </form>

        <div className="link">
          You do not have an account yet?{" "}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;