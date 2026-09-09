export const getAuthToken = () => localStorage.getItem("vogue-ai-token") || "";

export const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};