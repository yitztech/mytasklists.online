import type { MailCopy } from './mail.types';

/**
 * Tradução para o português dos e-mails transacionais.
 */
export const MAIL_PT: MailCopy = {
  fallback: 'Se o botão não funcionar, copie este link no seu navegador:',
  footer: 'Se não foi você, ignore este e-mail. O MyTaskLists nunca pedirá sua senha por e-mail.',
  hello: 'Olá',
  verify: { subject: 'Confirme seu e-mail no MyTaskLists', title: 'Confirme seu e-mail', action: 'Confirmar meu e-mail', body: hours => `Para concluir seu cadastro, confirme que este e-mail é seu. O link expira em ${hours} horas.`, ignore: 'Se você não criou uma conta, ignore esta mensagem.' },
  invite: { subject: inviter => `${inviter} convidou você para uma lista do MyTaskLists`, title: 'Você recebeu um convite para uma lista', action: 'Criar conta grátis', body: (inviter, list, hours) => `${inviter} convidou você para colaborar em “${list}”. Crie uma conta grátis com este e-mail para abrir a lista compartilhada. O convite expira em ${hours} horas.` },
  reset: { subject: 'Redefina sua senha do MyTaskLists', title: 'Redefina sua senha', action: 'Escolher uma nova senha', body: minutes => `Recebemos uma solicitação para alterar sua senha. O link expira em ${minutes} minutos e só pode ser usado uma vez.`, ignore: 'Se você não fez essa solicitação, ignore este e-mail: sua senha atual continua funcionando.' },
  password: { subject: 'Sua senha do MyTaskLists foi alterada', title: 'Sua senha foi alterada', action: 'Ir para o MyTaskLists', body: 'Sua senha acaba de ser alterada e encerramos todas as suas sessões.', urgent: 'Se não foi você, recupere sua conta imediatamente.' },
  mfa: { subject: enabled => `A verificação em duas etapas foi ${enabled ? 'ativada' : 'desativada'}`, title: enabled => `Verificação em duas etapas: ${enabled ? 'ativada' : 'desativada'}`, body: enabled => `A verificação em duas etapas foi ${enabled ? 'ativada' : 'desativada'} na sua conta. Se não foi você, altere sua senha imediatamente.` },
  social: { subject: provider => `Vinculamos sua conta do ${provider}`, action: 'Criar uma senha', body: provider => `Você entrou com ${provider} e vinculamos o provedor à sua conta. Como seu e-mail ainda não tinha sido confirmado, desativamos a senha anterior e encerramos as sessões abertas. Se quiser entrar novamente com senha, crie uma nova.` },
  deleted: { subject: 'Sua conta do MyTaskLists foi excluída', title: 'Sua conta foi excluída', body: 'Sua conta e seus dados foram excluídos, e encerramos sua sessão em todos os dispositivos. As listas que você criou também foram excluídas para as pessoas com quem eram compartilhadas. Obrigado por usar o MyTaskLists.' },
  registration: { title: 'Conclua seu cadastro', body: minutes => `Confirme seu e-mail para criar sua conta. Este link expira em ${minutes} minutos.` },
};
