import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProtectedRoute({ children, requireOnboarding = false }) {
  const [session, setSession] = useState({ status: "checking", user: null });

  useEffect(() => {
    let active = true;

    axios.get(`${API_BASE_URL}/api/auth/session`, { withCredentials: true })
      .then((response) => {
        if (!active) return;
        const user = response.data.user;
        localStorage.setItem("vogue-ai-user", JSON.stringify(user));
        sessionStorage.setItem("vogue-ai-csrf", response.data.csrfToken);
        setSession({ status: "authenticated", user });
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.response?.status === 401) {
          localStorage.removeItem("vogue-ai-user");
          setSession({ status: "unauthenticated", user: null });
          return;
        }
        setSession({ status: "error", user: null });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session.status !== "authenticated") return;

    if (requireOnboarding && session.user.onboardingComplete) {
      window.location.replace("/dashboard");
    } else if (!requireOnboarding && window.location.pathname === "/dashboard" && !session.user.onboardingComplete) {
      window.location.replace("/onboarding");
    }
  }, [requireOnboarding, session]);

  if (session.status === "checking") return null;
  if (session.status === "error") {
    return (
      <main role="alert" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <p>We could not verify your session right now.</p>
        <button type="button" onClick={() => window.location.reload()}>Try again</button>
      </main>
    );
  }
  if (session.status === "unauthenticated") {
    window.location.replace("/login");
    return null;
  }
  if (requireOnboarding && session.user.onboardingComplete) return null;
  if (!requireOnboarding && window.location.pathname === "/dashboard" && !session.user.onboardingComplete) return null;

  return children;
}