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
import Chatbot from "./pages/Chatbot";
import Trends from "./pages/Trends";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookieConsent from "./components/CookieConsent";

export default function App() {
	const pathname = window.location.pathname;
	let page;

	if (pathname === "/dashboard") {
		const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "null");
		if (!user) page = <ProtectedRoute><Dashboard /></ProtectedRoute>;
		else if (!user.onboardingComplete) page = <ProtectedRoute requireOnboarding><Onboarding /></ProtectedRoute>;
		else page = <ProtectedRoute><Dashboard /></ProtectedRoute>;
	}
	else if (pathname === "/onboarding") page = <ProtectedRoute><Onboarding /></ProtectedRoute>;
	else if (pathname === "/profile") page = <ProtectedRoute><Profile /></ProtectedRoute>;
	else if (pathname === "/outfits") page = <ProtectedRoute><Outfits /></ProtectedRoute>;
	else if (pathname === "/chatbot") page = <ProtectedRoute><Chatbot /></ProtectedRoute>;
	else if (pathname === "/trends") page = <ProtectedRoute><Trends /></ProtectedRoute>;
	else if (pathname === "/signup") page = <Signup />;
	else if (pathname === "/login") page = <Login />;
	else if (pathname === "/privacy-policy") page = <PrivacyPolicy />;
	else if (pathname === "/skintone") page = <ProtectedRoute><Skintone /></ProtectedRoute>;
	else if (pathname === "/wardrobe") page = <ProtectedRoute><Wardrobe /></ProtectedRoute>;
	else if (pathname === "/") page = <Landing />;
	else page = <NotFound />;

	return (
		<>
			{page}
			<CookieConsent />
		</>
	);
}