import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getEnv = (name: string) => {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : String(value || "");
};

const MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MIN_FILL_TIME_MS = 2500;

const requestStore = new Map<string, number[]>();

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const requests = (requestStore.get(ip) || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );
  if (requests.length >= MAX_REQUESTS) {
    requestStore.set(ip, requests);
    return true;
  }
  requests.push(now);
  requestStore.set(ip, requests);
  return false;
};

const buildHtml = (
  name: string,
  email: string,
  company: string,
  budget: string,
  message: string,
) => `
  <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
    <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Cerere nouă proiect</h2>
    <p><strong>Nume:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Companie:</strong> ${company || "-"}</p>
    <p><strong>Buget:</strong> ${budget || "-"}</p>
    <p><strong>Mesaj:</strong></p>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, "<br/>")}</div>
  </div>
`;

export const GET: APIRoute = async () => {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missing = required.filter((key) => !getEnv(key));
  return new Response(JSON.stringify({ ok: missing.length === 0, missing }), {
    status: missing.length === 0 ? 200 : 503,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ message: "Prea multe încercări." }),
        { status: 429 },
      );
    }

    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const honeypot = String(body?.honeypot ?? "").trim();
    const startedAt = Number(body?.startedAt ?? 0);

    if (
      honeypot.length > 0 ||
      !Number.isFinite(startedAt) ||
      Date.now() - startedAt < MIN_FILL_TIME_MS
    ) {
      return new Response(JSON.stringify({ message: "Cerere invalidă." }), {
        status: 400,
      });
    }

    if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
      return new Response(JSON.stringify({ message: "Date incomplete." }), {
        status: 400,
      });
    }

    const config = {
      host: getEnv("SMTP_HOST"),
      port: Number(getEnv("SMTP_PORT") || "587"),
      user: getEnv("SMTP_USER"),
      pass: getEnv("SMTP_PASS"),
      from: getEnv("CONTACT_FROM") || getEnv("SMTP_USER"),
      to: getEnv("CONTACT_TO") || getEnv("SMTP_USER"),
      backup: getEnv("CONTACT_TO_BACKUP"),
    };

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      tls: { rejectUnauthorized: false },
    });

    const mailPayload = {
      from: `Pixelflow Studio <${config.from}>`,
      to: config.to,
      replyTo: email,
      subject: `Proiect Nou: ${name}`,
      html: buildHtml(
        name,
        email,
        String(body?.company || ""),
        String(body?.budget || ""),
        message,
      ),
    };

    try {
      await transporter.sendMail(mailPayload);
    } catch (err) {
      if (config.backup) {
        await transporter.sendMail({ ...mailPayload, to: config.backup });
      } else {
        throw err;
      }
    }

    return new Response(JSON.stringify({ message: "Mesaj trimis!" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Eroare server." }), {
      status: 500,
    });
  }
};
