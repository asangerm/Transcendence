import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  await transporter.sendMail({
    from: `"Transcendence" <${process.env.SMTP_USER}>`,
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
           <a href="${resetLink}">${resetLink}</a>`,
  });
}
