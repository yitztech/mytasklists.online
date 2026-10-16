# language: es
Característica: Registro y Autenticación de Usuarios
  Como usuario del sistema MyTaskLists
  Quiero registrarme e iniciar sesión
  Para gestionar mis listas de compras sincronizadas

  Escenario: Registro exitoso con nombre válido, correo, WhatsApp y contraseña (Éxito)
    Dado que un usuario nuevo tiene el nombre "Ana López García" de 16 caracteres válidos
    Y un correo electrónico único "ana.nuevo@example.com"
    Y un número de WhatsApp válido "+5215512345678"
    Y una contraseña segura de al menos 8 caracteres "PasswordSegura123"
    Cuando solicita y completa el registro en el sistema
    Entonces la cuenta se crea exitosamente con estado activo
    Y el usuario recibe su par de tokens de acceso y actualización

  Escenario: Fallo de registro por nombre con longitud menor a la recomendada o caracteres inválidos (Fracaso)
    Dado que un usuario intenta registrarse con el nombre "A" de solo 1 carácter
    Cuando envía la solicitud de registro al sistema
    Entonces el sistema rechaza el registro con código 400
    Y muestra el error de validación indicando la longitud mínima requerida

  Escenario: Fallo de registro por caracteres no permitidos en el nombre (Fracaso)
    Dado que un usuario intenta registrarse con el nombre "<script>alert(1)</script>"
    Cuando envía la solicitud de registro al sistema
    Entonces el sistema rechaza el registro con código 400
    Y notifica que el nombre contiene caracteres no válidos

  Escenario: Fallo de registro por correo electrónico duplicado (Fracaso)
    Dado que ya existe un usuario registrado con el correo "registrado@example.com"
    Cuando otro usuario intenta registrarse con el mismo correo "registrado@example.com"
    Entonces el sistema impide la duplicación protegiendo la unicidad en la base de datos

  Escenario: Inicio de sesión exitoso con credenciales correctas (Éxito)
    Dado un usuario registrado con correo "ana.nuevo@example.com" y contraseña "PasswordSegura123"
    Cuando envía sus credenciales al endpoint de login
    Entonces el sistema responde con código 200 y sesión iniciada

  Escenario: Fallo de inicio de sesión con credenciales erróneas (Fracaso)
    Dado un usuario con correo "ana.nuevo@example.com"
    Cuando intenta iniciar sesión con una contraseña incorrecta "ClaveErronea99"
    Entonces el sistema responde con código 401 y deniega el acceso
