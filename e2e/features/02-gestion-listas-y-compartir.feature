# language: es
Característica: Gestión de Listas de Compras y Compartición
  Como usuario autenticado
  Quiero crear, personalizar y compartir listas de compras
  Para colaborar con otros miembros en tiempo real

  Escenario: Creación exitosa de una lista de compras con color e icono (Éxito)
    Dado un usuario autenticado con sesión activa
    Cuando crea una lista con el nombre "Despensa Quincenal", color "#28a745" e icono "🛒"
    Entonces la lista se crea correctamente en la base de datos con el usuario como propietario
    Y la lista aparece en la colección de listas del usuario

  Escenario: Fallo al crear una lista con nombre menor a 2 caracteres o mayor a 120 (Fracaso)
    Dado un usuario autenticado con sesión activa
    Cuando intenta crear una lista con un nombre de solo 1 caracter "A"
    Entonces el sistema rechaza la creación de la lista con código 400

  Escenario: Compartir lista con otro usuario registrado y asignación de rol (Éxito)
    Dado una propietaria con una lista "Despensa Quincenal"
    Y otro usuario registrado con correo "companero@example.com"
    Cuando la propietaria comparte la lista con "companero@example.com" asignando rol "editor"
    Entonces el usuario invitado se convierte en miembro activo de la lista
    Y puede ver y editar los productos de la lista compartida

  Escenario: Fallo al intentar acceder a una lista privada sin membresía (Fracaso)
    Dado una lista privada perteneciente a otro usuario
    Cuando un usuario no miembro intenta consultar el detalle de la lista
    Entonces el sistema responde con código 403 Forbidden y deniega el acceso
