import nodemailer from "nodemailer";

// Configure your SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Change to your SMTP host (e.g., smtp.sendgrid.net, smtp.mailgun.org)
  port: 587, // 587 for TLS, 465 for SSL
  secure: false, // true for 465, false for other ports
  auth: {
    user: "your-email@gmail.com", // Your SMTP username/email
    pass: "your-app-password", // Your SMTP password or app-specific password
  },
});

const sendEmail = async (to, subject, html) => {
  console.log("📧 Sending email via SMTP to:", to);

  try {
    const info = await transporter.sendMail({
      from: '"Cybitrix" <your-email@gmail.com>', // Sender name and address
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully via SMTP:", info.messageId);
    return info;
  } catch (error) {
    console.error("SMTP failed:", error);
    throw new Error(`SMTP failed: ${error.message}`);
  }
};

export default sendEmail;
