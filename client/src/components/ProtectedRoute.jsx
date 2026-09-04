export default function ProtectedRoute({ children, requireOnboarding = false }) {
  const user = localStorage.getItem("vogue-ai-user");

  if (!user) {
    window.location.replace("/login");
    return null;
  }

  if (requireOnboarding && user) {
    const parsedUser = JSON.parse(user);
    if (parsedUser.onboardingComplete) {
      window.location.replace("/dashboard");
      return null;
    }
  }

  return children;
}