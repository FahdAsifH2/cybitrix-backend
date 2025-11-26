import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  // DEBUG: Check credentials
  console.log("🔍 DEBUG - EMAIL_USER:", process.env.EMAIL_USER);
  console.log("🔍 DEBUG - EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("❌ EMAIL CREDENTIALS NOT LOADED FROM .env FILE!");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Add timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const mailOptions = {
    from: `"Cybitrix" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    console.log("📧 Sending email to:", to);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw new Error(`Email failed: ${error.message}`);
  }
};

export default sendEmail;
