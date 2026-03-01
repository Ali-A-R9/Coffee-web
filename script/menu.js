document.addEventListener("DOMContentLoaded", () => {

  const user = localStorage.getItem("auth_user");
  if (!user) {
    window.location.href = "Login.html";
    return;
  }

  const categoryForm = document.getElementById("categoryForm");
  const itemForm = document.getElementById("itemForm");
  const categoryInput = document.getElementById("categoryName");
  const itemNameInput = document.getElementById("itemName");
  const itemPriceInput = document.getElementById("itemPrice");
  const itemCategorySelect = document.getElementById("itemCategory");
  const menuDisplay = document.getElementById("menuDisplay");

  let menuData = JSON.parse(localStorage.getItem("menu_" + user)) || [];

  function saveMenu() {
    localStorage.setItem("menu_" + user, JSON.stringify(menuData));
  }

  function renderMenu() {
    menuDisplay.innerHTML = "";
    itemCategorySelect.innerHTML = "";

    if (menuData.length === 0) {
      menuDisplay.innerHTML = "<p class='small'>No categories yet.</p>";
    }

    menuData.forEach((category, categoryIndex) => {

      // Add category to dropdown
      const option = document.createElement("option");
      option.value = categoryIndex;
      option.textContent = category.name;
      itemCategorySelect.appendChild(option);

      const section = document.createElement("div");
      section.classList.add("menu-category");

      // ===== CATEGORY HEADER ROW =====
      const headerRow = document.createElement("div");
      headerRow.classList.add("row-space");

      headerRow.innerHTML = `
        <span class="category-title">${category.name}</span>
        <div class="row-actions">
          <button class="ghost" onclick="editCategory(${categoryIndex})">Edit</button>
          <button class="ghost" onclick="deleteCategory(${categoryIndex})">Delete</button>
        </div>
      `;

      section.appendChild(headerRow);

      // ===== ITEMS =====
      category.items.forEach((item, itemIndex) => {

        const itemRow = document.createElement("div");
        itemRow.classList.add("row-space", "menu-item");

        itemRow.innerHTML = `
          <span>${item.name} - ${item.price} SAR</span>
          <div class="row-actions">
            <button class="ghost" onclick="editItem(${categoryIndex}, ${itemIndex})">Edit</button>
            <button class="ghost" onclick="deleteItem(${categoryIndex}, ${itemIndex})">Delete</button>
          </div>
        `;

        section.appendChild(itemRow);
      });

      menuDisplay.appendChild(section);
    });
  }

  // ===== ADD CATEGORY =====
  categoryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = categoryInput.value.trim();
    if (!name) return;

    menuData.push({ name, items: [] });
    categoryInput.value = "";
    saveMenu();
    renderMenu();
  });

  // ===== ADD ITEM =====
  itemForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = itemNameInput.value.trim();
    const price = itemPriceInput.value.trim();
    const categoryIndex = itemCategorySelect.value;

    if (!name || !price) return;

    menuData[categoryIndex].items.push({ name, price });

    itemNameInput.value = "";
    itemPriceInput.value = "";

    saveMenu();
    renderMenu();
  });

  // ===== DELETE CATEGORY =====
  window.deleteCategory = function(index) {
    if (!confirm("Delete this category?")) return;
    menuData.splice(index, 1);
    saveMenu();
    renderMenu();
  };

  // ===== EDIT CATEGORY =====
  window.editCategory = function(index) {
    const newName = prompt("New category name:", menuData[index].name);
    if (!newName) return;

    menuData[index].name = newName.trim();
    saveMenu();
    renderMenu();
  };

  // ===== DELETE ITEM =====
  window.deleteItem = function(categoryIndex, itemIndex) {
    menuData[categoryIndex].items.splice(itemIndex, 1);
    saveMenu();
    renderMenu();
  };

  // ===== EDIT ITEM =====
  window.editItem = function(categoryIndex, itemIndex) {
    const item = menuData[categoryIndex].items[itemIndex];

    const newName = prompt("Edit item name:", item.name);
    if (!newName) return;

    const newPrice = prompt("Edit item price:", item.price);
    if (!newPrice) return;

    item.name = newName.trim();
    item.price = newPrice.trim();

    saveMenu();
    renderMenu();
  };

  renderMenu();
});