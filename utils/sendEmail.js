import { Resend } from "resend";

const resend = new Resend("re_DgP2ogJT_DEvBdggHcZDz6mLPdBRGc12h");

const sendEmail = async (to, subject, html) => {
  console.log("📧 Sending email via Resend to:", to);

  try {
    const { data, error } = await resend.emails.send({
      from: "Cybitrix <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      throw error;
    }

    console.log("✅ Email sent successfully via Resend:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Resend failed:", error);
    throw new Error(`Resend failed: ${error.message}`);
  }
};

export default sendEmail;
