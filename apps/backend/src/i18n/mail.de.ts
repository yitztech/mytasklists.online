import type { MailCopy } from './mail.types';

/**
 * Deutsche Übersetzung der transaktionalen E-Mails.
 */
export const MAIL_DE: MailCopy = {
  fallback: 'Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:',
  footer: 'Falls du das nicht warst, ignoriere diese E-Mail. MyTaskLists fragt niemals per E-Mail nach deinem Passwort.',
  hello: 'Hallo',
  verify: { subject: 'Bestätige deine E-Mail-Adresse bei MyTaskLists', title: 'E-Mail-Adresse bestätigen', action: 'E-Mail-Adresse bestätigen', body: hours => `Bestätige zum Abschluss der Registrierung, dass diese E-Mail-Adresse dir gehört. Der Link ist ${hours} Stunden gültig.`, ignore: 'Falls du kein Konto erstellt hast, ignoriere diese Nachricht.' },
  invite: { subject: inviter => `${inviter} hat dich zu einer MyTaskLists-Liste eingeladen`, title: 'Du hast eine Listeneinladung erhalten', action: 'Kostenloses Konto erstellen', body: (inviter, list, hours) => `${inviter} hat dich eingeladen, an „${list}“ mitzuarbeiten. Erstelle mit dieser E-Mail-Adresse ein kostenloses Konto, um die geteilte Liste zu öffnen. Die Einladung ist ${hours} Stunden gültig.` },
  reset: { subject: 'Setze dein MyTaskLists-Passwort zurück', title: 'Passwort zurücksetzen', action: 'Neues Passwort wählen', body: minutes => `Wir haben eine Anfrage zum Ändern deines Passworts erhalten. Der Link ist ${minutes} Minuten gültig und kann nur einmal verwendet werden.`, ignore: 'Falls du das nicht angefordert hast, ignoriere diese E-Mail: Dein aktuelles Passwort funktioniert weiterhin.' },
  password: { subject: 'Dein MyTaskLists-Passwort wurde geändert', title: 'Dein Passwort wurde geändert', action: 'Zu MyTaskLists', body: 'Dein Passwort wurde gerade geändert und wir haben dich von allen Sitzungen abgemeldet.', urgent: 'Falls du das nicht warst, stelle dein Konto sofort wieder her.' },
  mfa: { subject: enabled => `Die Zwei-Schritt-Verifizierung wurde ${enabled ? 'aktiviert' : 'deaktiviert'}`, title: enabled => `Zwei-Schritt-Verifizierung: ${enabled ? 'aktiviert' : 'deaktiviert'}`, body: enabled => `Die Zwei-Schritt-Verifizierung wurde für dein Konto ${enabled ? 'aktiviert' : 'deaktiviert'}. Falls du das nicht warst, ändere sofort dein Passwort.` },
  social: { subject: provider => `Dein ${provider}-Konto wurde verknüpft`, action: 'Passwort erstellen', body: provider => `Du hast dich mit ${provider} angemeldet und wir haben den Anbieter mit deinem Konto verknüpft. Da deine E-Mail-Adresse noch nicht bestätigt war, haben wir das bisherige Passwort deaktiviert und alle Sitzungen beendet. Erstelle ein neues Passwort, wenn du dich wieder mit einem Passwort anmelden möchtest.` },
  deleted: { subject: 'Dein MyTaskLists-Konto wurde gelöscht', title: 'Dein Konto wurde gelöscht', body: 'Dein Konto und seine Daten wurden gelöscht und du wurdest auf allen Geräten abgemeldet. Die von dir erstellten Listen wurden auch für alle Personen gelöscht, mit denen du sie geteilt hattest. Danke, dass du MyTaskLists genutzt hast.' },
  registration: { title: 'Registrierung abschließen', body: minutes => `Bestätige deine E-Mail-Adresse, um dein Konto zu erstellen. Dieser Link ist ${minutes} Minuten gültig.` },
};
