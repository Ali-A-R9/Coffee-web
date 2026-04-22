import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMenu, saveMenu } from "../api/menuApi";
import type { Category } from "../types/menu";

function Menu() {
  const navigate = useNavigate();

  const [menuData, setMenuData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await getMenu();
        setMenuData(Array.isArray(data) ? data : []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load menu");
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  async function persistMenu(updated: Category[]) {
    try {
      setMenuData(updated);
      await saveMenu(updated);
      setMessage("Menu saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save menu");
    }
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;

    persistMenu([...menuData, { name: newCategory.trim(), items: [] }]);
    setNewCategory("");
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice.trim() || menuData.length === 0) return;

    const updated = [...menuData];
    updated[selectedCategory].items.push({
      name: itemName.trim(),
      price: itemPrice.trim(),
    });

    persistMenu(updated);
    setItemName("");
    setItemPrice("");
  }

  function deleteCategory(index: number) {
    const updated = menuData.filter((_, i) => i !== index);
    persistMenu(updated);
  }

  function deleteItem(catIndex: number, itemIndex: number) {
    const updated = [...menuData];
    updated[catIndex].items.splice(itemIndex, 1);
    persistMenu(updated);
  }

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading menu...</p>;
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Menu Management</h1>

        <form className="form-inline" onSubmit={addCategory}>
          <label>New Category</label>
          <input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button type="submit">Add Category</button>
        </form>

        <hr style={{ margin: "20px 0" }} />

        <form className="form-inline" onSubmit={addItem}>
          <label>Item Name</label>
          <input
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <label>Price</label>
          <input
            type="number"
            placeholder="Price"
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

        <hr style={{ margin: "20px 0" }} />

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

        <p className={message ? "success" : "small"}>{message || " "}</p>

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

export default Menu;
