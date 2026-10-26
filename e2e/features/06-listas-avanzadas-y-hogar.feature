# language: es
Característica: Listas Normales vs. Avanzadas (Pilar Financiero, Hogar Premium, Entrada Inteligente y OCR)

  Escenario: Rechazo al intentar crear una lista avanzada con cuenta gratuita (Fracaso)
    Dado un usuario con plan "free"
    Cuando solicita crear una lista con tipo "advanced"
    Entonces el sistema responde con código 403 Forbidden indicando que solo cuentas Premium pueden crear listas avanzadas

  Escenario: Creación exitosa de lista avanzada con presupuesto y desbloqueo familiar Hogar Premium (Éxito)
    Dado una propietaria con suscripción "premium" activa
    Cuando crea una lista avanzada con presupuesto objetivo de 1500 MXN y la comparte con un invitado gratuito
    Entonces la lista avanzada se crea exitosamente
    Y el invitado hereda los beneficios de Hogar Premium dentro de esa lista compartida

  Escenario: Entrada inteligente local por voz o texto libre sin IA externa (Éxito)
    Dado una lista de compras avanzada activa
    Cuando el usuario ingresa "2 kg de tomate a $35, 1 l de leche en $28.50 y jabón cada 15 días"
    Entonces el parser determinista local crea 3 productos estructurados con sus cantidades, unidades, precios, recurrencia y pasillos

  Escenario: Conciliación local de ticket de supermercado OCR y ajuste automático de recurrencia (Éxito)
    Dado una lista avanzada con "Tomate saladet" y "Leche deslactosada" pendientes
    Cuando el usuario escanea y aplica el ticket con líneas "TOMATE SALADET 2KG 70.00" y "LECHE DESLACTOSADA 28.50"
    Entonces los productos coincidentes pasan a estado "purchased" con su último precio real pagado
    Y se ajusta automáticamente la frecuencia de recurrencia según el consumo real

  Escenario: Reordenamiento por arrastrar y soltar en listas normales y avanzadas (Éxito)
    Dado una lista con productos pendientes y comprados en orden inicial
    Cuando el usuario arrastra un producto a una nueva posición
    Entonces el sistema actualiza sortOrder y conserva el nuevo orden en todo tipo de listas
