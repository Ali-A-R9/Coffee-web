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
  status?: string;
  zipCode?: string;
  logo?: string | null;
  workingHours?: Record<string, { open: string; close: string }>;
};

export function getCafe(user: string): CafeData | null {
  const stored = localStorage.getItem("cafe_" + user);
  return stored ? JSON.parse(stored) : null;
}

export function saveCafe(user: string, data: CafeData) {
  // Temporarily save the existing data
  const existing = getCafe(user) || ({} as CafeData);

  // Merge the old data with the new data being saved
  localStorage.setItem("cafe_" + user, JSON.stringify({ ...existing, ...data }));
}

// Helper function that obtains all cafes and their data, for admin users.
export function getAllCafes() {
  const allCafes = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith("cafe_")) {
      const cafeData = JSON.parse(localStorage.getItem(key) || "{}");
      
      allCafes.push({
	...cafeData,
        id: key,
        name: cafeData.name || "Unnamed Cafe",
        ownerEmail: key.replace("cafe_", ""),
        status: cafeData.status || "Pending", 
        createdDate: cafeData.createdDate || new Date().toLocaleDateString(),
      });
    }
  }
  return allCafes;
}

export function saveCafeAdmin(id: string, updatedData: any) {

  const existing = JSON.parse(localStorage.getItem(id) || "{}");
  localStorage.setItem(id, JSON.stringify({ ...existing, ...updatedData }));
}

export function seedDatabase() {
  // Make sure that the database is actually empty first.
  if (getAllCafes().length > 0) return;

  // Original mock data
  const initialCafes = [
    { id: "brew-bean", name: "Brew & Bean", ownerName: "John Smith", ownerEmail: "owner@owner.com", phone: "+1 (555) 123-4567", createdDate: "Jan 15, 2025", status: "Pending", address: "123 Main Street", city: "Seattle", state: "WA", zipCode: "98101", description: "A cozy neighborhood cafe.", websiteUrl: "https://brewbean.cafesite.com", plan: "Free Trial" },
    { id: "daily-grind", name: "The Daily Grind", ownerName: "Jane Doe", ownerEmail: "contact@dailygrind.com", phone: "+1 (555) 890-1122", createdDate: "Jan 10, 2025", status: "Active", address: "212 Pine St", city: "Seattle", state: "WA", zipCode: "98122", description: "Fast and friendly morning coffee.", websiteUrl: "https://dailygrind.cafesite.com", plan: "Pro" },
    { id: "espresso-express", name: "Espresso Express", ownerName: "Mike Johnson", ownerEmail: "hello@espressoexpress.com", phone: "+1 (555) 334-7788", createdDate: "Jan 8, 2025", status: "Active", address: "98 Lake Ave", city: "Seattle", state: "WA", zipCode: "98109", description: "Quick-service espresso bar.", websiteUrl: "https://espressoexpress.cafesite.com", plan: "Pro" }
  ];

  // Save to localstore
  initialCafes.forEach((cafe) => {
    localStorage.setItem("cafe_" + cafe.ownerEmail, JSON.stringify(cafe));
  });
}
