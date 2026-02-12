document.addEventListener("DOMContentLoaded", () => {
  const cafeForm = document.getElementById("cafeForm");
  if (!cafeForm) return;

  const nameInput = document.getElementById("cafeName");
  const descInput = document.getElementById("cafeDescription");
  const hoursInput = document.getElementById("cafeHours");
  const msg = document.getElementById("cafeMsg");

  const user = localStorage.getItem("auth_user");
  if (!user) {
    window.location.href = "Login.html";
    return;
  }

  <div class="form-inline">
  <button type="button" onclick="location.href='CafeProfile.html'">Cafe Profile</button>
  <button type="button" onclick="location.href='Menu.html'">Menu Management</button>
  <button type="button" onclick="location.href='PublicPreview.html'">Public Website Preview</button>
  <button type="button" onclick="location.href='Admin.html'">Admin Panel</button>
</div>  

  // Load existing cafe data
  const storedCafe = JSON.parse(localStorage.getItem("cafe_" + user));
  if (storedCafe) {
    nameInput.value = storedCafe.name || "";
    descInput.value = storedCafe.description || "";
    hoursInput.value = storedCafe.hours || "";
  }

  cafeForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const cafeData = {
      name: nameInput.value.trim(),
      description: descInput.value.trim(),
      hours: hoursInput.value.trim(),
    };

    if (!cafeData.name) {
      msg.textContent = "Cafe name is required.";
      msg.className = "error";
      return;
    }

    localStorage.setItem("cafe_" + user, JSON.stringify(cafeData));

    msg.textContent = "Cafe information saved successfully!";
    msg.className = "success";
  });
});
