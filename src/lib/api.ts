const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function parseMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "So'rov bajarilmadi";
  const message = (body as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return "So'rov bajarilmadi";
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("najotedu_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("najotedu_token", token);
  else localStorage.removeItem("najotedu_token");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("najotedu_refresh_token");
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("najotedu_refresh_token", token);
  else localStorage.removeItem("najotedu_refresh_token");
}

// Token yangilash — bir vaqtda bir marta ishlashi uchun
let refreshingPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        setToken(null);
        setRefreshToken(null);
        return false;
      }

      const data = await res.json();
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  // Login endpointida 401 — parol noto'g'ri, refresh qilmaslik
  if (res.status === 401 && path === "/auth/login") {
    const text = await res.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    throw new ApiError(parseMessage(data) || "Telefon raqam yoki parol noto'g'ri", 401);
  }

  // Boshqa 401 — refresh token bilan yangi token olamiz
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Yangi token bilan qayta so'rov yuboramiz
      const newToken = getToken();
      const retryHeaders = new Headers(init.headers);
      if (!retryHeaders.has("Content-Type") && init.body) {
        retryHeaders.set("Content-Type", "application/json");
      }
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);

      const retryRes = await fetch(`${API_URL}${path}`, { ...init, headers: retryHeaders });
      const retryText = await retryRes.text();
      let retryData: unknown = null;
      if (retryText) {
        try { retryData = JSON.parse(retryText); } catch { retryData = { message: retryText }; }
      }
      if (!retryRes.ok) throw new ApiError(parseMessage(retryData), retryRes.status);
      return retryData as T;
    } else {
      // Refresh ham ishlamadi — faqat token tozalash, redirect login sahifasida ko'rinib turganda qilmaymiz
      setToken(null);
      setRefreshToken(null);
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new ApiError("Token yaroqsiz yoki muddati tugagan", 401);
    }
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!res.ok) throw new ApiError(parseMessage(data), res.status);
  return data as T;
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: "DELETE" });

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  if (!res.ok) throw new ApiError(parseMessage(data), res.status);
  return data as T;
}
