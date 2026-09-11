// ============================================================
// SUPPORTIQ API CLIENT
// ============================================================
// The frontend always calls /api/* on its own origin.
// - Localhost: Vite proxies /api to the deployed Render backend.
// - Vercel: vercel.json proxies /api to the deployed Render backend.
// This keeps browser requests same-origin and avoids CORS changes
// to the already-deployed backend.
// ============================================================

const API_BASE_URL = "";

export { API_BASE_URL };

export async function apiFetch(path, options = {}) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(cleanPath, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      (data && data.detail) ||
      (data && data.message) ||
      `Request failed with ${response.status}`;

    throw new Error(message);
  }

  return data;
}
