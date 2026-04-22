const BASE_URL = "http://localhost:5000/api/menu";

export async function getMenu() {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function saveMenu(menu: any) {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(menu),
  });

  return res.json();
}