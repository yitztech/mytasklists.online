# language: es
Característica: Validación de Longitud y Tipo de Caracteres en Nombres y Textos
  Como sistema seguro
  Quiero limitar el tamaño de campos de nombres, apellidos y textos
  Para proteger la integridad de la base de datos y evitar entradas maliciosas

  Escenario: Validación en frontend y backend de nombre con acentos y longitud adecuada (Éxito)
    Dado un usuario con nombre "Ángel Peña Müller" de 17 caracteres válidos
    Cuando envía los datos al formulario del frontend o a la API del backend
    Entonces la validación es exitosa tanto en cliente como en servidor

  Escenario: Rechazo en frontend y backend de nombres con caracteres HTML o inyecciones (Fracaso)
    Dado un formulario que recibe el nombre "<script>alert('xss')</script>"
    Cuando se evalúa la validación con la librería de validación
    Entonces la validación falla indicando caracteres no permitidos

  Escenario: Rechazo de nombres mayores a 100 caracteres en frontend y backend (Fracaso)
    Dado un nombre de 101 caracteres
    Cuando se intenta enviar al registro o actualización de perfil
    Entonces la validación falla por exceder la longitud máxima recomendada de 100 caracteres

  Escenario: Rechazo de productos con caracteres de control en el nombre (Fracaso)
    Dado un producto cuyo nombre contiene caracteres de control no imprimibles
    Cuando se intenta agregar a una lista de compras
    Entonces el frontend y backend rechazan la creación protegiendo la base de datos
