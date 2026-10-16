# language: es
Característica: Cancelaciones, Bajas y Revocaciones
  Como usuario del sistema
  Quiero poder cancelar compras, revocar invitaciones, eliminar listas y dar de baja mi cuenta
  Para mantener mis datos bajo control y limpiar información innecesaria

  Escenario: Cancelar y desmarcar todos los productos comprados (Éxito)
    Dado una lista con varios productos en la sección de comprados
    Cuando el usuario solicita vaciar o limpiar los comprados
    Entonces los productos comprados son archivados de la vista activa

  Escenario: Cancelar la membresía de un integrante en una lista compartida (Éxito)
    Dado una lista compartida con un integrante adicional
    Cuando la propietaria retira al integrante de la lista
    Entonces la membresía se revoca inmediatamente
    Y el ex-integrante pierde el acceso a la lista y a sus salas de tiempo real

  Escenario: Eliminar lista de compras completa por su dueña (Éxito)
    Dado una propietaria con una lista de compras
    Cuando la propietaria solicita eliminar definitivamente la lista
    Entonces la lista se elimina junto con todos sus productos en cascada

  Escenario: Fallo al intentar eliminar una lista sin ser el propietario (Fracaso)
    Dado un usuario con rol de editor en una lista que no le pertenece
    Cuando el usuario intenta ejecutar la eliminación de la lista
    Entonces el sistema responde con código 403 Forbidden impidiendo la acción

  Escenario: Baja y cancelación definitiva de cuenta de usuario con contraseña correcta (Éxito)
    Dado un usuario registrado con contraseña
    Cuando solicita la baja de su cuenta enviando su contraseña actual
    Entonces el sistema elimina la cuenta, revoca todos los tokens y cierra la sesión

  Escenario: Fallo en la baja de cuenta cuando se envía contraseña incorrecta (Fracaso)
    Dado un usuario registrado con contraseña
    Cuando intenta solicitar la baja de su cuenta con una contraseña equivocada
    Entonces el sistema responde con código 401 Unauthorized y conserva la cuenta intacta
