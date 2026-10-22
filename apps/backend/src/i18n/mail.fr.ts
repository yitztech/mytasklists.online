import type { MailCopy } from './mail.types';

/**
 * Traduction française des e-mails transactionnels.
 */
export const MAIL_FR: MailCopy = {
  fallback: 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :',
  footer: 'Si vous n’êtes pas à l’origine de cette action, ignorez cet e-mail. MyTaskLists ne vous demandera jamais votre mot de passe par e-mail.',
  hello: 'Bonjour',
  verify: { subject: 'Confirmez votre adresse e-mail sur MyTaskLists', title: 'Confirmez votre adresse e-mail', action: 'Confirmer mon adresse e-mail', body: hours => `Pour terminer votre inscription, confirmez que cette adresse e-mail vous appartient. Le lien expire dans ${hours} heures.`, ignore: 'Si vous n’avez pas créé de compte, ignorez ce message.' },
  invite: { subject: inviter => `${inviter} vous a invité à une liste MyTaskLists`, title: 'Vous avez reçu une invitation', action: 'Créer un compte gratuit', body: (inviter, list, hours) => `${inviter} vous a invité à collaborer sur « ${list} ». Créez un compte gratuit avec cette adresse e-mail pour ouvrir la liste partagée. L’invitation expire dans ${hours} heures.` },
  reset: { subject: 'Réinitialisez votre mot de passe MyTaskLists', title: 'Réinitialisez votre mot de passe', action: 'Choisir un nouveau mot de passe', body: minutes => `Nous avons reçu une demande de modification de votre mot de passe. Le lien expire dans ${minutes} minutes et ne peut être utilisé qu’une fois.`, ignore: 'Si vous n’avez pas fait cette demande, ignorez cet e-mail : votre mot de passe actuel fonctionne toujours.' },
  password: { subject: 'Votre mot de passe MyTaskLists a été modifié', title: 'Votre mot de passe a été modifié', action: 'Ouvrir MyTaskLists', body: 'Votre mot de passe vient d’être modifié et nous avons fermé toutes vos sessions.', urgent: 'Si vous n’êtes pas à l’origine de cette action, récupérez immédiatement votre compte.' },
  mfa: { subject: enabled => `La validation en deux étapes a été ${enabled ? 'activée' : 'désactivée'}`, title: enabled => `Validation en deux étapes : ${enabled ? 'activée' : 'désactivée'}`, body: enabled => `La validation en deux étapes a été ${enabled ? 'activée' : 'désactivée'} pour votre compte. Si vous n’êtes pas à l’origine de cette action, changez immédiatement votre mot de passe.` },
  social: { subject: provider => `Votre compte ${provider} a été associé`, action: 'Créer un mot de passe', body: provider => `Vous vous êtes connecté avec ${provider} et nous l’avons associé à votre compte. Comme votre adresse e-mail n’avait pas encore été confirmée, nous avons désactivé l’ancien mot de passe et fermé les sessions ouvertes. Créez un nouveau mot de passe si vous souhaitez vous reconnecter avec un mot de passe.` },
  deleted: { subject: 'Votre compte MyTaskLists a été supprimé', title: 'Votre compte a été supprimé', body: 'Votre compte et ses données ont été supprimés, et nous vous avons déconnecté de tous vos appareils. Les listes que vous aviez créées ont aussi été supprimées pour les personnes avec lesquelles vous les partagiez. Merci d’avoir utilisé MyTaskLists.' },
  registration: { title: 'Terminez votre inscription', body: minutes => `Confirmez votre adresse e-mail pour créer votre compte. Ce lien expire dans ${minutes} minutes.` },
};
