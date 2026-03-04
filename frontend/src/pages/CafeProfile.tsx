import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/authApi";
import { getCafe, saveCafe } from "../api/cafeApi";

function CafeProfile() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Lazy initialize from localStorage (NO useEffect needed)
  const cafe = user ? getCafe(user) : null;

  const [name, setName] = useState(cafe?.name || "");
  const [description, setDescription] = useState(cafe?.description || "");
  const [hours, setHours] = useState(cafe?.hours || "");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!name.trim()) {
      setMessage("Cafe name is required.");
      setMessageType("error");
      return;
    }

    saveCafe(user, {
      name: name.trim(),
      description: description.trim(),
      hours: hours.trim(),
    });

    setMessage("Cafe information saved successfully!");
    setMessageType("success");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Cafe Profile</h1>

        <form className="form-inline" onSubmit={handleSubmit}>
          <label>Cafe Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label>Working Hours</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />

          <button type="submit">Save</button>

          <p className={messageType} aria-live="polite">
            {message}
          </p>
        </form>

        <button
          className="ghost"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CafeProfile;