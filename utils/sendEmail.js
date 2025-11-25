import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  // DEBUG: Check credentials
  console.log("🔍 DEBUG - EMAIL_USER:", process.env.EMAIL_USER);
  console.log("🔍 DEBUG - EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  console.log(
    "🔍 DEBUG - All env keys:",
    Object.keys(process.env).filter((k) => k.includes("EMAIL"))
  );

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("❌ EMAIL CREDENTIALS NOT LOADED FROM .env FILE!");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw new Error(`Email failed: ${error.message}`);
  }
};

export default sendEmail;
