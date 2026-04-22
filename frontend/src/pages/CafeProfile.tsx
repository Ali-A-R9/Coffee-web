import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { getMyCafe, updateCafe, type CafeData } from "../api/cafeApi";

function formatHours(hours: CafeData["hours"]) {
  if (!hours) return { open: "", close: "" };
  if (typeof hours === "string") return { open: "", close: "" };
  return {
    open: hours.open || "",
    close: hours.close || "",
  };
}

function CafeProfile() {
  const navigate = useNavigate();

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCafe() {
      try {
        const data = await getMyCafe();
        setCafe(data);

        if (data) {
          setName(data.name || "");
          setDescription(data.description || "");

          const hours = formatHours(data.hours);
          setOpenTime(hours.open);
          setCloseTime(hours.close);
          setLogoPreview(data.logoUrl || data.logo || null);
        }
      } catch {
        setCafe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCafe();
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Invalid file type. Only JPG, PNG, and WebP are allowed.");
      setMessageType("error");
      return;
    }

    if (file.size >= 2097152) {
      setMessage("File size must be less than 2MB.");
      setMessageType("error");
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
    setMessage("Logo preview updated locally. Save a URL from Owner Dashboard to persist it.");
    setMessageType("success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Cafe name is required.");
      setMessageType("error");
      return;
    }

    try {
      const result = await updateCafe({
        name: name.trim(),
        description: description.trim(),
        hours: {
          open: openTime.trim(),
          close: closeTime.trim(),
        },
      });

      setCafe(result.cafe);
      setMessage("Cafe updated successfully!");
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update cafe");
      setMessageType("error");
    }
  }

  if (loading) return <p>Loading...</p>;

  if (!cafe) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>No cafe found</h2>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Cafe Profile</h1>

        <form className="form-inline" onSubmit={handleSubmit}>
          <div className="mb-6">
            <label>Profile Image / Logo</label>

            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full border flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} />
                )}
              </div>
            </div>

            <input
              type="file"
              onChange={handleLogoChange}
              accept=".jpg,.jpeg,.png,.webp"
            />
          </div>

          <label>Cafe Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Opening Time</label>
          <input value={openTime} onChange={(e) => setOpenTime(e.target.value)} />

          <label>Closing Time</label>
          <input value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />

          <button type="submit">Save</button>

          <p className={messageType}>{message}</p>
        </form>

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CafeProfile;
