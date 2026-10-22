/** Textos de los correos transaccionales para los idiomas con catálogo propio. */
export type MailCopy = {
  fallback: string;
  footer: string;
  hello: string;
  verify: { subject: string; title: string; action: string; body: (hours: number) => string; ignore: string };
  invite: { subject: (inviter: string) => string; title: string; action: string; body: (inviter: string, list: string, hours: number) => string };
  reset: { subject: string; title: string; action: string; body: (minutes: number) => string; ignore: string };
  password: { subject: string; title: string; action: string; body: string; urgent: string };
  mfa: { subject: (enabled: boolean) => string; title: (enabled: boolean) => string; body: (enabled: boolean) => string };
  social: { subject: (provider: string) => string; action: string; body: (provider: string) => string };
  deleted: { subject: string; title: string; body: string };
  registration: { title: string; body: (minutes: number) => string };
};
