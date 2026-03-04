import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "../api/authApi";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password) {
      setMessage("Please complete all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Invalid email.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    localStorage.setItem("auth_user", email);
    navigate("/dashboard");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Register</h1>

        <form className="form-inline" onSubmit={handleSubmit} noValidate>
          <label>Name</label>
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

          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Create account</button>

          <p className="error" aria-live="polite">
            {message}
          </p>
        </form>

        <div className="link">
          Already have an account?{" "}
          <button
            className="ghost"
            type="button"
            onClick={() => navigate("/")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;