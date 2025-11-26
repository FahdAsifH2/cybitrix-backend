import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  console.log("🔍 DEBUG - EMAIL_USER:", process.env.EMAIL_USER);
  console.log("🔍 DEBUG - EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("❌ EMAIL CREDENTIALS NOT LOADED!");
  }

  // ✅ TRY PORT 465 with SSL instead of 587 with TLS
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Changed from 587
    secure: true, // Changed from false (use SSL)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Remove TLS config when using SSL
    connectionTimeout: 20000, // Increased to 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  const mailOptions = {
    from: `"Cybitrix" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    console.log("📧 Attempting to send email via SSL (port 465)...");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    console.error("   Error code:", error.code);
    throw new Error(`Email failed: ${error.message}`); // ✅ Fixed
  }
};

export default sendEmail;
