import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getEnv = (name: string) => {
  const value = import.meta.env[name as keyof ImportMetaEnv];
  return typeof value === 'string' ? value.trim() : '';
};

const MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MIN_FILL_TIME_MS = 2500;

const requestStore = new Map<string, number[]>();

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',');
    return firstIp.trim();
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const requests = (requestStore.get(ip) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

  if (requests.length >= MAX_REQUESTS) {
    requestStore.set(ip, requests);
    return true;
  }

  requests.push(now);
  requestStore.set(ip, requests);
  return false;
};

const buildHtml = (name: string, email: string, company: string, budget: string, message: string) => `
  <h2>Cerere nouă din formularul de contact</h2>
  <p><strong>Nume:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Companie:</strong> ${company || '-'}</p>
  <p><strong>Buget estimat:</strong> ${budget || '-'}</p>
  <p><strong>Mesaj:</strong></p>
  <p>${message.replace(/\n/g, '<br/>')}</p>
`;

export const GET: APIRoute = async () => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter((key) => !getEnv(key));

  return new Response(
    JSON.stringify({
      ok: missing.length === 0,
      service: 'contact',
      timestamp: new Date().toISOString(),
      missing,
    }),
    {
      status: missing.length === 0 ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ message: 'Prea multe încercări. Reîncearcă în câteva minute.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const company = String(body?.company ?? '').trim();
    const budget = String(body?.budget ?? '').trim();
    const message = String(body?.message ?? '').trim();
    const honeypot = String(body?.honeypot ?? '').trim();
    const startedAt = Number(body?.startedAt ?? 0);

    if (honeypot.length > 0) {
      return new Response(JSON.stringify({ message: 'Cerere invalidă.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_TIME_MS) {
      return new Response(JSON.stringify({ message: 'Te rugăm să completezi formularul cu atenție.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (name.length < 2 || !isValidEmail(email) || message.length < 10) {
      return new Response(JSON.stringify({ message: 'Date invalide.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const SMTP_HOST = getEnv('SMTP_HOST');
    const SMTP_PORT = Number(getEnv('SMTP_PORT') || '587');
    const SMTP_USER = getEnv('SMTP_USER');
    const SMTP_PASS = getEnv('SMTP_PASS');
    const CONTACT_TO = getEnv('CONTACT_TO') || SMTP_USER;
    const CONTACT_TO_BACKUP = getEnv('CONTACT_TO_BACKUP');
    const CONTACT_FROM = getEnv('CONTACT_FROM') || SMTP_USER;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !CONTACT_TO || !CONTACT_FROM) {
      return new Response(JSON.stringify({ message: 'Configurație SMTP lipsă pe server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailPayload = {
      from: `Website Pixelflow <${CONTACT_FROM}>`,
      to: CONTACT_TO,
      replyTo: email,
      subject: `Cerere proiect - ${name}`,
      text: [
        `Nume: ${name}`,
        `Email: ${email}`,
        `Companie: ${company || '-'}`,
        `Buget estimat: ${budget || '-'}`,
        '',
        'Mesaj:',
        message,
      ].join('\n'),
      html: buildHtml(name, email, company, budget, message),
    };

    try {
      await transporter.sendMail(mailPayload);
    } catch (primaryError) {
      console.error('[contact] Primary email failed', {
        error: primaryError instanceof Error ? primaryError.message : String(primaryError),
        ip,
      });

      if (!CONTACT_TO_BACKUP) {
        throw primaryError;
      }

      await transporter.sendMail({ ...mailPayload, to: CONTACT_TO_BACKUP });
    }

    return new Response(JSON.stringify({ message: 'Mesaj trimis cu succes. Revenim în curând.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[contact] Send failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(JSON.stringify({ message: 'Eroare la trimitere. Încearcă din nou.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
