import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../api/authApi";
import { getCafe, saveCafe } from "../api/cafeApi";
import { getMenu, saveMenu } from "../api/menuApi";

type MenuItem = {
  name: string;
  price: string;
};

type MenuCategory = {
  name: string;
  items: MenuItem[];
};

type CafeData = {
  name?: string;
  description?: string;
  hours?: string;
};

type ActiveSection = "profile" | "menu" | "preview" | "admin";

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [activeSection, setActiveSection] = useState<ActiveSection>("profile");

  const initialCafe = useMemo<CafeData | null>(() => {
    return user ? getCafe(user) : null;
  }, [user]);

  const initialMenu = useMemo<MenuCategory[]>(() => {
    return user ? getMenu(user) || [] : [];
  }, [user]);

  const [name, setName] = useState<string>(initialCafe?.name || "");
  const [description, setDescription] = useState<string>(initialCafe?.description || "");
  const [hours, setHours] = useState<string>(initialCafe?.hours || "");
  const [profileMessage, setProfileMessage] = useState<string>("");
  const [profileMessageType, setProfileMessageType] = useState<string>("");

  const [menuData, setMenuData] = useState<MenuCategory[]>(initialMenu);
  const [newCategory, setNewCategory] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [itemPrice, setItemPrice] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleSaveCafe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) return;

    if (!name.trim()) {
      setProfileMessage("Cafe name is required.");
      setProfileMessageType("error");
      return;
    }

    saveCafe(user, {
      name: name.trim(),
      description: description.trim(),
      hours: hours.trim(),
    });

    setProfileMessage("Cafe information saved successfully!");
    setProfileMessageType("success");
  }

  function updateMenu(newMenu: MenuCategory[]) {
    if (!user) return;
    setMenuData(newMenu);
    saveMenu(user, newMenu);
  }

  function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newCategory.trim()) return;

    updateMenu([...menuData, { name: newCategory.trim(), items: [] }]);
    setNewCategory("");
  }

  function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice.trim()) return;
    if (menuData.length === 0) return;

    const updated = [...menuData];
    updated[selectedCategory].items.push({
      name: itemName.trim(),
      price: itemPrice.trim(),
    });

    updateMenu(updated);
    setItemName("");
    setItemPrice("");
  }

  function deleteCategory(index: number) {
    if (!window.confirm("Delete this category?")) return;
    const updated = menuData.filter((_, i) => i !== index);
    updateMenu(updated);
  }

  function editCategory(index: number) {
    const newName = window.prompt("New category name:", menuData[index].name);
    if (!newName || !newName.trim()) return;

    const updated = [...menuData];
    updated[index].name = newName.trim();
    updateMenu(updated);
  }

  function deleteItem(catIndex: number, itemIndex: number) {
    const updated = [...menuData];
    updated[catIndex].items.splice(itemIndex, 1);
    updateMenu(updated);
  }

  function editItem(catIndex: number, itemIndex: number) {
    const item = menuData[catIndex].items[itemIndex];
    const newName = window.prompt("Edit item name:", item.name);
    const newPrice = window.prompt("Edit item price:", item.price);

    if (!newName || !newName.trim() || !newPrice || !newPrice.trim()) return;

    const updated = [...menuData];
    updated[catIndex].items[itemIndex] = {
      name: newName.trim(),
      price: newPrice.trim(),
    };

    updateMenu(updated);
  }

  const sectionCards: {
    key: ActiveSection;
    title: string;
    text: string;
    icon: string;
  }[] = [
    {
      key: "profile",
      title: "Cafe Profile",
      text: "Manage your cafe information, branding, and business details.",
      icon: "☕",
    },
    {
      key: "menu",
      title: "Menu Management",
      text: "Add, edit, and organize categories and menu items.",
      icon: "📋",
    },
    {
      key: "preview",
      title: "Public Website Preview",
      text: "Preview how your cafe website looks for visitors.",
      icon: "🌐",
    },
    {
      key: "admin",
      title: "Admin Panel",
      text: "Access admin tools and advanced management controls.",
      icon: "⚙️",
    },
  ];

  function renderSection() {
    if (activeSection === "profile") {
      return (
        <div className="dashboard-section-panel">
          <div className="panel-header">
            <h2>Cafe Profile</h2>
            <p>Manage your cafe information and public business details.</p>
          </div>

          <form className="dashboard-form-grid" onSubmit={handleSaveCafe}>
            <div className="field-block">
              <label>Cafe Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter cafe name"
              />
            </div>

            <div className="field-block">
              <label>Working Hours</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 8:00 AM - 11:00 PM"
              />
            </div>

            <div className="field-block field-full">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a short description about your cafe"
              />
            </div>

            <p className={`${profileMessageType} field-full`} aria-live="polite">
              {profileMessage}
            </p>

            <div className="field-full section-actions">
              <button type="submit">Save Changes</button>
            </div>
          </form>
        </div>
      );
    }

    if (activeSection === "menu") {
      return (
        <div className="dashboard-section-panel">
          <div className="panel-header">
            <h2>Menu Management</h2>
            <p>Create categories, add items, and manage pricing.</p>
          </div>

          <div className="dashboard-inner-grid">
            <form className="dashboard-mini-card" onSubmit={addCategory}>
              <h3>Add Category</h3>
              <label>New Category</label>
              <input
                placeholder="e.g. Hot Drinks"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button type="submit">Add Category</button>
            </form>

            <form className="dashboard-mini-card" onSubmit={addItem}>
              <h3>Add Item</h3>
              <label>Item Name</label>
              <input
                placeholder="e.g. Latte"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />

              <label>Price</label>
              <input
                type="number"
                placeholder="e.g. 18"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />

              <label>Select Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
              >
                {menuData.length === 0 ? (
                  <option disabled>No categories available</option>
                ) : (
                  menuData.map((cat, index) => (
                    <option key={index} value={index}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>

              <button type="submit">Add Item</button>
            </form>
          </div>

          <div className="menu-list-wrap">
            {menuData.length === 0 ? (
              <p className="small">No categories yet.</p>
            ) : (
              menuData.map((category, catIndex) => (
                <div key={catIndex} className="menu-category">
                  <div className="row-space">
                    <span className="category-title">{category.name}</span>
                    <div className="row-actions">
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => editCategory(catIndex)}
                      >
                        Edit
                      </button>
                      <button
                        className="ghost"
                        type="button"
                        onClick={() => deleteCategory(catIndex)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {category.items.length === 0 ? (
                    <p className="small">No items in this category.</p>
                  ) : (
                    category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="row-space menu-item">
                        <span>
                          {item.name} - {item.price} SAR
                        </span>

                        <div className="row-actions">
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => editItem(catIndex, itemIndex)}
                          >
                            Edit
                          </button>
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => deleteItem(catIndex, itemIndex)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeSection === "preview") {
      return (
        <div className="dashboard-section-panel">
          <div className="panel-header">
            <h2>Public Website Preview</h2>
            <p>Preview how your cafe appears to visitors.</p>
          </div>

          <div className="preview-panel">
            <div className="public-header">
              <h1>{name || "Cafe Name"}</h1>
              <p className="small">{description || "No description yet."}</p>
              <p className="small">
                {hours ? `Working Hours: ${hours}` : "Working hours not added yet."}
              </p>
            </div>

            {menuData.length === 0 ? (
              <p className="small">No menu available yet.</p>
            ) : (
              menuData.map((category, catIndex) => (
                <div key={catIndex} className="public-category">
                  <h3>{category.name}</h3>

                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="public-item">
                      <span>{item.name}</span>
                      <span>{item.price} SAR</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-section-panel">
        <div className="panel-header">
          <h2>Admin Panel</h2>
          <p>Advanced management and moderation tools.</p>
        </div>

        <div className="admin-placeholder">
          <p className="small">
            Admin will view, approve, deactivate, or delete cafes here.
          </p>

          <div className="section-actions">
            <button className="ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-heading">
            <h1>Dashboard</h1>
            <p>Welcome back, {user}</p>
          </div>

          <div className="topbar-actions">
            <div className="topbar-user" onClick={() => navigate("/Profile")}>
              <div className="user-avatar">
                {user?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="user-meta">
                <strong>My Profile</strong>
                <span>{user}</span>
              </div>
            </div>

            <button className="ghost topbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Sections</span>
            <strong>04</strong>
          </div>

          <div className="stat-card">
            <span>Menu Categories</span>
            <strong>{menuData.length}</strong>
          </div>

          <div className="stat-card">
            <span>Public Website</span>
            <strong>Live Preview</strong>
          </div>
        </section>

        <section className="dashboard-cards">
          {sectionCards.map((card) => (
            <button
              key={card.key}
              className={`dashboard-card dashboard-tab-card ${
                activeSection === card.key ? "active" : ""
              }`}
              onClick={() => setActiveSection(card.key)}
              type="button"
            >
              <div className="dashboard-card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <span className="dashboard-card-link">Open Section</span>
            </button>
          ))}
        </section>

        <section className="dashboard-section-area">{renderSection()}</section>
      </div>
    </div>
  );
}

export default Dashboard;