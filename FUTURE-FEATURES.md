# Visión de Negocio, Monetización y Hoja de Ruta (FUTURE-FEATURES)

> **Posicionamiento estratégico:** Evolucionar **MyTaskLists** de una lista de compras compartida a un **Sistema Inteligente de Abastecimiento y Ahorro Familiar (Smart Household Restock & Budget)** para el mercado de Norteamérica (México, EE. UU. y Canadá) y pequeños negocios.

---

## 1. Base Técnica Actual

El proyecto ya cuenta con los pilares de infraestructura más complejos:
- **Sincronización en tiempo real** mediante WebSockets entre múltiples dispositivos.
- **Motor de recurrencia automática** (`apps/backend/src/modules/items/items.service.ts`) que reactiva productos cíclicos.
- **Soporte de imágenes de productos** (`apps/backend/src/modules/items/item-image.storage.ts`).
- **Arquitectura multilingüe** (`packages/contracts/locales.js`) preparada para Español, Inglés y Francés, con soporte de unidades métricas e imperiales (`kg`, `g`, `l`, `ml`, `lb`, `oz`, `pza`, `bolsas`).
- **Infraestructura de suscripciones y facturación** (`apps/backend/src/modules/billing/billing.service.ts`) para Web (Stripe), iOS y Android.

---

## 2. Oportunidad de Mercado en Norteamérica (México, EE. UU. y Canadá)

El principal dolor de los hogares en los tres países es **la inflación en el supermercado, el desperdicio por compras duplicadas y la carga mental de administrar el hogar**:

### Estados Unidos y Canadá (Alto ARPU y capacidad de pago)
- **Ahorro directo:** Las familias gastan entre **$800 y $1,400 USD al mes** en supermercado y desechan cerca del 25% por falta de planificación o compras duplicadas. Una suscripción de **$4.99 USD/mes** (o **$39.99 USD/año**) que evite olvidar o duplicar un par de productos al mes se paga sola múltiples veces.
- **Ventaja demográfica y bilingüe:**
  - En **EE. UU.** existen más de **65 millones de hispanos**, muchos en hogares bilingües o multigeneracionales donde conviven el español y el inglés, así como unidades métricas e imperiales.
  - En **Canadá**, el soporte nativo **Inglés / Francés** y la cultura de optimización del presupuesto familiar ofrecen una barrera de entrada frente a competidores monolingües.

### México (Crecimiento viral + Nicho Prosumer / B2B ligero)
- **Adquisición orgánica:** La coordinación familiar suele hacerse en grupos de WhatsApp donde los encargos se pierden entre mensajes.
- **Segmento Prosumer y PyME:** Existe un mercado muy amplio de **anfitriones de Airbnb, cafeterías, consultorios, restaurantes pequeños y oficinas** que requieren listas de reabastecimiento recurrente compartidas con su personal de limpieza o compras.

---

## 3. Características Clave para Monetización (Subscription Drivers)

Los usuarios pagan una suscripción cuando la aplicación **les ahorra dinero, les ahorra tiempo en los pasillos o elimina el esfuerzo manual**.

### A. Pilar Financiero: "La app que te ahorra dinero"
1. **Calculadora de Carrito y Presupuesto en Tiempo Real:**
   - Guardar el último precio registrado de cada producto.
   - Mostrar en tiempo real mientras se compra: *"Total estimado en carrito: $1,340 MXN / $78 USD (Presupuesto: $100 USD)"*.
   - Alertas de inflación personal (*"El café subió 18% en los últimos 3 meses"*).
2. **Memoria de Precios por Tienda (Multi-Store Price Tracker):**
   - Etiquetar productos por tienda (*Costco, Walmart, HEB, Trader Joe's, Loblaws, Chedraui*) y comparar dónde conviene comprar cada producto recurrente.
3. **Escaneo de Tickets con IA (Receipt OCR):**
   - Tomar una foto al ticket de compra al salir de la caja para marcar automáticamente los productos como comprados, actualizar sus precios reales y **ajustar automáticamente los días de recurrencia** según el ritmo real de consumo.

### B. Pilar de Fricción Cero: Automatización e Inteligencia Artificial
4. **Bot de WhatsApp / Notas de Voz a Lista:**
   - Enviar o reenviar una nota de voz (*"Se acabó el detergente, el café y trae 2 kilos de aguacate"*) para que la IA transcriba y cree automáticamente los ítems estructurados con cantidad, unidad y categoría en la lista compartida.
5. **De Receta (TikTok / Instagram / Web) a Lista de Compras en 1 clic:**
   - Pegar el enlace de una receta o generar un menú semanal y extraer los ingredientes directamente a la lista, **descontando los productos recurrentes que aún están vigentes en casa**.
6. **Predicción Inteligente de Recurrencia (Smart Restock):**
   - Evolucionar el motor de `recurrenceDays` para que aprenda del historial de compras: *"Sueles comprar Huevos cada 9 días. ¿Activamos la reposición automática?"*.

### C. Pilar de Velocidad en Tienda (In-Store Experience)
7. **Agrupación Automática por Pasillos (Smart Aisles):**
   - Ordenar automáticamente la lista por departamentos (*Frutas y Verduras, Lácteos, Carnes, Limpieza, Farmacia*) independientemente del orden en que se anotaron, adaptándose al recorrido de la tienda habitual del usuario.
8. **Escáner de Código de Barras:**
   - Escanear el envase vacío antes de desecharlo para agregar el producto exacto con su fotografía y marca específica.

---

## 4. Estrategia de Precios y Empaquetado (Packaging)

Para no frenar la viralidad natural entre parejas y familias, el cobro no debe ser por usuario individual, sino por **Hogar / Espacio compartido**:

| Plan | Precio sugerido | Qué incluye | Objetivo de negocio |
| :--- | :--- | :--- | :--- |
| **Gratis (Adquisición Viral)** | **$0** | Hasta 2 listas, colaboración en tiempo real básica, recurrencia manual limitada (ej. máx. 5 productos recurrentes). | Que un miembro del hogar invite a su pareja o familia (adquisición orgánica sin costo). |
| **Plan Hogar / Familiar** | **$4.99 USD/mes** o **$34.99 USD/año** *(~$69 MXN/mes en México)* | **1 suscripción cubre a todo el hogar (hasta 6 miembros)**. Listas y recurrentes ilimitados, fotos de productos, agrupación por pasillos, control de presupuesto/precios, escaneo de tickets y entrada por voz/IA. | Conversión masiva B2C con alta retención anual. |
| **Plan Negocio / Host (Airbnb & PyMEs)** | **$12.99 USD/mes** | Listas por propiedad o sucursal, historial de gastos exportable a CSV/PDF, roles restringidos (el personal marca faltantes con foto de evidencia y el administrador aprueba). | Alto ticket mensual y baja tasa de cancelación (churn). |

---

## 5. Prioridades de Implementación (Quick Wins)

Orden recomendado para maximizar el valor comercial con el menor esfuerzo técnico inicial:

1. **Fase 1 — Categorías/Pasillos automáticos y Precio estimado por ítem:**
   - Añadir campo opcional de precio estimado y categoría/pasillo en los ítems dentro de `apps/frontend/src/pages/ListDetailPage.tsx` y `apps/mobile` para mostrar el total estimado del carrito antes de pagar.
2. **Fase 2 — Suscripción Familiar Compartida:**
   - Permitir en `apps/backend/src/modules/billing/billing.service.ts` que una cuenta `premium` desbloquee los límites y beneficios en todas las listas donde sea propietaria, beneficiando a los miembros invitados de su hogar.
3. **Fase 3 — Entrada Rápida Inteligente (Voz / Texto Libre):**
   - Permitir dictar o pegar una lista en texto libre (*"2 kg de tomate, 1 leche deslactosada y jabón cada 15 días"*) y transformarla automáticamente en múltiples ítems estructurados con sus unidades y días de recurrencia.
