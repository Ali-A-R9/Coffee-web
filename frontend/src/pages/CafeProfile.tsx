import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { getMyCafe, updateCafe, type CafeData, type CafeSocialLinks } from "../api/cafeApi";

const SOCIAL_LINK_FIELDS: Array<{
  key: keyof CafeSocialLinks;
  label: string;
  placeholder: string;
}> = [
  { key: "instagram", label: "Instagram", placeholder: "@yourcafe" },
  { key: "x", label: "X / Twitter", placeholder: "@yourcafe" },
  { key: "tiktok", label: "TikTok", placeholder: "@yourcafe" },
  { key: "snapchat", label: "Snapchat", placeholder: "@yourcafe" },
  { key: "website", label: "Website", placeholder: "https://yourcafe.com" },
];
const EMPTY_SOCIAL_LINKS: Required<CafeSocialLinks> = {
  instagram: "",
  x: "",
  tiktok: "",
  snapchat: "",
  website: "",
};

function formatHours(hours: CafeData["hours"]) {
  if (!hours) return { open: "", close: "" };
  if (typeof hours === "string") return { open: "", close: "" };
  return {
    open: hours.open || "",
    close: hours.close || "",
  };
}

function normalizeSocialLinks(socialLinks?: CafeSocialLinks): Required<CafeSocialLinks> {
  return {
    instagram: socialLinks?.instagram || "",
    x: socialLinks?.x || "",
    tiktok: socialLinks?.tiktok || "",
    snapchat: socialLinks?.snapchat || "",
    website: socialLinks?.website || "",
  };
}

function trimSocialLinks(socialLinks: CafeSocialLinks): Required<CafeSocialLinks> {
  return {
    instagram: socialLinks.instagram?.trim() || "",
    x: socialLinks.x?.trim() || "",
    tiktok: socialLinks.tiktok?.trim() || "",
    snapchat: socialLinks.snapchat?.trim() || "",
    website: socialLinks.website?.trim() || "",
  };
}

function isValidContactPhone(value: string) {
  return /^\+?[0-9][0-9\s().-]{6,19}$/.test(value.trim());
}

function hasCompleteLocation(address: string, city: string, state: string, zipCode: string) {
  return Boolean(address.trim() && city.trim() && state.trim() && zipCode.trim());
}

function CafeProfile() {
  const navigate = useNavigate();

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [socialLinks, setSocialLinks] =
    useState<Required<CafeSocialLinks>>(EMPTY_SOCIAL_LINKS);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zipCode, setZipCode] = useState("");
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
          setPhone(data.phone || "");
          setSocialLinks(normalizeSocialLinks(data.socialLinks));
          setAddress(data.address || "");
          setCity(data.city || "");
          setStateRegion(data.state || "");
          setZipCode(data.zipCode || "");

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

    if (!isValidContactPhone(phone)) {
      setMessage("Contact phone number is required. Use digits and an optional country code.");
      setMessageType("error");
      return;
    }

    if (!hasCompleteLocation(address, city, stateRegion, zipCode)) {
      setMessage("Cafe location is required. Add address, city, state/region, and zip code.");
      setMessageType("error");
      return;
    }

    try {
      const trimmedSocialLinks = trimSocialLinks(socialLinks);
      const result = await updateCafe({
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        socialLinks: trimmedSocialLinks,
        address: address.trim(),
        city: city.trim(),
        state: stateRegion.trim(),
        zipCode: zipCode.trim(),
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

  function updateSocialLink(field: keyof CafeSocialLinks, value: string) {
    setSocialLinks((prev) => ({
      ...prev,
      [field]: value,
    }));
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

          <label>Phone Number *</label>
          <input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966 5x xxx xxxx"
          />

          <label>Social Media Accounts (Optional)</label>
          {SOCIAL_LINK_FIELDS.map((field) => (
            <input
              key={field.key}
              value={socialLinks[field.key] || ""}
              onChange={(e) => updateSocialLink(field.key, e.target.value)}
              placeholder={`${field.label}: ${field.placeholder}`}
            />
          ))}

          <label>Location *</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
          />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          <input
            value={stateRegion}
            onChange={(e) => setStateRegion(e.target.value)}
            placeholder="State / Region"
          />
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Zip Code"
          />

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
