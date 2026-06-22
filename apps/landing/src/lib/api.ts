import axios from "axios";

// Axios instance — wired but not yet calling a real backend (UI-only phase).
// When going live, services swap their mock return for `api.get(...)` calls.
// Base URL will come from an env var (e.g. import.meta.env.VITE_API_URL) later.
export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});
