// frontend/src/api/cafeApi.ts

export type CafeData = {
  name: string;
  description: string;
  hours: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string | null;
  workingHours?: Record<string, { open: string; close: string }>;
};

export function getCafe(user: string): CafeData | null {
  const stored = localStorage.getItem("cafe_" + user);
  return stored ? JSON.parse(stored) : null;
}

export function saveCafe(user: string, data: CafeData) {
  localStorage.setItem("cafe_" + user, JSON.stringify(data));
}