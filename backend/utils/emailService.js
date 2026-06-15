import nodemailer from "nodemailer";

const isTest = process.env.NODE_ENV === "test";
let transporter = null;

// Create transporter on first use
function getTransporter() {
  if (transporter) return transporter;
  if (isTest) return null;

  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  const service = process.env.EMAIL_SERVICE || "gmail";

  console.log("\n📧 EMAIL SERVICE");
  console.log("  USER:", user ? "✓ SET" : "✗ MISSING");
  console.log("  PASS:", pass ? "✓ SET" : "✗ MISSING");
  console.log("  SERVICE:", service);

  if (!user || !pass) {
    console.warn("⚠️  Email credentials missing - password reset will fail");
    return null;
  }

  transporter = nodemailer.createTransport({
    service,
    auth: { user, pass },
  });

  transporter.verify()
    .then(() => console.log("  Status: ✅ Ready\n"))
    .catch(err => console.error("  Status: ❌", err.message, "\n"));

  return transporter;
}

// ---------------- EXPORTS ----------------
export const sendPasswordResetEmail = async (email, resetToken) => {
  if (isTest) {
    console.log("[TEST EMAIL reset]", email, resetToken);
    return { success: true, messageId: "test-mode" };
  }

  const transport = getTransporter();
  if (!transport) {
    throw new Error("Email credentials not configured");
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const info = await transport.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `<a href="${resetLink}">Reset Password</a>`,
  });

  console.log("✅ Email sent:", info.messageId);
  return { success: true, messageId: info.messageId };
};

export const sendPasswordResetCodeEmail = async (email, code) => {
  if (isTest) {
    console.log("[TEST EMAIL code]", email, code);
    return { success: true, messageId: "test-mode", code };
  }

  const transport = getTransporter();
  if (!transport) {
    throw new Error("Email credentials not configured");
  }

  const info = await transport.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your VogueAI Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Code</h2>
        <p style="color: #666;">Use this code to reset your password:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: #2c3e50; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This code expires in 15 minutes.</p>
      </div>
    `,
  });

  console.log("✅ Code email sent:", info.messageId);
  return { success: true, messageId: info.messageId };
};