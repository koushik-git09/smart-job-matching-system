const API_BASE = "http://127.0.0.1:8000";

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Signup failed");
  }

  return await res.json();
}

export async function loginWithOptions(
  role: string,
  credentials: { email: string; password: string },
  _options?: any
) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      role,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }

  const data = await res.json();

  // 🔐 Store JWT token
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", data.role);

  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function getUserRole() {
  return localStorage.getItem("user_role");
}
