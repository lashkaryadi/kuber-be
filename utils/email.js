// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// const { SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

// if (!SMTP_USER || !SMTP_PASS) {
//   console.error("❌ SMTP credentials missing");
//   process.exit(1);
// }

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: SMTP_USER,
//     pass: SMTP_PASS, // Google App Password
//   },
// });

// export async function sendEmail({ to, subject, html, text }) {
//   try {
//     await transporter.sendMail({
//       from: SMTP_FROM || SMTP_USER,
//       to,
//       subject,
//       text,
//       html,
//     });

//     console.log(`✅ Email sent successfully to: ${to}`);
//   } catch (error) {
//     console.error(`❌ Failed to send email to: ${to}`, error.message);
//     throw new Error(`Email delivery failed: ${error.message}`);
//   }
// }

import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

let resend = null;

function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️  RESEND_API_KEY not set — emails will be logged to console only");
      return null;
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const client = getResendClient();

    if (!client) {
      // Fallback: log email to console when no API key is configured
      console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
      if (text) console.log(`   Body: ${text}`);
      return;
    }

    await client.emails.send({
      from: "onboarding@resend.dev", // temporary domain
      to,
      subject,
      html,
      text,
    });

    console.log(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to: ${to}`, error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}
