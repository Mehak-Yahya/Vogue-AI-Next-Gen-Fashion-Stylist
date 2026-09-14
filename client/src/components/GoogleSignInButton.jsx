import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export default function GoogleSignInButton({ onCredential }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await result.user.getIdToken();
      await onCredential(token);
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Firebase Google sign-in failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return <p className="google-signin-config">Google sign-in is unavailable until it is configured.</p>;
  }

  return (
    <button type="button" className="google-signin-button" onClick={handleClick} disabled={loading}>
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}
