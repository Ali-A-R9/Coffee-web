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

// Helper function that obtains all cafes and their data, for admin users.
export function getAllCafes() {
  const allCafes = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith("cafe_")) {
      const cafeData = JSON.parse(localStorage.getItem(key) || "{}");
      
      allCafes.push({
        id: key,
        name: cafeData.name || "Unnamed Cafe",
        ownerEmail: key.replace("cafe_", ""),
        status: cafeData.status || "Pending", 
        createdDate: cafeData.createdDate || new Date().toLocaleDateString(),
        ...cafeData 
      });
    }
  }
  return allCafes;
}

export function saveCafeAdmin(id: string, updatedData: any) {

  const existing = JSON.parse(localStorage.getItem(id) || "{}");
  localStorage.setItem(id, JSON.stringify({ ...existing, ...updatedData }));
}
