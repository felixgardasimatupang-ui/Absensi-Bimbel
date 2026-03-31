const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: options.body
      ? {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      : options.headers,
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    throw new Error(data.message || "Permintaan gagal.");
  }

  return data;
}

export const apiBaseUrl = API_URL;

export const api = {
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request("/auth/me"),
  logout: () =>
    request("/auth/logout", {
      method: "POST"
    }),
  dashboard: () => request("/dashboard"),
  roleAccess: () => request("/roles/access"),
  users: () => request("/users"),
  createUser: (payload) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  batches: () => request("/batches"),
  createBatch: (payload) =>
    request("/batches", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  students: () => request("/students"),
  createStudent: (payload) =>
    request("/students", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  classes: () => request("/classes"),
  createClass: (payload) =>
    request("/classes", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sessions: () => request("/sessions"),
  createSession: (payload) =>
    request("/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  attendance: () => request("/attendance"),
  saveAttendance: (payload) =>
    request("/attendance", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  checkoutAttendance: (id) =>
    request(`/attendance/${id}/checkout`, {
      method: "PATCH"
    }),
  createQrSession: (payload) =>
    request("/qr/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  scanQr: (payload) =>
    request("/qr/scan", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  evaluations: () => request("/evaluations"),
  createEvaluation: (payload) =>
    request("/evaluations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  evaluationSummary: () => request("/evaluations/summary"),
  notifications: () => request("/notifications"),
  sendAttendanceNotification: (payload) =>
    request("/notifications/attendance", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  attendanceReport: () => request("/reports/attendance")
};
