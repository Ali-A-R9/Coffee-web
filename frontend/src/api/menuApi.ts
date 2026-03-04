import type { Category } from "../types/menu";

export function getMenu(user: string): Category[] {
  const stored = localStorage.getItem("menu_" + user);
  return stored ? JSON.parse(stored) : [];
}

export function saveMenu(user: string, menu: Category[]) {
  localStorage.setItem("menu_" + user, JSON.stringify(menu));
}