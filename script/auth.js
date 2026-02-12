document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // create message for the wrong input in login and register
  const setMsg = (id, msg, type = "error") => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("error", "success");
    el.classList.add(type);
  };

  // here is the login page part
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      setMsg("loginMsg", "");

      if (!email || !password) return setMsg("loginMsg", "Please enter email and password.");
      if (!isValidEmail(email)) return setMsg("loginMsg", "Invalid email.");
      if (password.length < 8) return setMsg("loginMsg", "Password must be at least 8 characters.");

      localStorage.setItem("auth_user", email);

      window.location.href = "Dashboard.html";
    });
  }

    // here is registration part
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("registerName").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;

      setMsg("registerMsg", "");

      if (!name || !email || !password) return setMsg("registerMsg", "Please complete all fields.");
      if (!isValidEmail(email)) return setMsg("registerMsg", "Invalid email.");
      if (password.length < 8) return setMsg("registerMsg", "Password must be at least 8 characters.");

      localStorage.setItem("auth_user", email);
      window.location.href = "Dashboard.html";
    });
  }
    // if the registration and login success then move users to dashboard
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    const user = localStorage.getItem("auth_user");
    if (!user) {
      window.location.href = "Login.html";
      return;
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("auth_user");
        window.location.href = "Login.html";
      });
    }
  }
});
