# language: es
Característica: Productos, Citas y Motor de Recurrencia
  Como integrante de una lista
  Quiero agregar productos puntuales y recurrentes
  Para no olvidar comprar productos necesarios y recibir avisos programados

  Escenario: Agregar producto puntual a la lista con cantidad decimal y unidad (Éxito)
    Dado una lista de compras existente
    Cuando el usuario agrega el producto "Manzanas Gala" con cantidad "1.50" y unidad "kg"
    Entonces el producto queda guardado en la sección de pendientes de la lista
    Y la cantidad se almacena con precisión de hasta dos decimales

  Escenario: Agregar producto recurrente con cita de vencimiento programada (Éxito)
    Dado una lista de compras existente
    Cuando el usuario agrega el producto "Café en Grano" con recurrencia de 14 días
    Entonces el producto se registra con indicador de recurrencia activo
    Y se calcula la cita de vencimiento para dentro de 14 días a partir de la activación

  Escenario: Fallo al agregar producto recurrente sin especificar días válidos (Fracaso)
    Dado una lista de compras existente
    Cuando el usuario intenta agregar un producto recurrente indicando 0 días o más de 365 días
    Entonces el sistema rechaza la solicitud indicando que la recurrencia debe ser entre 1 y 365 días

  Escenario: Marcar producto como comprado y programar cita de reactivación (Éxito)
    Dado un producto recurrente "Café en Grano" en estado pendiente
    Cuando el usuario marca el producto como comprado
    Entonces el producto pasa al estado "purchased" tachado
    Y el motor de recurrencia programa la próxima fecha de reactivación sumando los días correspondientes

  Escenario: Deshacer compra (cancelar compra) regresando el producto a pendientes (Éxito)
    Dado un producto en la lista de comprados
    Cuando el usuario presiona deshacer o desmarcar la compra
    Entonces el producto regresa de inmediato a la sección de pendientes
    Y se cancela la programación futura de reactivación
