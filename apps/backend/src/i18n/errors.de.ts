/**
 * Deutsche Übersetzung der Fehlermeldungen.
 */
export const ERRORS_DE: Record<string, string> = {
  'Ocurrió un error inesperado': 'Ein unerwarteter Fehler ist aufgetreten',

  // Authentifizierung und Sitzung
  'Correo o contraseña incorrectos': 'E-Mail oder Passwort falsch',
  'Demasiados intentos fallidos con este correo. Espera unos minutos o restablece tu contraseña.':
    'Zu viele fehlgeschlagene Versuche mit dieser E-Mail. Warte einige Minuten oder setze dein Passwort zurück.',
  'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.':
    'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.',
  'Ya existe una cuenta con este correo electrónico': 'Ein Konto mit dieser E-Mail existiert bereits',
  'Ya existe una cuenta con este correo y el proveedor no confirmó que te pertenece. Inicia sesión con tu contraseña.':
    'Ein Konto mit dieser E-Mail existiert bereits und der Anbieter hat die Inhaberschaft nicht bestätigt. Bitte melde dich mit deinem Passwort an.',
  'La cuenta está desactivada': 'Dieses Konto ist deaktiviert',
  'Usuario no encontrado': 'Benutzer nicht gefunden',
  'Falta el token de acceso': 'Zugriffstoken fehlt',
  'Falta el refresh token': 'Aktualisierungstoken fehlt',
  'Token inválido o expirado': 'Token ungültig oder abgelaufen',
  'Tipo de token inválido': 'Ungültiger Tokentyp',
  'El refresh token no es válido o ya expiró': 'Das Aktualisierungstoken ist ungültig oder abgelaufen',
  'La sesión ya fue cerrada': 'Die Sitzung wurde bereits beendet',
  'La sesión ya no es válida': 'Die Sitzung ist nicht mehr gültig',
  'La sesión ya no es válida. Vuelve a iniciar sesión.': 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  'No cuentas con permisos para esta operación': 'Du hast keine Berechtigung für diesen Vorgang',
  'Tu correo ya está verificado': 'Deine E-Mail ist bereits bestätigt',
  'El enlace no es válido o ya expiró': 'Der Link ist ungültig oder abgelaufen',
  'Debes indicar tu contraseña actual': 'Bitte gib dein aktuelles Passwort ein',
  'La contraseña actual no es correcta': 'Dein aktuelles Passwort ist nicht korrekt',
  'Esta versión de la app ya no es compatible. Actualízala para seguir usándola.':
    'Diese App-Version wird nicht mehr unterstützt. Bitte aktualisiere sie, um fortzufahren.',

  // Zweistufige Überprüfung
  'El código no es correcto': 'Der Code ist nicht korrekt',
  'Activa la verificación en dos pasos para usar el panel de administración':
    'Aktiviere die zweistufige Überprüfung, um den Admin-Bereich zu nutzen',
  'Las cuentas de administración deben mantener la verificación en dos pasos':
    'Administratorkonten müssen die zweistufige Überprüfung aktiviert lassen',
  'El token de notificaciones no es válido': 'Das Benachrichtigungstoken ist ungültig',
  'Escribe tu contraseña para eliminar la cuenta': 'Gib dein Passwort ein, um das Konto zu löschen',
  'La contraseña no es correcta': 'Das Passwort ist nicht korrekt',
  'El código de verificación no es correcto': 'Der Bestätigungscode ist nicht korrekt',
  'Demasiados códigos incorrectos. Vuelve a iniciar sesión.': 'Zu viele falsche Codes. Bitte melde dich erneut an.',
  'El inicio de sesión expiró. Vuelve a empezar.': 'Die Anmeldung ist abgelaufen. Bitte von vorne beginnen.',
  'El alta expiró. Vuelve a generar el código QR.': 'Die Einrichtung ist abgelaufen. Bitte generiere den QR-Code neu.',
  'La verificación en dos pasos ya está activa': 'Die zweistufige Überprüfung ist bereits aktiv',

  // Google und Apple
  'El inicio de sesión con Google no está configurado': 'Google-Anmeldung ist nicht konfiguriert',
  'Sign in with Apple no está configurado': 'Apple-Anmeldung ist nicht konfiguriert',
  'El inicio de sesión con Google no está configurado (define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET)':
    'Google-Anmeldung ist nicht konfiguriert (setze GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET)',
  'Sign in with Apple no está configurado (define APPLE_CLIENT_ID, APPLE_TEAM_ID y APPLE_KEY_ID)':
    'Apple-Anmeldung ist nicht konfiguriert (setze APPLE_CLIENT_ID, APPLE_TEAM_ID und APPLE_KEY_ID)',
  'No fue posible completar el inicio de sesión con Google': 'Google-Anmeldung konnte nicht abgeschlossen werden',
  'No fue posible completar el inicio de sesión con Apple': 'Apple-Anmeldung konnte nicht abgeschlossen werden',
  'El parámetro state no es válido o ya expiró': 'Der state-Parameter ist ungültig oder abgelaufen',
  'Google no devolvió un id_token': 'Google hat kein id_token zurückgegeben',
  'Apple no devolvió un identityToken': 'Apple hat kein identityToken zurückgegeben',
  'El token de Google no es válido': 'Das Google-Token ist ungültig',
  'El token de Apple no es válido': 'Das Apple-Token ist ungültig',
  'El token de Google no corresponde a este inicio de sesión': 'Das Google-Token passt nicht zu dieser Anmeldung',
  'El token de Apple no corresponde a este inicio de sesión': 'Das Apple-Token passt nicht zu dieser Anmeldung',
  'La cuenta de Google no expone una identidad válida': 'Das Google-Konto stellt keine gültige Identität bereit',
  'La cuenta de Google no expone un correo electrónico': 'Das Google-Konto gibt keine E-Mail-Adresse frei',

  // Formularvalidierung
  'El nombre completo debe tener entre 3 y 160 caracteres': 'Der vollständige Name muss zwischen 3 und 160 Zeichen lang sein',
  'El correo electrónico no es válido': 'Die E-Mail-Adresse ist ungültig',
  'El número de WhatsApp no es válido': 'Die WhatsApp-Nummer ist ungültig',
  'La contraseña debe tener al menos 8 caracteres': 'Das Passwort muss mindestens 8 Zeichen lang sein',
  'La contraseña no puede superar 128 caracteres': 'Das Passwort darf nicht länger als 128 Zeichen sein',
  'La contraseña es obligatoria': 'Das Passwort ist erforderlich',
  'El avatar debe ser una URL https': 'Der Avatar muss eine https-URL sein',
  'Los días de recurrencia deben ser un número entero': 'Wiederholungstage müssen eine ganze Zahl sein',
  'La recurrencia mínima es de 1 día': 'Das minimale Wiederholungsintervall beträgt 1 Tag',
  'La recurrencia máxima es de 365 días': 'Das maximale Wiederholungsintervall beträgt 365 Tage',
  'Indica cada cuántos días debe volver a aparecer el producto': 'Gib an, alle wie viele Tage der Artikel wiedererscheinen soll',
  '`days` debe ser un número entre 1 y 3650': '`days` muss eine Zahl zwischen 1 und 3650 sein',

  // Listen und Artikel
  'La lista no existe': 'Die Liste existiert nicht',
  'La lista no existe o no tienes acceso a ella': 'Die Liste existiert nicht oder du hast keinen Zugriff darauf',
  'Solo puedes consultar esta lista': 'Du hast nur Lesezugriff auf diese Liste',
  'Esta lista ya es tuya': 'Diese Liste gehört dir bereits',
  'El producto no existe': 'Der Artikel existiert nicht',
  'Ese producto ya está en la lista': 'Dieser Artikel befindet sich bereits auf der Liste',
  'Ese producto ya está en la lista como comprado. Regrésalo a pendientes en lugar de agregarlo otra vez.':
    'Dieser Artikel steht bereits als gekauft auf der Liste. Verschiebe ihn zurück zu den offenen Artikeln.',
  'Ese producto ya está en la lista y volverá a aparecer cuando toque según su recurrencia':
    'Dieser Artikel steht bereits auf der Liste und erscheint gemäß seiner Wiederholung wieder',
  'Indica el correo o el id de la persona': 'Gib die E-Mail oder ID der Person ein',
  'No encontramos a esa persona. Debe registrarse antes de que puedas compartirle la lista.':
    'Person nicht gefunden. Sie muss sich registrieren, bevor du die Liste teilen kannst.',
  'Esa persona ya forma parte de la lista': 'Diese Person ist bereits Mitglied der Liste',
  'Esa persona no forma parte de la lista': 'Diese Person ist kein Mitglied der Liste',
  'Solo la persona propietaria puede hacer esto': 'Nur der Eigentümer kann dies tun',
  'Solo la persona propietaria puede cambiar los roles': 'Nur der Eigentümer kann Rollen ändern',
  'Solo la persona propietaria puede modificar a otros integrantes': 'Nur der Eigentümer kann andere Mitglieder bearbeiten',
  'Solo la persona propietaria puede quitar integrantes': 'Nur der Eigentümer kann Mitglieder entfernen',
  'No puedes quitarle la propiedad a quien creó la lista': 'Du kannst dem Ersteller der Liste die Eigentümerschaft nicht entziehen',
  'La persona propietaria no puede salirse de la lista; primero elimínala o transfiérela':
    'Der Eigentümer kann die Liste nicht verlassen; bitte zuerst löschen oder übertragen',

  // Administration und Hilfsprogramme
  'No puedes desactivar tu propia cuenta': 'Du kannst dein eigenes Konto nicht deaktivieren',
  'Esta utilidad está deshabilitada en producción': 'Dieses Dienstprogramm ist in der Produktionsumgebung deaktiviert',

  // Erfolgsmeldungen mit Text
  'Si el correo está registrado te enviamos un enlace para restablecer la contraseña.':
    'Falls die E-Mail registriert ist, haben wir einen Link zum Zurücksetzen des Passworts gesendet.',
  'La suscripción al boletín no está disponible': 'Newsletter-Anmeldung ist derzeit nicht verfügbar',
  'No se pudo completar la suscripción. Inténtalo más tarde.': 'Anmeldung fehlgeschlagen. Bitte versuche es später erneut.',

  'El código ya existe': 'Der Code existiert bereits',
  'La fecha de caducidad debe ser futura': 'Das Ablaufdatum muss in der Zukunft liegen',
  'Espera antes de solicitar otro enlace': 'Warte bitte kurz, bevor du einen neuen Link anforderst',
  'Demasiadas solicitudes. Inténtalo más tarde.': 'Zu viele Anfragen. Bitte versuche es später erneut.',
  'No se pudo enviar el enlace. Inténtalo de nuevo más tarde.': 'Link konnte nicht gesendet werden. Bitte versuche es später erneut.',
  'Las contraseñas no coinciden': 'Passwörter stimmen nicht überein',
  'La contraseña no puede superar 72 bytes': 'Das Passwort darf 72 Bytes nicht überschreiten',
  'La suscripción de pago todavía no está disponible. Puedes continuar gratis.': 'Kostenpflichtige Abonnements sind noch nicht verfügbar. Du kannst kostenlos fortfahren.',
  'El precio de la suscripción no está disponible.': 'Der Abonnementpreis ist nicht verfügbar.',
  'El código no es válido o ya expiró': 'Der Code ist ungültig oder abgelaufen',
  'El código no tiene descuento disponible': 'Für diesen Code ist kein Rabatt verfügbar',
  'Este código no está disponible para tu cuenta o plan': 'Dieser Code ist für dein Konto oder deinen Plan nicht verfügbar',
  'Ya tienes Premium. Administra tu suscripción actual.': 'Du hast bereits Premium. Verwalte dein aktuelles Abonnement.',
  'El precio cambió. Revisa el importe y confirma de nuevo.': 'Der Preis hat sich geändert. Bitte überprüfe den Betrag und bestätige erneut.',
  'Tu pago está procesándose. Actualiza Mi plan.': 'Deine Zahlung wird bearbeitet. Bitte aktualisiere Mein Plan.',
  'Administra la suscripción desde la tienda donde la contrataste.': 'Verwalte das Abonnement im Store, in dem du es gekauft hast.',
  'Has alcanzado el límite de tu plan. Conservas tus datos; revisa Mi plan para ampliar tu capacidad.': 'Du hast das Limit deines Plans erreicht. Deine Daten bleiben erhalten; besuche Mein Plan für mehr Kapazität.',
  'Cancela tu suscripción y espera a que termine antes de eliminar la cuenta. Adminístrala desde Mi plan o la tienda correspondiente.': 'Kündige dein Abonnement und warte dessen Ende ab, bevor du dein Konto löschst. Verwalte es unter Mein Plan oder im entsprechenden Store.',
  'Las compras Apple no están disponibles todavía': 'Apple-Käufe sind noch nicht verfügbar',
  'La validación Apple no está configurada': 'Apple-Validierung ist nicht konfiguriert',
  'La firma de la compra no es válida': 'Die Kaufsignatur ist ungültig',
  'La compra no pertenece a esta cuenta o producto': 'Der Kauf gehört nicht zu diesem Konto oder Produkt',
  'Producto incorrecto': 'Falsches Produkt',
  'La compra está vinculada a otra cuenta': 'Der Kauf ist mit einem anderen Konto verknüpft',
  'Compra de otra cuenta o producto': 'Kauf für ein anderes Konto oder Produkt',
  'Suscripción no encontrada': 'Abonnement nicht gefunden',
  'Las compras Google no están disponibles todavía': 'Google-Käufe sind noch nicht verfügbar',
  'Entorno de compra incorrecto': 'Falsche Kaufumgebung',
  'La compra no pertenece a esta cuenta': 'Der Kauf gehört nicht zu diesem Konto',
  'El pago está pendiente. Confírmalo en Google Play.': 'Zahlung steht aus. Bitte in Google Play bestätigen.',
  'Notificación inválida': 'Ungültige Benachrichtigung',
  'La firma de la notificación no es válida': 'Die Benachrichtigungssignatur ist ungültig',
  'Firma inválida': 'Ungültige Signatur',
  'Emisor inválido': 'Ungültiger Aussteller',
  'Paquete incorrecto': 'Falsches Paket',
  'Escribe el código': 'Gib den Code ein',
  'Este código no está disponible en este canal': 'Dieser Code ist auf diesem Kanal nicht verfügbar',
  'Entorno de pago incorrecto': 'Falsche Zahlungsumgebung',
  'Cuenta de suscripción inválida': 'Ungültiges Abonnementkonto',
  'Firma de pago inválida': 'Ungültige Zahlungssignatur',
  'Elige descuento porcentual o fijo': 'Wähle prozentualen oder festen Rabatt',
  'Código no encontrado': 'Code nicht gefunden',
  'Solo las cuentas Premium pueden crear listas avanzadas.': 'Nur Premium-Konten können erweiterte Listen erstellen.',
  'Esta herramienta solo está disponible en listas avanzadas.': 'Dieses Werkzeug ist nur in erweiterten Listen verfügbar.',
};
