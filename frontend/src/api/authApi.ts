// frontend/src/api/authApi.ts

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function login(email: string, password: string): string | null {
  if (!email || !password) {
    return "Please enter email and password.";
  }

  if (!isValidEmail(email)) {
    return "Invalid email.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  localStorage.setItem("auth_user", email);
  return null; // success
}

export function logout() {
  localStorage.removeItem("auth_user");
}

export function getCurrentUser(): string | null {
  return localStorage.getItem("auth_user");
}

