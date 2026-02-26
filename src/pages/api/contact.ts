import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

const getEnv = (name: string) => (import.meta.env[name] || "").trim();

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function verifyTurnstile(token: string) {
  const secret = getEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secret}&response=${token}`,
      },
    );
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

const buildHtml = (
  name: string,
  email: string,
  company: string,
  budget: string,
  message: string,
) => `
  <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
    <h2 style="color: #d97706; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 0;">Lead Nou: ${name}</h2>
    <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #d97706;">${email}</a></p>
    <p><strong>Companie:</strong> ${company || "Nespecificat"}</p>
    <p><strong>Buget:</strong> ${budget || "Nespecificat"}</p>
    <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-left: 4px solid #d97706; border-radius: 4px;">
      <p style="margin: 0 0 10px 0;"><strong>Mesaj:</strong></p>
      <p style="white-space: pre-wrap; margin: 0;">${message}</p>
    </div>
  </div>
`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, message, company, budget, honeypot, startedAt } = body;
    const turnstileToken = body["cf-turnstile-response"];

    if (!(await verifyTurnstile(turnstileToken))) {
      return new Response(
        JSON.stringify({ message: "Security check failed." }),
        { status: 400 },
      );
    }

    if (honeypot || Date.now() - Number(startedAt || 0) < 2000) {
      return new Response(JSON.stringify({ message: "Bot detected." }), {
        status: 400,
      });
    }

    if (
      !name ||
      name.length < 2 ||
      !isValidEmail(email) ||
      !message ||
      message.length < 10
    ) {
      return new Response(JSON.stringify({ message: "Invalid data." }), {
        status: 400,
      });
    }

    const smtpPort = Number(getEnv("SMTP_PORT") || "465");
    const transporter = nodemailer.createTransport({
      host: getEnv("SMTP_HOST"),
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: getEnv("SMTP_USER"), pass: getEnv("SMTP_PASS") },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"Pixelflow Studio" <${getEnv("SMTP_USER")}>`,
      to: getEnv("CONTACT_TO") || getEnv("SMTP_USER"),
      replyTo: email,
      subject: `Proiect Nou: ${name}`,
      html: buildHtml(name, email, company, budget, message),
    });

    return new Response(JSON.stringify({ message: "Mesaj trimis!" }), {
      status: 200,
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ message: "Eroare server.", debug: e.message }),
      { status: 500 },
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ message: "Not allowed." }), {
    status: 405,
  });
};
