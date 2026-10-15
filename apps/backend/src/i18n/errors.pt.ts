/**
 * Tradução para o português das mensagens de erro.
 */
export const ERRORS_PT: Record<string, string> = {
  'Ocurrió un error inesperado': 'Ocorreu um erro inesperado',

  // Autenticação e sessão
  'Correo o contraseña incorrectos': 'E-mail ou senha incorretos',
  'Demasiados intentos fallidos con este correo. Espera unos minutos o restablece tu contraseña.':
    'Muitas tentativas falhas com este e-mail. Aguarde alguns minutos ou redefina sua senha.',
  'Demasiadas peticiones. Espera un momento y vuelve a intentarlo.':
    'Muitas requisições. Aguarde um momento e tente novamente.',
  'Ya existe una cuenta con este correo electrónico': 'Já existe uma conta com este e-mail',
  'Ya existe una cuenta con este correo y el proveedor no confirmó que te pertenece. Inicia sesión con tu contraseña.':
    'Já existe uma conta com este e-mail e o provedor não confirmou que pertence a você. Entre com sua senha.',
  'La cuenta está desactivada': 'Esta conta está desativada',
  'Usuario no encontrado': 'Usuário não encontrado',
  'Falta el token de acceso': 'Token de acesso ausente',
  'Falta el refresh token': 'Token de atualização ausente',
  'Token inválido o expirado': 'Token inválido ou expirado',
  'Tipo de token inválido': 'Tipo de token inválido',
  'El refresh token no es válido o ya expiró': 'O token de atualização é inválido ou já expirou',
  'La sesión ya fue cerrada': 'A sessão já foi encerrada',
  'La sesión ya no es válida': 'A sessão não é mais válida',
  'La sesión ya no es válida. Vuelve a iniciar sesión.': 'A sessão não é mais válida. Entre novamente.',
  'No cuentas con permisos para esta operación': 'Você não tem permissão para esta operação',
  'Tu correo ya está verificado': 'Seu e-mail já está verificado',
  'El enlace no es válido o ya expiró': 'O link é inválido ou já expirou',
  'Debes indicar tu contraseña actual': 'Digite sua senha atual',
  'La contraseña actual no es correcta': 'Sua senha atual está incorreta',
  'Esta versión de la app ya no es compatible. Actualízala para seguir usándola.':
    'Esta versão do aplicativo não é mais compatível. Atualize-o para continuar usando.',

  // Verificação em duas etapas
  'El código no es correcto': 'O código está incorreto',
  'Activa la verificación en dos pasos para usar el panel de administración':
    'Ative a verificação em duas etapas para usar o painel de administração',
  'Las cuentas de administración deben mantener la verificación en dos pasos':
    'As contas de administração devem manter a verificação em duas etapas',
  'El token de notificaciones no es válido': 'O token de notificações é inválido',
  'Escribe tu contraseña para eliminar la cuenta': 'Digite sua senha para excluir a conta',
  'La contraseña no es correcta': 'A senha está incorreta',
  'El código de verificación no es correcto': 'O código de verificação está incorreto',
  'Demasiados códigos incorrectos. Vuelve a iniciar sesión.': 'Muitos códigos incorretos. Entre novamente.',
  'El inicio de sesión expiró. Vuelve a empezar.': 'O login expirou. Tente novamente do início.',
  'El alta expiró. Vuelve a generar el código QR.': 'A configuração expirou. Gere o código QR novamente.',
  'La verificación en dos pasos ya está activa': 'A verificação em duas etapas já está ativa',

  // Google e Apple
  'El inicio de sesión con Google no está configurado': 'O login com o Google não está configurado',
  'Sign in with Apple no está configurado': 'O Sign in with Apple não está configurado',
  'El inicio de sesión con Google no está configurado (define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET)':
    'O login com o Google não está configurado (defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET)',
  'Sign in with Apple no está configurado (define APPLE_CLIENT_ID, APPLE_TEAM_ID y APPLE_KEY_ID)':
    'O Sign in with Apple não está configurado (defina APPLE_CLIENT_ID, APPLE_TEAM_ID e APPLE_KEY_ID)',
  'No fue posible completar el inicio de sesión con Google': 'Não foi possível concluir o login com o Google',
  'No fue posible completar el inicio de sesión con Apple': 'Não foi possível concluir o login com a Apple',
  'El parámetro state no es válido o ya expiró': 'O parâmetro state é inválido ou já expirou',
  'Google no devolvió un id_token': 'O Google não retornou um id_token',
  'Apple no devolvió un identityToken': 'A Apple não retornou um identityToken',
  'El token de Google no es válido': 'O token do Google é inválido',
  'El token de Apple no es válido': 'O token da Apple é inválido',
  'El token de Google no corresponde a este inicio de sesión': 'O token do Google não corresponde a este login',
  'El token de Apple no corresponde a este inicio de sesión': 'O token da Apple não corresponde a este login',
  'La cuenta de Google no expone una identidad válida': 'A conta do Google não fornece uma identidade válida',
  'La cuenta de Google no expone un correo electrónico': 'A conta do Google não compartilha um e-mail',

  // Validação de formulários
  'El nombre completo debe tener entre 3 y 160 caracteres': 'O nome completo deve ter entre 3 e 160 caracteres',
  'El correo electrónico no es válido': 'O endereço de e-mail é inválido',
  'El número de WhatsApp no es válido': 'O número de WhatsApp é inválido',
  'La contraseña debe tener al menos 8 caracteres': 'A senha deve ter pelo menos 8 caracteres',
  'La contraseña no puede superar 128 caracteres': 'A senha não pode ultrapassar 128 caracteres',
  'La contraseña es obligatoria': 'A senha é obrigatória',
  'El avatar debe ser una URL https': 'O avatar deve ser uma URL https',
  'Los días de recurrencia deben ser un número entero': 'Os dias de recorrência devem ser um número inteiro',
  'La recurrencia mínima es de 1 día': 'O intervalo mínimo de recorrência é de 1 dia',
  'La recurrencia máxima es de 365 días': 'O intervalo máximo de recorrência é de 365 dias',
  'Indica cada cuántos días debe volver a aparecer el producto': 'Informe a cada quantos dias o produto deve reaparecer',
  '`days` debe ser un número entre 1 y 3650': '`days` deve ser um número entre 1 e 3650',

  // Listas e itens
  'La lista no existe': 'A lista não existe',
  'La lista no existe o no tienes acceso a ella': 'A lista não existe ou você não tem acesso a ela',
  'Solo puedes consultar esta lista': 'Você só pode visualizar esta lista',
  'Esta lista ya es tuya': 'Esta lista já pertence a você',
  'El producto no existe': 'O item não existe',
  'Ese producto ya está en la lista': 'Esse item já está na lista',
  'Ese producto ya está en la lista como comprado. Regrésalo a pendientes en lugar de agregarlo otra vez.':
    'Esse item já está na lista como comprado. Mova-o de volta para pendentes em vez de adicionar novamente.',
  'Ese producto ya está en la lista y volverá a aparecer cuando toque según su recurrencia':
    'Esse item já está na lista e voltará a aparecer quando vencer a recorrência',
  'Indica el correo o el id de la persona': 'Informe o e-mail ou id da pessoa',
  'No encontramos a esa persona. Debe registrarse antes de que puedas compartirle la lista.':
    'Não encontramos essa pessoa. Ela precisa se cadastrar antes que você possa compartilhar a lista.',
  'Esa persona ya forma parte de la lista': 'Essa pessoa já faz parte da lista',
  'Esa persona no forma parte de la lista': 'Essa pessoa não faz parte da lista',
  'Solo la persona propietaria puede hacer esto': 'Apenas o proprietário pode fazer isso',
  'Solo la persona propietaria puede cambiar los roles': 'Apenas o proprietário pode alterar funções',
  'Solo la persona propietaria puede modificar a otros integrantes': 'Apenas o proprietário pode modificar outros integrantes',
  'Solo la persona propietaria puede quitar integrantes': 'Apenas o proprietário pode remover integrantes',
  'No puedes quitarle la propiedad a quien creó la lista': 'Você não pode retirar a propriedade de quem criou a lista',
  'La persona propietaria no puede salirse de la lista; primero elimínala o transfiérela':
    'O proprietário não pode sair da lista; exclua-a ou transfira-a primeiro',

  // Administração e utilitários
  'No puedes desactivar tu propia cuenta': 'Você não pode desativar sua própria conta',
  'Esta utilidad está deshabilitada en producción': 'Este utilitário está desativado em produção',

  // Respostas corretas com texto
  'Si el correo está registrado te enviamos un enlace para restablecer la contraseña.':
    'Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha.',
  'La suscripción al boletín no está disponible': 'A assinatura da newsletter não está disponível',
  'No se pudo completar la suscripción. Inténtalo más tarde.': 'Não foi possível concluir a assinatura. Tente mais tarde.',

  'El código ya existe': 'O código já existe',
  'La fecha de caducidad debe ser futura': 'A data de expiração deve ser no futuro',
  'Espera antes de solicitar otro enlace': 'Aguarde antes de solicitar outro link',
  'Demasiadas solicitudes. Inténtalo más tarde.': 'Muitas solicitações. Tente novamente mais tarde.',
  'No se pudo enviar el enlace. Inténtalo de nuevo más tarde.': 'Não foi possível enviar o link. Tente novamente mais tarde.',
  'Las contraseñas no coinciden': 'As senhas não coincidem',
  'La contraseña no puede superar 72 bytes': 'A senha não pode exceder 72 bytes',
  'La suscripción de pago todavía no está disponible. Puedes continuar gratis.': 'Assinaturas pagas ainda não estão disponíveis. Você pode continuar grátis.',
  'El precio de la suscripción no está disponible.': 'O preço da assinatura não está disponível.',
  'El código no es válido o ya expiró': 'O código é inválido ou já expirou',
  'El código no tiene descuento disponible': 'O código não possui desconto disponível',
  'Este código no está disponible para tu cuenta o plan': 'Este código não está disponível para sua conta ou plano',
  'Ya tienes Premium. Administra tu suscripción actual.': 'Você já tem o Premium. Gerencie sua assinatura atual.',
  'El precio cambió. Revisa el importe y confirma de nuevo.': 'O preço mudou. Revise o valor e confirme novamente.',
  'Tu pago está procesándose. Actualiza Mi plan.': 'Seu pagamento está sendo processado. Atualize Meu plano.',
  'Administra la suscripción desde la tienda donde la contrataste.': 'Gerencie a assinatura na loja onde ela foi adquirida.',
  'Has alcanzado el límite de tu plan. Conservas tus datos; revisa Mi plan para ampliar tu capacidad.': 'Você atingiu o limite do seu plano. Seus dados estão salvos; acesse Meu plano para aumentar a capacidade.',
  'Cancela tu suscripción y espera a que termine antes de eliminar la cuenta. Adminístrala desde Mi plan o la tienda correspondiente.': 'Cancele sua assinatura e aguarde o término antes de excluir a conta. Gerencie-a em Meu plano ou na loja correspondente.',
  'Las compras Apple no están disponibles todavía': 'Compras Apple ainda não estão disponíveis',
  'La validación Apple no está configurada': 'A validação Apple não está configurada',
  'La firma de la compra no es válida': 'A assinatura da compra é inválida',
  'La compra no pertenece a esta cuenta o producto': 'A compra não pertence a esta conta ou produto',
  'Producto incorrecto': 'Produto incorreto',
  'La compra está vinculada a otra cuenta': 'A compra está vinculada a outra conta',
  'Compra de otra cuenta o producto': 'Compra vinculada a outra conta ou produto',
  'Suscripción no encontrada': 'Assinatura não encontrada',
  'Las compras Google no están disponibles todavía': 'Compras Google ainda não estão disponíveis',
  'Entorno de compra incorrecto': 'Ambiente de compra incorreto',
  'La compra no pertenece a esta cuenta': 'A compra não pertence a esta conta',
  'El pago está pendiente. Confírmalo en Google Play.': 'O pagamento está pendente. Confirme-o no Google Play.',
  'Notificación inválida': 'Notificação inválida',
  'La firma de la notificación no es válida': 'A assinatura da notificação é inválida',
  'Firma inválida': 'Assinatura inválida',
  'Emisor inválido': 'Emissor inválido',
  'Paquete incorrecto': 'Pacote incorreto',
  'Escribe el código': 'Digite o código',
  'Este código no está disponible en este canal': 'Este código não está disponível neste canal',
  'Entorno de pago incorrecto': 'Ambiente de pagamento incorreto',
  'Cuenta de suscripción inválida': 'Conta de assinatura inválida',
  'Firma de pago inválida': 'Assinatura de pagamento inválida',
  'Elige descuento porcentual o fijo': 'Escolha desconto percentual ou fixo',
  'Código no encontrado': 'Código não encontrado',
};
