const raw = import.meta.env.VITE_API_URL;

if (!raw) {
  // Vite only exposes env vars prefixed with VITE_.
  // If this is missing, API requests will fail (or hit same-origin routes).
  console.error(
    "[config] Missing VITE_API_URL. Set it in frontend/.env (local) or in your hosting provider's environment variables (Vercel).",
  );
}

// Keep the template-literal form to match project conventions and to make
// it obvious this is environment-driven.
export const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ""}`.replace(/\/+$/, "");
