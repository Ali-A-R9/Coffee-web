export type CafeData = {
  _id?: string;
  ownerId?: string;
  name: string;
  slug?: string;
  description?: string;
  hours?: string | { open?: string; close?: string };
  ownerName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  adminComment?: string;
  zipCode?: string;
  logo?: string | null;
  logoUrl?: string | null;
  workingHours?: Record<string, { open: string; close: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicCafeData = CafeData & {
  menu?: Array<{
    name: string;
    items: Array<{
      id?: string;
      name: string;
      price: string;
      description?: string;
      available?: boolean;
    }>;
  }>;
};

const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = `${BASE_API_URL}/api/cafes`;

function getAuthHeaders(json = false): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyCafe(): Promise<CafeData | null> {
  const res = await fetch(`${BASE_URL}/my`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load cafe");
  }

  return data;
}

export async function createCafe(data: Partial<CafeData>) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to create cafe");
  }

  return result;
}

export async function updateCafe(data: Partial<CafeData>) {
  const res = await fetch(`${BASE_URL}/my`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update cafe");
  }

  return result;
}

export async function getAllCafes() {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load cafes");
  }

  return data;
}

export async function updateCafeStatus(
  id: string,
  status: string,
  adminComment = ""
) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, adminComment }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update cafe status");
  }

  return data;
}

export async function getPublicCafes(): Promise<PublicCafeData[]> {
  const res = await fetch(`${BASE_URL}/public`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load public cafes");
  }

  return data;
}
