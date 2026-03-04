import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/authApi";
import { getMenu, saveMenu } from "../api/menuApi";
import type { Category } from "../types/menu";

function Menu() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const initialMenu = user ? getMenu(user) : [];

  const [menuData, setMenuData] = useState<Category[]>(initialMenu);
  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  function updateMenu(newMenu: Category[]) {
    if (!user) return;
    setMenuData(newMenu);
    saveMenu(user, newMenu);
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;

    updateMenu([...menuData, { name: newCategory, items: [] }]);
    setNewCategory("");
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName || !itemPrice) return;
    if (menuData.length === 0) return;

    const updated = [...menuData];
    updated[selectedCategory].items.push({
      name: itemName,
      price: itemPrice,
    });

    updateMenu(updated);
    setItemName("");
    setItemPrice("");
  }

  function deleteCategory(index: number) {
    if (!confirm("Delete this category?")) return;
    const updated = menuData.filter((_, i) => i !== index);
    updateMenu(updated);
  }

  function editCategory(index: number) {
    const newName = prompt("New category name:", menuData[index].name);
    if (!newName) return;

    const updated = [...menuData];
    updated[index].name = newName;
    updateMenu(updated);
  }

  function deleteItem(catIndex: number, itemIndex: number) {
    const updated = [...menuData];
    updated[catIndex].items.splice(itemIndex, 1);
    updateMenu(updated);
  }

  function editItem(catIndex: number, itemIndex: number) {
    const item = menuData[catIndex].items[itemIndex];
    const newName = prompt("Edit item name:", item.name);
    const newPrice = prompt("Edit item price:", item.price);
    if (!newName || !newPrice) return;

    const updated = [...menuData];
    updated[catIndex].items[itemIndex] = {
      name: newName,
      price: newPrice,
    };

    updateMenu(updated);
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Menu Management</h1>

        {/* Add Category */}
        <form className="form-inline" onSubmit={addCategory}>
          <label>New Category</label>
          <input
            placeholder="e.g. Hot Drinks"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button type="submit">Add Category</button>
        </form>

        <hr style={{ margin: "20px 0" }} />

        {/* Add Item */}
        <form className="form-inline" onSubmit={addItem}>
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

        <hr style={{ margin: "20px 0" }} />

        {/* Render Menu */}
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
                    onClick={() => editCategory(catIndex)}
                  >
                    Edit
                  </button>
                  <button
                    className="ghost"
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
                  <div
                    key={itemIndex}
                    className="row-space menu-item"
                  >
                    <span>
                      {item.name} - {item.price} SAR
                    </span>
                    <div className="row-actions">
                      <button
                        className="ghost"
                        onClick={() =>
                          editItem(catIndex, itemIndex)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="ghost"
                        onClick={() =>
                          deleteItem(catIndex, itemIndex)
                        }
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

export default Menu;