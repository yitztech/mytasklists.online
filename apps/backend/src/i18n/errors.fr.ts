/**
 * Traduction française des messages d'erreur.
 */
export const ERRORS_FR: Record<string, string> = {
  'Ocurrió un error inesperado': 'Une erreur inattendue est survenue',

  // Authentification et session
  'Correo o contraseña incorrectos': 'E-mail ou mot de passe incorrect',
  'Demasiados intentos fallidos con este correo. Espera unos minutos o restablece tu contraseña.':
    'Trop de tentatives échouées avec cet e-mail. Patientez quelques minutes ou réinitialisez votre mot de passe.',
  'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.':
    'Trop de requêtes. Veuillez patienter un instant et réessayer.',
  'Ya existe una cuenta con este correo electrónico': 'Un compte existe déjà avec cette adresse e-mail',
  'Ya existe una cuenta con este correo y el proveedor no confirmó que te pertenece. Inicia sesión con tu contraseña.':
    'Un compte existe déjà avec cet e-mail et le fournisseur n’a pas confirmé qu’il vous appartient. Connectez-vous avec votre mot de passe.',
  'La cuenta está desactivada': 'Ce compte est désactivé',
  'Usuario no encontrado': 'Utilisateur introuvable',
  'Falta el token de acceso': 'Jeton d’accès manquant',
  'Falta el refresh token': 'Jeton d’actualisation manquant',
  'Token inválido o expirado': 'Jeton invalide ou expiré',
  'Tipo de token inválido': 'Type de jeton invalide',
  'El refresh token no es válido o ya expiró': 'Le jeton d’actualisation est invalide ou expiré',
  'La sesión ya fue cerrada': 'La session a déjà été fermée',
  'La sesión ya no es válida': 'La session n’est plus valide',
  'La sesión ya no es válida. Vuelve a iniciar sesión.': 'La session n’est plus valide. Veuillez vous reconnecter.',
  'No cuentas con permisos para esta operación': 'Vous n’avez pas les autorisations nécessaires pour cette opération',
  'Tu correo ya está verificado': 'Votre adresse e-mail est déjà confirmée',
  'El enlace no es válido o ya expiró': 'Le lien est invalide ou expiré',
  'Debes indicar tu contraseña actual': 'Veuillez saisir votre mot de passe actuel',
  'La contraseña actual no es correcta': 'Votre mot de passe actuel est incorrect',
  'Esta versión de la app ya no es compatible. Actualízala para seguir usándola.':
    'Cette version de l’application n’est plus compatible. Mettez-la à jour pour continuer à l’utiliser.',

  // Validation en deux étapes
  'El código no es correcto': 'Le code est incorrect',
  'Activa la verificación en dos pasos para usar el panel de administración':
    'Activez la validation en deux étapes pour utiliser le panneau d’administration',
  'Las cuentas de administración deben mantener la verificación en dos pasos':
    'Les comptes administrateurs doivent conserver la validation en deux étapes active',
  'El token de notificaciones no es válido': 'Le jeton de notification est invalide',
  'Escribe tu contraseña para eliminar la cuenta': 'Saisissez votre mot de passe pour supprimer le compte',
  'La contraseña no es correcta': 'Le mot de passe est incorrect',
  'El código de verificación no es correcto': 'Le code de vérification est incorrect',
  'Demasiados códigos incorrectos. Vuelve a iniciar sesión.': 'Trop de codes incorrects. Veuillez vous reconnecter.',
  'El inicio de sesión expiró. Vuelve a empezar.': 'La connexion a expiré. Veuillez recommencer.',
  'El alta expiró. Vuelve a generar el código QR.': 'La configuration a expiré. Veuillez générer à nouveau le code QR.',
  'La verificación en dos pasos ya está activa': 'La validation en deux étapes est déjà active',

  // Google et Apple
  'El inicio de sesión con Google no está configurado': 'La connexion avec Google n’est pas configurée',
  'Sign in with Apple no está configurado': 'Sign in with Apple n’est pas configuré',
  'El inicio de sesión con Google no está configurado (define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET)':
    'La connexion avec Google n’est pas configurée (définissez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET)',
  'Sign in with Apple no está configurado (define APPLE_CLIENT_ID, APPLE_TEAM_ID y APPLE_KEY_ID)':
    'Sign in with Apple n’est pas configuré (définissez APPLE_CLIENT_ID, APPLE_TEAM_ID et APPLE_KEY_ID)',
  'No fue posible completar el inicio de sesión con Google': 'Impossible de finaliser la connexion avec Google',
  'No fue posible completar el inicio de sesión con Apple': 'Impossible de finaliser la connexion avec Apple',
  'El parámetro state no es válido o ya expiró': 'Le paramètre state est invalide ou expiré',
  'Google no devolvió un id_token': 'Google n’a renvoyé aucun id_token',
  'Apple no devolvió un identityToken': 'Apple n’a renvoyé aucun identityToken',
  'El token de Google no es válido': 'Le jeton Google est invalide',
  'El token de Apple no es válido': 'Le jeton Apple est invalide',
  'El token de Google no corresponde a este inicio de sesión': 'Le jeton Google ne correspond pas à cette connexion',
  'El token de Apple no corresponde a este inicio de sesión': 'Le jeton Apple ne correspond pas à cette connexion',
  'La cuenta de Google no expone una identidad válida': 'Le compte Google ne fournit pas d’identité valide',
  'La cuenta de Google no expone un correo electrónico': 'Le compte Google ne partage aucune adresse e-mail',

  // Validation de formulaires
  'El nombre completo debe tener entre 3 y 160 caracteres': 'Le nom complet doit comporter entre 3 et 160 caractères',
  'El correo electrónico no es válido': 'L’adresse e-mail n’est pas valide',
  'El número de WhatsApp no es válido': 'Le numéro WhatsApp n’est pas valide',
  'La contraseña debe tener al menos 8 caracteres': 'Le mot de passe doit comporter au moins 8 caractères',
  'La contraseña no puede superar 128 caracteres': 'Le mot de passe ne peut pas dépasser 128 caractères',
  'La contraseña es obligatoria': 'Le mot de passe est obligatoire',
  'El avatar debe ser una URL https': 'L’avatar doit être une URL https',
  'Los días de recurrencia deben ser un número entero': 'Les jours de récurrence doivent être un nombre entier',
  'La recurrencia mínima es de 1 día': 'L’intervalle de récurrence minimal est de 1 jour',
  'La recurrencia máxima es de 365 días': 'L’intervalle de récurrence maximal est de 365 jours',
  'Indica cada cuántos días debe volver a aparecer el producto': 'Indiquez tous les combien de jours l’article doit réapparaître',
  '`days` debe ser un número entre 1 y 3650': '`days` doit être un nombre compris entre 1 et 3650',

  // Listes et articles
  'La lista no existe': 'La liste n’existe pas',
  'La lista no existe o no tienes acceso a ella': 'La liste n’existe pas ou vous n’y avez pas accès',
  'Solo puedes consultar esta lista': 'Vous pouvez uniquement consulter cette liste',
  'Esta lista ya es tuya': 'Cette liste vous appartient déjà',
  'El producto no existe': 'L’article n’existe pas',
  'Ese producto ya está en la lista': 'Cet article est déjà dans la liste',
  'Ese producto ya está en la lista como comprado. Regrésalo a pendientes en lugar de agregarlo otra vez.':
    'Cet article est déjà marqué comme acheté. Remettez-le dans les articles à acheter au lieu de l’ajouter à nouveau.',
  'Ese producto ya está en la lista y volverá a aparecer cuando toque según su recurrencia':
    'Cet article est déjà dans la liste et réapparaîtra selon son cycle de récurrence',
  'Indica el correo o el id de la persona': 'Indiquez l’adresse e-mail ou l’identifiant de la personne',
  'No encontramos a esa persona. Debe registrarse antes de que puedas compartirle la lista.':
    'Personne introuvable. Elle doit s’inscrire avant que vous puissiez partager la liste avec elle.',
  'Esa persona ya forma parte de la lista': 'Cette personne fait déjà partie de la liste',
  'Esa persona no forma parte de la lista': 'Cette personne ne fait pas partie de la liste',
  'Solo la persona propietaria puede hacer esto': 'Seul le propriétaire peut effectuer cette action',
  'Solo la persona propietaria puede cambiar los roles': 'Seul le propriétaire peut modifier les rôles',
  'Solo la persona propietaria puede modificar a otros integrantes': 'Seul le propriétaire peut modifier d’autres membres',
  'Solo la persona propietaria puede quitar integrantes': 'Seul le propriétaire peut retirer des membres',
  'No puedes quitarle la propiedad a quien creó la lista': 'Vous ne pouvez pas retirer la propriété au créateur de la liste',
  'La persona propietaria no puede salirse de la lista; primero elimínala o transfiérela':
    'Le propriétaire ne peut pas quitter la liste ; veuillez d’abord la supprimer ou la transférer',

  // Administration et utilitaires
  'No puedes desactivar tu propia cuenta': 'Vous ne pouvez pas désactiver votre propre compte',
  'Esta utilidad está deshabilitada en producción': 'Cet utilitaire est désactivé en production',

  // Messages de retour informatifs
  'Si el correo está registrado te enviamos un enlace para restablecer la contraseña.':
    'Si l’adresse e-mail est enregistrée, nous vous avons envoyé un lien pour réinitialiser votre mot de passe.',
  'La suscripción al boletín no está disponible': 'L’inscription à la newsletter n’est pas disponible',
  'No se pudo completar la suscripción. Inténtalo más tarde.': 'Impossible de finaliser l’inscription. Veuillez réessayer plus tard.',

  'El código ya existe': 'Le code existe déjà',
  'La fecha de caducidad debe ser futura': 'La date d’expiration doit être dans le futur',
  'Espera antes de solicitar otro enlace': 'Veuillez patienter avant de demander un autre lien',
  'Demasiadas solicitudes. Inténtalo más tarde.': 'Trop de demandes. Veuillez réessayer plus tard.',
  'No se pudo enviar el enlace. Inténtalo de nuevo más tarde.': 'Impossible d’envoyer le lien. Veuillez réessayer plus tard.',
  'Las contraseñas no coinciden': 'Les mots de passe ne correspondent pas',
  'La contraseña no puede superar 72 bytes': 'Le mot de passe ne peut pas dépasser 72 octets',
  'La suscripción de pago todavía no está disponible. Puedes continuar gratis.': 'Les abonnements payants ne sont pas encore disponibles. Vous pouvez continuer gratuitement.',
  'El precio de la suscripción no está disponible.': 'Le tarif de l’abonnement n’est pas disponible.',
  'El código no es válido o ya expiró': 'Le code est invalide ou expiré',
  'El código no tiene descuento disponible': 'Ce code ne comporte aucune réduction disponible',
  'Este código no está disponible para tu cuenta o plan': 'Ce code n’est pas disponible pour votre compte ou formule',
  'Ya tienes Premium. Administra tu suscripción actual.': 'Vous avez déjà l’offre Premium. Gérez votre abonnement en cours.',
  'El precio cambió. Revisa el importe y confirma de nuevo.': 'Le tarif a changé. Vérifiez le montant et confirmez à nouveau.',
  'Tu pago está procesándose. Actualiza Mi plan.': 'Votre paiement est en cours de traitement. Actualisez Mon forfait.',
  'Administra la suscripción desde la tienda donde la contrataste.': 'Gérez l’abonnement dans la boutique où vous l’avez souscrit.',
  'Has alcanzado el límite de tu plan. Conservas tus datos; revisa Mi plan para ampliar tu capacidad.': 'Vous avez atteint la limite de votre formule. Vos données sont conservées ; consultez Mon forfait pour augmenter votre capacité.',
  'Cancela tu suscripción y espera a que termine antes de eliminar la cuenta. Adminístrala desde Mi plan o la tienda correspondiente.': 'Résiliez votre abonnement et attendez son expiration avant de supprimer votre compte. Gérez-le depuis Mon forfait ou la boutique correspondante.',
  'Las compras Apple no están disponibles todavía': 'Les achats Apple ne sont pas encore disponibles',
  'La validación Apple no está configurada': 'La validation Apple n’est pas configurée',
  'La firma de la compra no es válida': 'La signature de l’achat est invalide',
  'La compra no pertenece a esta cuenta o producto': 'L’achat n’appartient pas à ce compte ou produit',
  'Producto incorrecto': 'Produit incorrect',
  'La compra está vinculada a otra cuenta': 'L’achat est associé à un autre compte',
  'Compra de otra cuenta o producto': 'Achat lié à un autre compte ou produit',
  'Suscripción no encontrada': 'Abonnement introuvable',
  'Las compras Google no están disponibles todavía': 'Les achats Google ne sont pas encore disponibles',
  'Entorno de compra incorrecto': 'Environnement d’achat incorrect',
  'La compra no pertenece a esta cuenta': 'L’achat n’appartient pas à ce compte',
  'El pago está pendiente. Confírmalo en Google Play.': 'Paiement en attente. Veuillez le confirmer sur Google Play.',
  'Notificación inválida': 'Notification invalide',
  'La firma de la notificación no es válida': 'La signature de la notification est invalide',
  'Firma inválida': 'Signature invalide',
  'Emisor inválido': 'Émetteur invalide',
  'Paquete incorrecto': 'Package incorrect',
  'Escribe el código': 'Saisissez le code',
  'Este código no está disponible en este canal': 'Ce code n’est pas disponible sur ce canal',
  'Entorno de pago incorrecto': 'Environnement de paiement incorrect',
  'Cuenta de suscripción inválida': 'Compte d’abonnement invalide',
  'Firma de pago inválida': 'Signature de paiement invalide',
  'Elige descuento porcentual o fijo': 'Choisissez une réduction en pourcentage ou un montant fixe',
  'Código no encontrado': 'Code introuvable',
};
