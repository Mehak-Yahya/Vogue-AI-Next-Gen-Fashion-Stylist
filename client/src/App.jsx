import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Skintone from "./pages/Skintone";
import Wardrobe from "./pages/Wardrobe";
import ProtectedRoute from "./components/ProtectedRoute";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Outfits from "./pages/Outfits";

export default function App() {
	if (window.location.pathname === "/dashboard") {
		const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "null");
		if (!user) return <ProtectedRoute><Dashboard /></ProtectedRoute>;
		if (!user.onboardingComplete) return <ProtectedRoute requireOnboarding><Onboarding /></ProtectedRoute>;
		return <ProtectedRoute><Dashboard /></ProtectedRoute>;
	}
	if (window.location.pathname === "/onboarding") return <ProtectedRoute><Onboarding /></ProtectedRoute>;
	if (window.location.pathname === "/profile") return <ProtectedRoute><Profile /></ProtectedRoute>;
	if (window.location.pathname === "/outfits") return <ProtectedRoute><Outfits /></ProtectedRoute>;
	if (window.location.pathname === "/signup") return <Signup />;
	if (window.location.pathname === "/login") return <Login />;
	if (window.location.pathname === "/skintone") return <ProtectedRoute><Skintone /></ProtectedRoute>;
	if (window.location.pathname === "/wardrobe") return <ProtectedRoute><Wardrobe /></ProtectedRoute>;
	return <Landing />;
}