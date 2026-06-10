import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({ baseURL: BASE });

// ── Missing entries ─────────────────────────────────────────────────────────
export const getMissing = (params = {}) =>
  api.get("/api/missing", { params }).then((r) => r.data);

export const createMissing = (formData) =>
  api.post("/api/missing", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const updateMissingStatus = (id, status) =>
  api.patch(`/api/missing/${id}`, { status }).then((r) => r.data);

export const deleteMissing = (id) =>
  api.delete(`/api/missing/${id}`).then((r) => r.data);

// ── Found entries ──────────────────────────────────────────────────────────
export const getFound = (params = {}) =>
  api.get("/api/found", { params }).then((r) => r.data);

export const createFound = (formData) =>
  api.post("/api/found", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

// ── Matches ────────────────────────────────────────────────────────────────
export const getMatches = (params = {}) =>
  api.get("/api/matches", { params }).then((r) => r.data);

export const deleteMatch = (id) =>
  api.delete(`/api/matches/${id}`).then((r) => r.data);

// ── Stats ──────────────────────────────────────────────────────────────────
export const getStats = () =>
  api.get("/api/stats").then((r) => r.data);

// ── Image URL helper ───────────────────────────────────────────────────────
export const imageUrl = (path) =>
  path ? `${BASE}/${path}` : null;
