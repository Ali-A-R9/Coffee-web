document.addEventListener("DOMContentLoaded", () => {

  const user = localStorage.getItem("auth_user");
  if (!user) {
    window.location.href = "Login.html";
    return;
  }

  const cafeTitle = document.getElementById("cafeTitle");
  const cafeDescription = document.getElementById("cafeDescription");
  const cafeHours = document.getElementById("cafeHours");
  const publicMenu = document.getElementById("publicMenu");

  // ==========================
  // LOAD CAFE PROFILE
  // ==========================
  const cafeData = JSON.parse(localStorage.getItem("cafe_" + user));

  if (cafeData) {
    cafeTitle.textContent = cafeData.name || "My Cafe";
    cafeDescription.textContent = cafeData.description || "";
    cafeHours.textContent = cafeData.hours
      ? "Working Hours: " + cafeData.hours
      : "";
  }

  // ==========================
  // LOAD MENU
  // ==========================
  const menuData = JSON.parse(localStorage.getItem("menu_" + user)) || [];

  if (menuData.length === 0) {
    publicMenu.innerHTML = "<p class='small'>No menu available yet.</p>";
    return;
  }

  menuData.forEach(category => {

    const section = document.createElement("div");
    section.classList.add("public-category");

    const title = document.createElement("h3");
    title.textContent = category.name;

    section.appendChild(title);

    category.items.forEach(item => {

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("public-item");

      itemDiv.innerHTML = `
        <span>${item.name}</span>
        <span>${item.price} SAR</span>
      `;

      section.appendChild(itemDiv);
    });

    publicMenu.appendChild(section);
  });

});