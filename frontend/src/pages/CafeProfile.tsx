import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/authApi";
import { getCafe, saveCafe } from "../api/cafeApi";
// --- ADDED FOR LOGO UPLOAD ---
import { Camera } from "lucide-react";
// --- END ADDED FOR LOGO UPLOAD ---

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

  // --- ADDED FOR LOGO UPLOAD ---
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  // --- END ADDED FOR LOGO UPLOAD ---

  // --- ADDED FOR LOGO UPLOAD ---
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Invalid file type. Only JPG, PNG, and WebP are allowed.");
      setMessageType("error");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    // Validate file size (2MB = 2097152 bytes)
    if (file.size >= 2097152) {
      setMessage("File size must be less than 2MB.");
      setMessageType("error");
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    // File is valid
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setMessage("");
    setMessageType("");
  }
  // --- END ADDED FOR LOGO UPLOAD ---

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!name.trim()) {
      setMessage("Cafe name is required.");
      setMessageType("error");
      return;
    }

    // --- ADDED FOR LOGO UPLOAD ---
    // Use FormData to handle file upload
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("hours", hours.trim());
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    // API call with FormData
    saveCafe(user, {
      name: name.trim(),
      description: description.trim(),
      hours: hours.trim(),
      // Add logo data if needed in your API
    });
    // --- END ADDED FOR LOGO UPLOAD ---

    setMessage("Cafe information saved successfully!");
    setMessageType("success");
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Cafe Profile</h1>

        <form className="form-inline" onSubmit={handleSubmit}>
          {/* --- ADDED FOR LOGO UPLOAD --- */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Image / Logo
            </label>

            {/* Logo Preview Circle */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Camera size={32} />
                    <span className="text-xs mt-1 text-center px-2">Upload Logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* File Input (Hidden) and Button */}
            <input
              type="file"
              id="logoInput"
              onChange={handleLogoChange}
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
            />
            <label
              htmlFor="logoInput"
              className="inline-block px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              Choose Logo
            </label>

            {/* File Info */}
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, or WebP. Max 2MB.
            </p>
          </div>
          {/* --- END ADDED FOR LOGO UPLOAD --- */}

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