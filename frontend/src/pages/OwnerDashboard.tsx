import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee,
  Eye,
  Home,
  List,
  LogOut,
  Menu,
  Palette,
  Plus,
  Printer,
  QrCode,
  Share2,
  Upload,
  User,
  Users,
  Download,
} from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi";
import { getCafe, saveCafe } from "../api/cafeApi";
import { getMenu, saveMenu } from "../api/menuApi";
import type { Category } from "../types/menu";

type OwnerSection = "dashboard" | "profile" | "menu" | "theme" | "qr";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type WorkingHours = Record<(typeof weekDays)[number], { open: string; close: string }>;

const defaultWorkingHours: WorkingHours = {
  Monday: { open: "08:00 AM", close: "06:00 PM" },
  Tuesday: { open: "08:00 AM", close: "06:00 PM" },
  Wednesday: { open: "08:00 AM", close: "06:00 PM" },
  Thursday: { open: "08:00 AM", close: "06:00 PM" },
  Friday: { open: "08:00 AM", close: "06:00 PM" },
  Saturday: { open: "08:00 AM", close: "06:00 PM" },
  Sunday: { open: "08:00 AM", close: "06:00 PM" },
};

function OwnerDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const cafe = useMemo(() => (user ? getCafe(user) : null), [user]);
  const initialMenu = useMemo(() => (user ? getMenu(user) : []), [user]);

  const [activeSection, setActiveSection] = useState<OwnerSection>("dashboard");
  const [menuData, setMenuData] = useState<Category[]>(initialMenu);

  const [name, setName] = useState(cafe?.name || "Brew & Bean");
  const [ownerName, setOwnerName] = useState(cafe?.ownerName || "John Smith");
  const [email, setEmail] = useState(user || "owner@brewbean.com");
  const [phone, setPhone] = useState(cafe?.phone || "+1 (555) 123-4567");
  const [description, setDescription] = useState(
    cafe?.description ||
      "A cozy neighborhood cafe serving artisanal coffee and fresh pastries. Perfect spot for remote work or catching up with friends."
  );
  const [address, setAddress] = useState(cafe?.address || "123 Main Street, Downtown");
  const [city, setCity] = useState(cafe?.city || "Seattle");
  const [state, setState] = useState(cafe?.state || "WA");
  const [zipCode, setZipCode] = useState(cafe?.zipCode || "98101");
  const [logoPreview, setLogoPreview] = useState<string | null>(cafe?.logo || null);
  const [profileMessage, setProfileMessage] = useState("");

  const [workingHours, setWorkingHours] = useState<WorkingHours>(() => {
    const incoming = cafe?.workingHours;
    if (!incoming) return defaultWorkingHours;

    return weekDays.reduce((acc, day) => {
      acc[day] = incoming[day] || defaultWorkingHours[day];
      return acc;
    }, {} as WorkingHours);
  });

  const [newCategory, setNewCategory] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(0);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  function handleLogout() {
    logout();
    navigate("/");
  }

  function updateMenu(updated: Category[]) {
    if (!user) return;
    setMenuData(updated);
    saveMenu(user, updated);
  }

  function addCategory() {
    if (!newCategory.trim()) return;
    updateMenu([...menuData, { name: newCategory.trim(), items: [] }]);
    setNewCategory("");
  }

  function addItem() {
    if (!newItemName.trim() || !newItemPrice.trim() || menuData.length === 0) return;

    const updated = [...menuData];
    updated[newItemCategory].items.push({
      name: newItemName.trim(),
      price: newItemPrice.trim(),
    });

    updateMenu(updated);
    setNewItemName("");
    setNewItemPrice("");
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    const updated = [...menuData];
    updated[categoryIndex].items.splice(itemIndex, 1);
    updateMenu(updated);
  }

  function updateItemAvailability(categoryIndex: number, itemIndex: number, available: boolean) {
    const updated = [...menuData];
    const current = updated[categoryIndex].items[itemIndex];
    updated[categoryIndex].items[itemIndex] = {
      ...current,
      available,
    };
    updateMenu(updated);
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileMessage("Only JPG, PNG, and WebP are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage("Logo must be less than 2MB.");
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
    setProfileMessage("");
  }

  function saveProfile() {
    if (!user) return;

    saveCafe(user, {
      name: name.trim(),
      description: description.trim(),
      hours: `${workingHours.Monday.open} - ${workingHours.Monday.close}`,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      logo: logoPreview,
      workingHours,
    });

    setProfileMessage("Profile updated successfully.");
  }

  const menuItemsCount = menuData.reduce((total, category) => total + category.items.length, 0);

  const navItems: Array<{ key: OwnerSection; label: string; icon: React.ReactNode }> = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { key: "profile", label: "Cafe Profile", icon: <User size={18} /> },
    { key: "menu", label: "Menu Management", icon: <Menu size={18} /> },
    { key: "theme", label: "Theme Selection", icon: <Palette size={18} /> },
    { key: "qr", label: "QR Code", icon: <QrCode size={18} /> },
  ];

  return (
    <div className="owner-layout">
      <aside className="owner-sidebar">
        <div>
          <div className="owner-brand">
            <span className="owner-brand-icon">
              <Coffee size={14} />
            </span>
            <strong>CafeSite</strong>
          </div>
          <p className="owner-sidebar-title">CAFE MANAGEMENT</p>

          <div className="owner-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`owner-nav-item ${activeSection === item.key ? "active" : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="owner-sidebar-footer">
          <div className="owner-user-pill">
            <strong>{ownerName}</strong>
            <span>{name}</span>
          </div>
          <button type="button" className="owner-logout" onClick={handleLogout}>
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="owner-main">
        {activeSection === "dashboard" && (
          <section>
            <h1 className="owner-title">Welcome Back, {ownerName}! ☕</h1>
            <p className="owner-subtitle">Manage your cafe and track your performance</p>
            <div className="owner-status-row">
              <span className="owner-pill owner-pill-pending">Pending Admin Approval</span>
              <span className="owner-pill owner-pill-live">Profile Synced</span>
            </div>

            <div className="owner-alert">
              <strong>Account Pending Approval</strong>
              <p>Your cafe is currently under review by our admin team. You'll receive an email once approved.</p>
            </div>

            <div className="owner-stats">
              <div className="owner-stat-card">
                <Eye size={20} />
                <strong>1,234</strong>
                <span>Page Views</span>
              </div>
              <div className="owner-stat-card">
                <Users size={20} />
                <strong>856</strong>
                <span>Total Visitors</span>
              </div>
              <div className="owner-stat-card">
                <List size={20} />
                <strong>{menuItemsCount}</strong>
                <span>Menu Items</span>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Quick Actions</h2>
              <div className="owner-quick-grid">
                <button type="button" className="owner-action" onClick={() => setActiveSection("profile")}>
                  <User size={18} />
                  <span>Edit Cafe Profile</span>
                </button>
                <button type="button" className="owner-action" onClick={() => setActiveSection("menu")}>
                  <Menu size={18} />
                  <span>Manage Menu</span>
                </button>
                <button type="button" className="owner-action" onClick={() => setActiveSection("theme")}>
                  <Palette size={18} />
                  <span>Change Theme</span>
                </button>
                <button type="button" className="owner-action" onClick={() => setActiveSection("qr")}>
                  <QrCode size={18} />
                  <span>View QR Code</span>
                </button>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Your Public Website</h2>
              <div className="owner-site-row">
                <div>
                  <strong>{name}</strong>
                  <p>{name.toLowerCase().split(" ").join("")}.cafesite.com</p>
                </div>
                <button type="button" className="owner-secondary" onClick={() => navigate("/preview")}>
                  <Eye size={14} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profile" && (
          <section>
            <h1 className="owner-title">Cafe Profile</h1>
            <p className="owner-subtitle">Manage your cafe information and branding</p>

            <div className="owner-panel">
              <h2>Cafe Logo</h2>
              <div className="owner-logo-row">
                <div className="owner-logo-preview">
                  {logoPreview ? <img src={logoPreview} alt="Cafe logo" /> : <span>☕</span>}
                </div>
                <div>
                  <input id="ownerLogo" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onLogoChange} hidden />
                  <label htmlFor="ownerLogo" className="owner-secondary owner-upload">
                    <Upload size={14} />
                    <span>Upload Logo</span>
                  </label>
                  <p className="small">Upload your cafe logo. Recommended size: 200x200px</p>
                </div>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Basic Information</h2>
              <div className="owner-form-grid">
                <div>
                  <label htmlFor="owner-cafe-name">Cafe Name</label>
                  <input id="owner-cafe-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="owner-name">Owner Name</label>
                  <input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="owner-email">Email Address</label>
                  <input id="owner-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="owner-phone">Phone Number</label>
                  <input id="owner-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="full">
                  <label htmlFor="owner-description">Description</label>
                  <textarea id="owner-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Location</h2>
              <div className="owner-form-grid">
                <div className="full">
                  <label htmlFor="owner-address">Address</label>
                  <input id="owner-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="owner-city">City</label>
                  <input id="owner-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="owner-state">State</label>
                  <input id="owner-state" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="owner-zip">Zip Code</label>
                  <input id="owner-zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Working Hours</h2>
              <div className="owner-hours-grid">
                {weekDays.map((day) => (
                  <div key={day} className="owner-hours-row">
                    <span>{day}</span>
                    <input
                      value={workingHours[day].open}
                      onChange={(e) =>
                        setWorkingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], open: e.target.value },
                        }))
                      }
                    />
                    <span>to</span>
                    <input
                      value={workingHours[day].close}
                      onChange={(e) =>
                        setWorkingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], close: e.target.value },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="button" className="owner-primary" onClick={saveProfile}>
              Save Profile
            </button>
            <p className={profileMessage ? "success" : "small"}>{profileMessage || " "}</p>
          </section>
        )}

        {activeSection === "menu" && (
          <section>
            <h1 className="owner-title">Menu Management</h1>
            <p className="owner-subtitle">Create and manage your menu categories and items</p>

            <div className="owner-menu-layout">
              <div className="owner-panel">
                <h2>Menu Categories</h2>
                <div className="owner-inline-add">
                  <input
                    placeholder="New category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button type="button" className="owner-primary" onClick={addCategory}>
                    <Plus size={14} />
                    <span>Add Category</span>
                  </button>
                </div>
                <ul className="owner-categories">
                  {menuData.map((category, index) => (
                    <li key={category.name + index}>
                      <button
                        type="button"
                        className={newItemCategory === index ? "active" : ""}
                        onClick={() => setNewItemCategory(index)}
                      >
                        <span>{category.name}</span>
                        <small>{category.items.length}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="owner-panel">
                <h2>Coffee Items</h2>
                <div className="owner-inline-add">
                  <input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                  <button type="button" className="owner-primary" onClick={addItem}>
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="owner-items">
                  {menuData[newItemCategory]?.items?.map((item, index) => (
                    <div key={item.name + index} className="owner-item-row">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.description || "Rich and bold Italian coffee"}</p>
                        <div className="owner-item-actions">
                          <button type="button" className="owner-secondary">Edit</button>
                          <button type="button" className="owner-danger" onClick={() => removeItem(newItemCategory, index)}>
                            Delete
                          </button>
                          <label>
                            <input
                              type="checkbox"
                              checked={item.available !== false}
                              onChange={(e) => updateItemAvailability(newItemCategory, index, e.target.checked)}
                            />
                            <span>Available</span>
                          </label>
                        </div>
                      </div>
                      <div className="owner-item-price">${item.price}</div>
                    </div>
                  )) || <p className="small">No items yet for this category.</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "theme" && (
          <section>
            <h1 className="owner-title">Theme Selection</h1>
            <p className="owner-subtitle">Choose a theme for your public cafe website</p>

            <div className="owner-alert owner-theme-current">
              <strong>Current Theme</strong>
              <p>Modern - Clean and minimalist design with bold typography</p>
            </div>

            <div className="owner-theme-grid">
              {["Modern", "Cozy", "Elegant", "Vibrant"].map((theme, i) => (
                <div key={theme} className={`owner-panel owner-theme-card ${i === 0 ? "selected" : ""}`}>
                  <h2>{theme}</h2>
                  <p className="small">{theme} design preview</p>
                  <div className="owner-theme-preview">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="owner-theme-actions">
              <button type="button" className="owner-primary">Apply Theme</button>
              <button type="button" className="owner-secondary" onClick={() => navigate("/preview")}>Preview Website</button>
            </div>
          </section>
        )}

        {activeSection === "qr" && (
          <section>
            <h1 className="owner-title">Your Cafe QR Code</h1>
            <p className="owner-subtitle">Share it in your cafe so customers can scan and view your menu</p>

            <div className="owner-qr-grid">
              <div className="owner-panel">
                <div className="owner-qr-preview">
                  <div className="owner-qr-fake"></div>
                </div>
                <div className="owner-site-row center">
                  <div>
                    <strong>{name}</strong>
                    <p>{name.toLowerCase().split(" ").join("")}.cafesite.com</p>
                  </div>
                </div>

                <button type="button" className="owner-primary">
                  <Download size={14} />
                  <span>Download QR Code</span>
                </button>
                <button type="button" className="owner-secondary">
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
                <button type="button" className="owner-secondary">
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              </div>

              <div>
                <div className="owner-panel">
                  <h2>How to Use Your QR Code</h2>
                  <ol className="owner-steps">
                    <li>Download or Print: Download the QR code as an image or print it directly.</li>
                    <li>Place in Your Cafe: Display on tables, menus, or at the entrance.</li>
                    <li>Customers Scan: Customers scan to instantly view your menu and cafe info.</li>
                  </ol>
                </div>

                <div className="owner-panel">
                  <h2>QR Code Stats</h2>
                  <div className="owner-stats-list">
                    <div><span>Total Scans</span><strong>247</strong></div>
                    <div><span>This Week</span><strong>32</strong></div>
                    <div><span>Today</span><strong>8</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default OwnerDashboard;
