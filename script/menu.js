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

  // ===== SAVE TO STORAGE =====
  function saveMenu() {
    localStorage.setItem("menu_" + user, JSON.stringify(menuData));
  }

  // ===== RENDER MENU =====
  function renderMenu() {
    menuDisplay.innerHTML = "";
    itemCategorySelect.innerHTML = "";

    menuData.forEach((category, index) => {

      // Add category to select
      const option = document.createElement("option");
      option.value = index;
      option.textContent = category.name;
      itemCategorySelect.appendChild(option);

      // Create category section
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("h3");
      title.textContent = category.name;

      section.appendChild(title);

      category.items.forEach((item, itemIndex) => {
        const itemDiv = document.createElement("div");
        itemDiv.style.display = "flex";
        itemDiv.style.justifyContent = "space-between";
        itemDiv.style.marginBottom = "6px";

        itemDiv.innerHTML = `
          <span>${item.name} - ${item.price} SAR</span>
          <button class="ghost" onclick="deleteItem(${index}, ${itemIndex})">Delete</button>
        `;

        section.appendChild(itemDiv);
      });

      menuDisplay.appendChild(section);
    });
  }

  // ===== ADD CATEGORY =====
  categoryForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = categoryInput.value.trim();
    if (!name) return;

    menuData.push({
      name: name,
      items: []
    });

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

    menuData[categoryIndex].items.push({
      name,
      price
    });

    itemNameInput.value = "";
    itemPriceInput.value = "";

    saveMenu();
    renderMenu();
  });

  // ===== DELETE ITEM (GLOBAL FUNCTION) =====
  window.deleteItem = function(categoryIndex, itemIndex) {
    menuData[categoryIndex].items.splice(itemIndex, 1);
    saveMenu();
    renderMenu();
  };

  renderMenu();
});