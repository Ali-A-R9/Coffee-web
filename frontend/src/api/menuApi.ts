import type { Category } from "../types/menu";

const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = `${BASE_API_URL}/api/menu`;

export async function getMenu() {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load menu");
  }

  return data;
}

export async function saveMenu(menu: Category[]) {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(menu),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to save menu");
  }

  return data;
}
