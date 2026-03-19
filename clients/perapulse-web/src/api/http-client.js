import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let accessTokenProvider = () => null;

export function setAccessTokenProvider(provider) {
  accessTokenProvider = provider;
}

httpClient.interceptors.request.use((config) => {
  const token = accessTokenProvider();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeError(error) {
  if (axios.isAxiosError(error)) {
    const normalized = new Error(error.message);
    normalized.status = error.response?.status ?? null;
    normalized.data = error.response?.data ?? null;
    throw normalized;
  }
  throw error;
}

export async function getJson(path, config = {}) {
  try {
    const response = await httpClient.get(path, config);
    return response.data;
  } catch (error) {
    normalizeError(error);
  }
}

export async function postJson(path, body = {}, config = {}) {
  try {
    const response = await httpClient.post(path, body, config);
    return response.data;
  } catch (error) {
    normalizeError(error);
  }
}

export async function putJson(path, body = {}, config = {}) {
  try {
    const response = await httpClient.put(path, body, config);
    return response.data;
  } catch (error) {
    normalizeError(error);
  }
}

export async function patchJson(path, body = {}, config = {}) {
  try {
    const response = await httpClient.patch(path, body, config);
    return response.data;
  } catch (error) {
    normalizeError(error);
  }
}

export async function deleteJson(path, config = {}) {
  try {
    const response = await httpClient.delete(path, config);
    return response.data;
  } catch (error) {
    normalizeError(error);
  }
}

