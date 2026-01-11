import nodemailer from "nodemailer";

export const sendInvoiceEmail = async (to, invoiceNumber) => {
  const transporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Kuber" <${process.env.MAIL_USER}>`,
    to,
    subject: `Invoice ${invoiceNumber}`,
    text: `Your invoice ${invoiceNumber} has been generated.`,
  });
};
