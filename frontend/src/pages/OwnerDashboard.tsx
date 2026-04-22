import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  QrCode,
  User,
} from "lucide-react";

import { logout } from "../api/authApi";
import {
  createCafe,
  getMyCafe,
  updateCafe,
  type CafeData,
} from "../api/cafeApi";
import { getMenu, saveMenu } from "../api/menuApi";
import type { Category } from "../types/menu";

type OwnerSection = "dashboard" | "profile" | "menu" | "theme" | "qr";

type WorkingHours = {
  open: string;
  close: string;
};

const EMPTY_HOURS: WorkingHours = {
  open: "",
  close: "",
};

function getHoursFromCafe(hours: CafeData["hours"]): WorkingHours {
  if (!hours || typeof hours === "string") {
    return EMPTY_HOURS;
  }

  return {
    open: hours.open || "",
    close: hours.close || "",
  };
}

function formatTimestamp(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

function buildPublicUrl(cafe: CafeData | null, name: string) {
  const slug =
    cafe?.slug ||
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  return slug ? `/cafe/${slug}` : "Unavailable";
}

function OwnerDashboard() {
  const navigate = useNavigate();

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [activeSection, setActiveSection] = useState<OwnerSection>("dashboard");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [hours, setHours] = useState<WorkingHours>(EMPTY_HOURS);
  const [profileMessage, setProfileMessage] = useState("");
  const [menuMessage, setMenuMessage] = useState("");

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(0);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingItem, setEditingItem] = useState<{
    categoryIndex: number;
    itemIndex: number;
  } | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [editingItemPrice, setEditingItemPrice] = useState("");

  const status = cafe?.status || "Pending";
  const menuItemsCount = menuData.reduce((total, category) => total + category.items.length, 0);
  const publicUrl = useMemo(() => buildPublicUrl(cafe, name), [cafe, name]);

  function syncCafeState(data: CafeData | null) {
    setCafe(data);

    if (!data) {
      setName("");
      setDescription("");
      setTheme("");
      setLogoUrl("");
      setHours(EMPTY_HOURS);
      return;
    }

    setName(data.name || "");
    setDescription(data.description || "");
    setTheme(data.theme || "");
    setLogoUrl(data.logoUrl || "");
    setHours(getHoursFromCafe(data.hours));
  }

  async function loadCafeData() {
    try {
      setLoadError("");
      const data = await getMyCafe();
      syncCafeState(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load cafe");
      syncCafeState(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMenuData() {
    try {
      const data = await getMenu();
      setMenuData(Array.isArray(data) ? data : []);
    } catch {
      setMenuData([]);
    }
  }

  useEffect(() => {
    loadCafeData();
    loadMenuData();
  }, []);

  useEffect(() => {
    if (newItemCategory >= menuData.length && menuData.length > 0) {
      setNewItemCategory(0);
    }
  }, [menuData, newItemCategory]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleCreateCafe() {
    const trimmedName = createName.trim();

    if (!trimmedName) {
      setCreateMessage("Cafe name is required.");
      return;
    }

    try {
      const res = await createCafe({
        name: trimmedName,
        description: createDescription.trim(),
      });

      syncCafeState(res.cafe);
      setCreateMessage("Cafe created successfully.");
    } catch (error) {
      setCreateMessage(
        error instanceof Error ? error.message : "Failed to create cafe"
      );
    }
  }

  async function saveProfile() {
    try {
      const res = await updateCafe({
        name: name.trim(),
        description: description.trim(),
        theme: theme.trim(),
        logoUrl: logoUrl.trim(),
        hours: {
          open: hours.open.trim(),
          close: hours.close.trim(),
        },
      });

      syncCafeState(res.cafe);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  }

  async function persistMenu(updated: Category[]) {
    try {
      await saveMenu(updated);
      setMenuData(updated);
      setMenuMessage("Menu saved successfully.");
    } catch (error) {
      setMenuMessage(error instanceof Error ? error.message : "Failed to save menu");

      try {
        const freshData = await getMenu();
        setMenuData(Array.isArray(freshData) ? freshData : []);
      } catch {
        // ignore refresh failure
      }
    }
  }

  function addCategory() {
    const trimmedCategory = newCategory.trim();

    if (!trimmedCategory) {
      setMenuMessage("Category name is required.");
      return;
    }

    const exists = menuData.some(
      (category) => category.name.toLowerCase() === trimmedCategory.toLowerCase()
    );

    if (exists) {
      setMenuMessage(`Duplicate category name: "${trimmedCategory}".`);
      return;
    }

    const updated: Category[] = [
      ...menuData,
      { name: trimmedCategory, items: [] },
    ];

    setMenuMessage("");
    persistMenu(updated);
    setNewCategory("");
  }

  function addItem() {
    const trimmedName = newItemName.trim();
    const trimmedPrice = newItemPrice.trim();

    if (!trimmedName) {
      setMenuMessage("Item name is required.");
      return;
    }

    if (!trimmedPrice) {
      setMenuMessage("Item price is required.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      setMenuMessage("Price must be a valid number like 10 or 10.50.");
      return;
    }

    if (menuData.length === 0) {
      setMenuMessage("Please add a category first.");
      return;
    }

    const category = menuData[newItemCategory];
    if (!category) {
      setMenuMessage("Please select a valid category.");
      return;
    }

    const duplicateItem = category.items.some(
      (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateItem) {
      setMenuMessage(
        `Duplicate item name "${trimmedName}" in category "${category.name}".`
      );
      return;
    }

    const updated: Category[] = menuData.map((cat, index) => {
      if (index !== newItemCategory) return cat;

      return {
        ...cat,
        items: [...cat.items, { name: trimmedName, price: trimmedPrice }],
      };
    });

    setMenuMessage("");
    persistMenu(updated);
    setNewItemName("");
    setNewItemPrice("");
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    const updated: Category[] = menuData.map((category, index) => {
      if (index !== categoryIndex) return category;

      return {
        ...category,
        items: category.items.filter((_, i) => i !== itemIndex),
      };
    });

    setMenuMessage("");
    persistMenu(updated);
  }

  function removeCategory(categoryIndex: number) {
    const updated: Category[] = menuData.filter((_, index) => index !== categoryIndex);

    setMenuMessage("");
    persistMenu(updated);

    if (newItemCategory >= updated.length) {
      setNewItemCategory(Math.max(0, updated.length - 1));
    }

    if (editingCategoryIndex === categoryIndex) {
      cancelEditCategory();
    }
  }

  function startEditCategory(categoryIndex: number) {
    setEditingCategoryIndex(categoryIndex);
    setEditingCategoryName(menuData[categoryIndex].name);
  }

  function cancelEditCategory() {
    setEditingCategoryIndex(null);
    setEditingCategoryName("");
  }

  function saveEditedCategory() {
    if (editingCategoryIndex === null) return;

    const trimmedName = editingCategoryName.trim();

    if (!trimmedName) {
      setMenuMessage("Category name is required.");
      return;
    }

    const exists = menuData.some(
      (category, index) =>
        index !== editingCategoryIndex &&
        category.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      setMenuMessage(`Duplicate category name: "${trimmedName}".`);
      return;
    }

    const updated: Category[] = menuData.map((category, index) => {
      if (index !== editingCategoryIndex) return category;

      return {
        ...category,
        name: trimmedName,
      };
    });

    setMenuMessage("");
    persistMenu(updated);
    cancelEditCategory();
  }

  function startEditItem(categoryIndex: number, itemIndex: number) {
    const item = menuData[categoryIndex].items[itemIndex];
    setEditingItem({ categoryIndex, itemIndex });
    setEditingItemName(item.name);
    setEditingItemPrice(item.price);
  }

  function cancelEditItem() {
    setEditingItem(null);
    setEditingItemName("");
    setEditingItemPrice("");
  }

  function saveEditedItem() {
    if (!editingItem) return;

    const trimmedName = editingItemName.trim();
    const trimmedPrice = editingItemPrice.trim();

    if (!trimmedName) {
      setMenuMessage("Item name is required.");
      return;
    }

    if (!trimmedPrice) {
      setMenuMessage("Item price is required.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      setMenuMessage("Price must be a valid number like 10 or 10.50.");
      return;
    }

    const category = menuData[editingItem.categoryIndex];
    if (!category) return;

    const exists = category.items.some(
      (item, index) =>
        index !== editingItem.itemIndex &&
        item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      setMenuMessage(
        `Duplicate item name "${trimmedName}" in category "${category.name}".`
      );
      return;
    }

    const updated: Category[] = menuData.map((cat, catIndex) => {
      if (catIndex !== editingItem.categoryIndex) return cat;

      return {
        ...cat,
        items: cat.items.map((item, itemIndex) => {
          if (itemIndex !== editingItem.itemIndex) return item;

          return {
            ...item,
            name: trimmedName,
            price: trimmedPrice,
          };
        }),
      };
    });

    setMenuMessage("");
    persistMenu(updated);
    cancelEditItem();
  }

  const navItems: Array<{ key: OwnerSection; label: string; icon: ReactNode }> = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { key: "profile", label: "Cafe Profile", icon: <User size={18} /> },
    { key: "menu", label: "Menu Management", icon: <Menu size={18} /> },
    { key: "theme", label: "Theme Selection", icon: <Palette size={18} /> },
    { key: "qr", label: "QR Code", icon: <QrCode size={18} /> },
  ];

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading owner dashboard...</h2>;
  }

  if (!cafe) {
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
          </div>

          <div className="owner-sidebar-footer">
            <button type="button" className="owner-logout" onClick={handleLogout}>
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="owner-main">
          <section>
            <h1 className="owner-title">Create Your Cafe</h1>
            <p className="owner-subtitle">
              Start with real data that will be saved in the `cafes` collection.
            </p>

            <div className="owner-panel">
              <h2>New Cafe</h2>
              <div className="owner-form-grid">
                <div>
                  <label htmlFor="create-cafe-name">Cafe Name</label>
                  <input
                    id="create-cafe-name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter your cafe name"
                  />
                </div>

                <div className="full">
                  <label htmlFor="create-cafe-description">Description</label>
                  <textarea
                    id="create-cafe-description"
                    rows={4}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Describe your cafe"
                  />
                </div>
              </div>

              <button type="button" className="owner-primary" onClick={handleCreateCafe}>
                Create Cafe
              </button>

              <p className={createMessage ? "success" : "small"}>
                {createMessage || loadError || " "}
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

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
            <strong>{name || "Unnamed cafe"}</strong>
            <span>{status}</span>
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
            <h1 className="owner-title">{name}</h1>
            <p className="owner-subtitle">Your dashboard is now driven by live database data.</p>

            <div className="owner-status-row">
              <span className={`owner-pill ${status === "Active" ? "owner-pill-live" : "owner-pill-pending"}`}>
                {status}
              </span>
              <span className="owner-pill owner-pill-live">
                Theme: {theme || "Not set"}
              </span>
            </div>

            {status === "Pending" && (
              <div className="owner-alert">
                <strong>Account Pending Approval</strong>
                <p>Your cafe is currently under review by the admin. Approval will update this same cafe document.</p>
              </div>
            )}

            <div className="owner-stats">
              <div className="owner-stat-card">
                <List size={20} />
                <strong>{menuData.length}</strong>
                <span>Categories</span>
              </div>
              <div className="owner-stat-card">
                <Menu size={20} />
                <strong>{menuItemsCount}</strong>
                <span>Menu Items</span>
              </div>
              <div className="owner-stat-card">
                <Eye size={20} />
                <strong>{formatTimestamp(cafe.updatedAt)}</strong>
                <span>Last Updated</span>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Cafe Summary</h2>
              <p className="owner-subtitle">
                <strong>Slug:</strong> {cafe.slug || "Not available"}
              </p>
              <p className="owner-subtitle">
                <strong>Description:</strong> {description || "No description yet."}
              </p>
              <p className="owner-subtitle">
                <strong>Hours:</strong>{" "}
                {hours.open && hours.close ? `${hours.open} - ${hours.close}` : "Not set"}
              </p>
            </div>

            <div className="owner-panel">
              <h2>Your Public Website</h2>
              <div className="owner-site-row">
                <div>
                  <strong>{name}</strong>
                  <p>{publicUrl}</p>
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
            <p className="owner-subtitle">Update the real cafe document stored in MongoDB.</p>

            <div className="owner-panel">
              <h2>Basic Information</h2>
              <div className="owner-form-grid">
                <div>
                  <label htmlFor="owner-cafe-name">Cafe Name</label>
                  <input
                    id="owner-cafe-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="owner-theme">Theme</label>
                  <input
                    id="owner-theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="light"
                  />
                </div>

                <div className="full">
                  <label htmlFor="owner-description">Description</label>
                  <textarea
                    id="owner-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="full">
                  <label htmlFor="owner-logo-url">Logo URL</label>
                  <input
                    id="owner-logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label htmlFor="owner-hours-open">Opening Time</label>
                  <input
                    id="owner-hours-open"
                    value={hours.open}
                    onChange={(e) =>
                      setHours((prev) => ({ ...prev, open: e.target.value }))
                    }
                    placeholder="08:00"
                  />
                </div>

                <div>
                  <label htmlFor="owner-hours-close">Closing Time</label>
                  <input
                    id="owner-hours-close"
                    value={hours.close}
                    onChange={(e) =>
                      setHours((prev) => ({ ...prev, close: e.target.value }))
                    }
                    placeholder="18:00"
                  />
                </div>
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
            <p className="owner-subtitle">Add categories and items backed by `menusections` and `menuitems`.</p>

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

                {editingCategoryIndex !== null && (
                  <div className="owner-panel" style={{ marginTop: "16px", padding: "16px" }}>
                    <h2>Edit Category</h2>
                    <input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      placeholder="Category name"
                    />
                    <div className="owner-item-actions" style={{ marginTop: "12px" }}>
                      <button
                        type="button"
                        className="owner-primary"
                        onClick={saveEditedCategory}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="owner-secondary"
                        onClick={cancelEditCategory}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <ul className="owner-categories">
                  {menuData.length === 0 && <p className="small">No categories yet.</p>}
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
                <h2>Menu Items</h2>
                {menuData[newItemCategory] && (
                  <div className="owner-item-actions" style={{ marginBottom: "16px" }}>
                    <button
                      type="button"
                      className="owner-secondary"
                      onClick={() => startEditCategory(newItemCategory)}
                    >
                      Edit Category
                    </button>
                    <button
                      type="button"
                      className="owner-danger"
                      onClick={() => removeCategory(newItemCategory)}
                    >
                      Delete Category
                    </button>
                  </div>
                )}

                <div className="owner-inline-add">
                  <input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <input
                    placeholder="Price"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                  <button type="button" className="owner-primary" onClick={addItem}>
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="owner-items">
                  {menuData[newItemCategory]?.items?.length ? (
                    menuData[newItemCategory].items.map((item, index) => (
                      <div key={item.name + index} className="owner-item-row">
                        {editingItem?.categoryIndex === newItemCategory &&
                        editingItem.itemIndex === index ? (
                          <>
                            <div style={{ flex: 1 }}>
                              <input
                                value={editingItemName}
                                onChange={(e) => setEditingItemName(e.target.value)}
                                placeholder="Item name"
                              />
                              <input
                                value={editingItemPrice}
                                onChange={(e) => setEditingItemPrice(e.target.value)}
                                placeholder="Price"
                              />
                            </div>

                            <div className="owner-item-actions">
                              <button
                                type="button"
                                className="owner-primary"
                                onClick={saveEditedItem}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="owner-secondary"
                                onClick={cancelEditItem}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <strong>{item.name}</strong>
                              <p>{item.description || "Saved in your menu database."}</p>
                            </div>

                            <div className="owner-item-actions">
                              <div className="owner-item-price">${item.price}</div>
                              <button
                                type="button"
                                className="owner-secondary"
                                onClick={() => startEditItem(newItemCategory, index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="owner-danger"
                                onClick={() => removeItem(newItemCategory, index)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="small">No items yet for this category.</p>
                  )}
                </div>
              </div>
            </div>

            <p
  className={
    menuMessage === "Menu saved successfully."
      ? "success"
      : menuMessage
      ? "error"
      : "small"
  }
>
  {menuMessage || " "}
</p>
          </section>
        )}

        {activeSection === "theme" && (
          <section>
            <h1 className="owner-title">Theme Selection</h1>
            <p className="owner-subtitle">The selected theme value is saved in the cafe document.</p>

            <div className="owner-panel">
              <h2>Current Theme</h2>
              <p className="owner-subtitle">{theme || "No theme selected yet."}</p>

              <label htmlFor="theme-input">Theme</label>
              <input
                id="theme-input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="light"
              />

              <button type="button" className="owner-primary" onClick={saveProfile}>
                Save Theme
              </button>
            </div>
          </section>
        )}

        {activeSection === "qr" && (
          <section>
            <h1 className="owner-title">Cafe Public Link</h1>
            <p className="owner-subtitle">This section uses your real cafe slug instead of mock QR stats.</p>

            <div className="owner-panel">
              <h2>Public URL</h2>
              <p className="owner-subtitle">{publicUrl}</p>
              <p className="small">
                Once your public client view is finalized, this URL can be used to generate a QR code.
              </p>

              <button type="button" className="owner-secondary" onClick={() => navigate("/preview")}>
                Preview Public Page
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default OwnerDashboard;
