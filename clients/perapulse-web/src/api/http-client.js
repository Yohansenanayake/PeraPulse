import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: {
    Accept: "application/json",
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

export async function getJson(path, config = {}) {
  try {
    const response = await httpClient.get(path, config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const normalized = new Error(error.message);
      normalized.status = error.response?.status ?? null;
      normalized.data = error.response?.data ?? null;
      throw normalized;
    }

    throw error;
  }
}
