import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Moon, Sun } from "lucide-react";
import { getMyCafe } from "../api/cafeApi";
import { getMenu } from "../api/menuApi";
import CafeMenuVisualization from "../components/CafeMenuVisualization";
import { useUiTheme } from "../hooks/useUiTheme";
import type { CafeData } from "../api/cafeApi";
import type { Category } from "../types/menu";

function getClientVisibleMenu(menu: Category[]) {
  return menu
    .filter((category) => category.visible !== false)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.visible !== false),
    }));
}

function PublicPreview() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useUiTheme("customer-menu-theme");

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [cafeData, menu] = await Promise.all([getMyCafe(), getMenu()]);
        const safeMenu = Array.isArray(menu) ? menu : [];

        setCafe(cafeData);
        setMenuData(getClientVisibleMenu(safeMenu));
        setActiveCategory("all");
        setMessage("");
      } catch (error) {
        setCafe(null);
        setMenuData([]);
        setMessage(error instanceof Error ? error.message : "Failed to load preview");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`cx-app owner-client-preview ${isDark ? "cx-dark" : ""}`}>
        <main className="cx-content">
          <section className="cx-panel">
            <p>Loading customer preview...</p>
          </section>
        </main>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className={`cx-app owner-client-preview ${isDark ? "cx-dark" : ""}`}>
        <main className="cx-content">
          <section className="cx-panel">
            <h2>No cafe found</h2>
            <p className="small">{message || "Create your cafe first, then preview it here."}</p>
            <button className="cx-back" type="button" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={14} />
              Back to Dashboard
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`cx-app owner-client-preview ${isDark ? "cx-dark" : ""}`}>
      <header className="cx-topbar">
        <div>
          <p className="cx-topbar-sub">Owner Preview</p>
          <h1>Customer View</h1>
        </div>

        <div className="cx-topbar-actions">
          <button
            className="cx-notify cx-theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button className="cx-notify" type="button" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} />
          </button>
        </div>
      </header>

      <main className="cx-content">
        <section className="cx-hero owner-preview-hero">
          <div>
            <p>This is how customers will browse your cafe menu.</p>
            <h2>{cafe.name}</h2>
          </div>
          <span className="owner-preview-chip">
            <Eye size={14} />
            Preview only
          </span>
        </section>

        <CafeMenuVisualization
          cafe={cafe}
          menu={menuData}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          context="owner-preview"
          emptyAction={
            <button type="button" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          }
        />

        <section className="cx-panel owner-preview-note">
          <p>
            Customers will see this menu after your cafe is approved and marked Active by the admin.
            This preview always uses your latest saved cafe profile and menu.
          </p>
          <button className="cx-back" type="button" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        </section>
      </main>
    </div>
  );
}

export default PublicPreview;
