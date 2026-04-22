import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  register,
  isValidEmail,
  validatePassword,
  type RegistrationRole,
} from "../api/authApi";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RegistrationRole>("client");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const livePasswordError = password ? validatePassword(password) : null;

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please complete all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Invalid email.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await register(name, email, password, role);

      setMessage("Account created successfully! Redirecting...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Register</h1>

        <form className="form-inline" onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-field-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="password-eye-btn"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="small">
            Use at least 8 characters with uppercase, lowercase, number, and special character.
          </p>
          {livePasswordError && <p className="error">{livePasswordError}</p>}

          <label>Confirm Password</label>
          <div className="password-field-wrap">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              className="password-eye-btn"
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className={passwordsMatch ? "success" : "small"}>
            {passwordsMatch ? "Matched!" : "Re-enter the same password to confirm."}
          </p>

          <label>Register As</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RegistrationRole)}
          >
            <option value="client">Client / User</option>
            <option value="owner">Cafe Owner</option>
          </select>

          <button type="submit">Create account</button>

          {message && <p className="error">{message}</p>}
        </form>

        <div className="link">
          Already have an account?{" "}
          <button
            className="ghost"
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
