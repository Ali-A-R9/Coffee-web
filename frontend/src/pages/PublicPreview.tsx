import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCafe } from "../api/cafeApi";
import { getMenu } from "../api/menuApi";
import type { CafeData } from "../api/cafeApi";
import type { Category } from "../types/menu";

function formatHours(hours: CafeData["hours"]) {
  if (!hours) return "";
  if (typeof hours === "string") return hours;
  if (!hours.open || !hours.close) return "";
  return `${hours.open} - ${hours.close}`;
}

function PublicPreview() {
  const navigate = useNavigate();

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [menuData, setMenuData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cafeData, menu] = await Promise.all([getMyCafe(), getMenu()]);
        setCafe(cafeData);
        setMenuData(Array.isArray(menu) ? menu : []);
      } catch {
        setCafe(null);
        setMenuData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!cafe) {
    return (
      <div className="container">
        <div className="card">
          <h2>No cafe found</h2>
          <button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card public-container">
        <div className="public-header">
          <h1>{cafe.name}</h1>
          <p className="small">{cafe.description}</p>
          <p className="small">
            {formatHours(cafe.hours) ? `Working Hours: ${formatHours(cafe.hours)}` : ""}
          </p>
        </div>

        <hr style={{ margin: "20px 0" }} />

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

        <hr style={{ margin: "20px 0" }} />

        <button className="ghost" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default PublicPreview;
