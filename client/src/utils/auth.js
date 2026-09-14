export const authHeaders = () => {
	const csrfToken = sessionStorage.getItem("vogue-ai-csrf");
	return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
};

export const authFetchOptions = { credentials: "include" };