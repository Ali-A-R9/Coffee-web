import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/authApi";
import { getCafe } from "../api/cafeApi";
import { getMenu } from "../api/menuApi";
import type { Category } from "../types/menu";

function PublicPreview() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Initialize data lazily (no useEffect needed)

  const cafe = user ? getCafe(user) : null;
  const initialMenu = user ? getMenu(user) : [];

  const [cafeName] = useState(cafe?.name || "Cafe Name");
  const [description] = useState(cafe?.description || "");
  const [hours] = useState(cafe?.hours || "");
  const [menuData] = useState<Category[]>(initialMenu);

  return (
    <div className="container">
      <div className="card public-container">

        <div className="public-header">
          <h1>{cafeName}</h1>
          <p className="small">{description}</p>
          <p className="small">
            {hours ? `Working Hours: ${hours}` : ""}
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

        <button
          className="ghost"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}

export default PublicPreview;