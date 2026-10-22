import type { APIRequestContext } from '@playwright/test';

/**
 * Lectura de la bandeja de Mailpit (SMTP de desarrollo del docker-compose),
 * para probar de punta a punta los correos de verificación y recuperación.
 */
export const MAILPIT_URL = (process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:8025').replace(/\/$/, '');

interface MailpitSummary {
  ID: string;
  Subject: string;
  Created: string;
  To: { Address: string }[];
}

export interface ReceivedEmail {
  subject: string;
  text: string;
  html: string;
}

/** IDs de los correos que ya recibió `to`: para ignorarlos al esperar uno nuevo con la misma dirección */
export async function receivedEmailIds(request: APIRequestContext, to: string): Promise<Set<string>> {
  const search = await request.get(`${MAILPIT_URL}/api/v1/search`, { params: { query: `to:"${to}"` } });
  const { messages } = (await search.json()) as { messages: MailpitSummary[] };
  return new Set(messages.map((message) => message.ID));
}

/** Espera el último correo para `to` cuyo asunto contenga `subject` (sin contar los de `ignore`) */
export async function waitForEmail(
  request: APIRequestContext,
  to: string,
  subject: string,
  timeoutMs = 15_000,
  ignore: Set<string> = new Set(),
): Promise<ReceivedEmail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const search = await request.get(`${MAILPIT_URL}/api/v1/search`, {
      params: { query: `to:"${to}"` },
    });
    if (search.ok()) {
      const { messages } = (await search.json()) as { messages: MailpitSummary[] };
      // La búsqueda de Mailpit es aproximada: se exige el destinatario exacto
      const match = messages.find(
        (message) =>
          !ignore.has(message.ID) &&
          message.Subject.includes(subject) &&
          message.To.some((recipient) => recipient.Address.toLowerCase() === to.toLowerCase()),
      );
      if (match) {
        const detail = await (await request.get(`${MAILPIT_URL}/api/v1/message/${match.ID}`)).json();
        return { subject: detail.Subject, text: detail.Text ?? '', html: detail.HTML ?? '' };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`No llegó el correo "${subject}" para ${to} (¿está arriba Mailpit en ${MAILPIT_URL}?)`);
}

/** Extrae el token del enlace `<ruta>#token=…` del cuerpo del correo */
export function tokenFromEmail(email: ReceivedEmail, path: string): string {
  const match = new RegExp(`${path}#token=([A-Za-z0-9_-]+)`).exec(email.text);
  if (!match) throw new Error(`El correo no trae un enlace a ${path}`);
  return match[1];
}

/** Enlace completo (para abrirlo en el navegador) */
export function linkFromEmail(email: ReceivedEmail, path: string): string {
  const match = new RegExp(`(https?://\\S+${path}#token=[A-Za-z0-9_-]+)`).exec(email.text);
  if (!match) throw new Error(`El correo no trae un enlace a ${path}`);
  return match[1];
}
