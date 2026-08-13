const BASE = "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Произошла ошибка запроса");
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: (token) => request("/auth/me", { token }),
  changePassword: (token, body) => request("/auth/change-password", { method: "POST", body, token }),

  dashboard: (token) => request("/dashboard", { token }),

  employees: {
    list: (token) => request("/employees", { token }),
    create: (token, body) => request("/employees", { method: "POST", body, token }),
    update: (token, id, body) => request(`/employees/${id}`, { method: "PATCH", body, token }),
    setActive: (token, id, isActive) =>
      request(`/employees/${id}/active`, { method: "PATCH", body: { isActive }, token }),
    resetPassword: (token, id, newPassword) =>
      request(`/employees/${id}/reset-password`, { method: "POST", body: { newPassword }, token }),
    remove: (token, id) => request(`/employees/${id}`, { method: "DELETE", token }),
    roles: (token) => request("/employees/roles/list", { token }),
    createRole: (token, body) => request("/employees/roles", { method: "POST", body, token }),
    updateRole: (token, id, body) => request(`/employees/roles/${id}`, { method: "PATCH", body, token }),
  },

  branches: {
    list: (token) => request("/branches", { token }),
    create: (token, body) => request("/branches", { method: "POST", body, token }),
    update: (token, id, body) => request(`/branches/${id}`, { method: "PATCH", body, token }),
  },

  clients: {
    list: (token, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/clients${qs ? `?${qs}` : ""}`, { token });
    },
    get: (token, id) => request(`/clients/${id}`, { token }),
    create: (token, body) => request("/clients", { method: "POST", body, token }),
    update: (token, id, body) => request(`/clients/${id}`, { method: "PATCH", body, token }),
  },

  vehicles: {
    list: (token, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/vehicles${qs ? `?${qs}` : ""}`, { token });
    },
    get: (token, id) => request(`/vehicles/${id}`, { token }),
    statuses: (token) => request("/vehicles/statuses", { token }),
    create: (token, body) => request("/vehicles", { method: "POST", body, token }),
    update: (token, id, body) => request(`/vehicles/${id}`, { method: "PATCH", body, token }),
    assign: (token, id, body) => request(`/vehicles/${id}/assign`, { method: "POST", body, token }),
    returnVehicle: (token, id) => request(`/vehicles/${id}/return`, { method: "POST", token }),
  },

  maintenance: {
    list: (token, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/maintenance${qs ? `?${qs}` : ""}`, { token });
    },
    create: (token, body) => request("/maintenance", { method: "POST", body, token }),
    update: (token, id, body) => request(`/maintenance/${id}`, { method: "PATCH", body, token }),
    remove: (token, id) => request(`/maintenance/${id}`, { method: "DELETE", token }),
  },

  debts: {
    list: (token, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/debts${qs ? `?${qs}` : ""}`, { token });
    },
    statuses: (token) => request("/debts/statuses", { token }),
    create: (token, body) => request("/debts", { method: "POST", body, token }),
    update: (token, id, body) => request(`/debts/${id}`, { method: "PATCH", body, token }),
    addPayment: (token, id, body) => request(`/debts/${id}/payments`, { method: "POST", body, token }),
  },
};
