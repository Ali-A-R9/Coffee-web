const BASE_URL = "http://localhost:5000/api/auth";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export type RegistrationRole = "client" | "owner";

function getAuthHeaders(json = false): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  role: RegistrationRole
) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fullName, email, password, role }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load profile");
  }

  return data;
}

export async function updateMe(data: Partial<AuthUser>) {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update profile");
  }

  return result;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
