import type {
  AisleCategory,
  ReceiptLineMatch,
  ReceiptScanResponse,
  SmartParsedItem,
} from '@lista/contracts';
import type { ListItem } from '../../database/entities';
import { DAY_MS, itemNameKey } from './item.mapper';

/** Orden lógico de recorrido en supermercado para agrupar pasillos */
export const AISLE_ORDER: AisleCategory[] = [
  'produce',
  'bakery',
  'meat',
  'dairy',
  'pantry',
  'frozen',
  'beverages',
  'cleaning',
  'personal',
  'pets',
  'general',
];

const AISLE_KEYWORDS: Record<Exclude<AisleCategory, 'general'>, string[]> = {
  produce: [
    'tomate', 'jitomate', 'aguacate', 'cebolla', 'papa', 'patata', 'lechuga', 'zanahoria',
    'limon', 'naranja', 'manzana', 'platano', 'banana', 'cilantro', 'perejil', 'ajo',
    'chile', 'jalapeno', 'serrano', 'pepino', 'brocoli', 'coliflor', 'espinaca', 'acelga',
    'fresa', 'uva', 'sandia', 'melon', 'papaya', 'mango', 'pina', 'calabaza', 'calabacita',
    'chayote', 'apio', 'champinon', 'hongo', 'elote', 'nopales', 'nopal', 'jengibre', 'pera',
    'durazno', 'kiwi', 'arandano', 'frambuesa', 'verdura', 'fruta', 'ensalada',
    'tomato', 'avocado', 'onion', 'potato', 'lettuce', 'carrot', 'lemon', 'orange', 'apple',
    'garlic', 'pepper', 'cucumber', 'broccoli', 'spinach', 'strawberry', 'grape', 'watermelon',
    'pineapple', 'mushroom', 'celery', 'ginger', 'peach', 'berry', 'produce',
    'tomates', 'oignon', 'pomme', 'banane', 'citron', 'salade', 'carotte', 'avocat',
  ],
  bakery: [
    'pan', 'tortilla', 'tortillas', 'bolillo', 'telera', 'baguette', 'croissant', 'panque',
    'pastel', 'tostada', 'tostadas', 'totopos', 'bagel', 'muffin', 'dona', 'concha', 'birote',
    'bread', 'bakery', 'bun', 'buns', 'rolls', 'pastry', 'pain', 'brioche',
  ],
  meat: [
    'pollo', 'carne', 'res', 'cerdo', 'puerco', 'pescado', 'atun fresco', 'salmon', 'camaron',
    'jamon', 'salchicha', 'tocino', 'chorizo', 'bistec', 'molida', 'pechuga', 'muslo',
    'chuleta', 'costilla', 'arrachera', 'cecina', 'pavo', 'tilapia', 'marisco',
    'chicken', 'beef', 'pork', 'fish', 'shrimp', 'ham', 'sausage', 'bacon', 'steak', 'turkey',
    'meat', 'poulet', 'boeuf', 'porc', 'poisson', 'jambon',
  ],
  dairy: [
    'leche', 'queso', 'yogurt', 'yogur', 'crema', 'mantequilla', 'margarina', 'huevo',
    'huevos', 'requeson', 'nata', 'jocoque', 'panel', 'oaxaca', 'manchego', 'mozzarella',
    'cheddar', 'parmesano', 'kefir', 'deslactosada',
    'milk', 'cheese', 'butter', 'cream', 'egg', 'eggs', 'dairy',
    'lait', 'fromage', 'beurre', 'oeuf', 'oeufs', 'yaourt',
  ],
  pantry: [
    'arroz', 'frijol', 'frijoles', 'lenteja', 'lentejas', 'garbanzo', 'pasta', 'espagueti',
    'macarron', 'fideo', 'sopa', 'aceite', 'azucar', 'sal', 'harina', 'avena', 'cereal',
    'cafe', 'te', 'miel', 'mermelada', 'salsa', 'mayonesa', 'mostaza', 'catsup', 'ketchup',
    'vinagre', 'atun', 'sardina', 'galleta', 'galletas', 'chocolate', 'cacahuate', 'nuez',
    'almendra', 'chiles en lata', 'elote en lata', 'consome', 'pimienta', 'especia', 'canela',
    'vainilla', 'polvo para hornear', 'gelatina', 'cajeta', 'crema de mani',
    'rice', 'beans', 'lentils', 'oil', 'sugar', 'salt', 'flour', 'oats', 'coffee', 'tea',
    'honey', 'jam', 'mayo', 'mustard', 'vinegar', 'tuna', 'cookies', 'crackers', 'nuts',
    'riz', 'pates', 'huile', 'sucre', 'farine', 'cafe', 'chocolat', 'biscuits',
  ],
  frozen: [
    'helado', 'nieve', 'hielo', 'congelado', 'congelada', 'congelados', 'pizza congelada',
    'nuggets', 'papas congeladas', 'wafles',
    'ice cream', 'frozen', 'ice', 'popsicles', 'surgele', 'glace',
  ],
  beverages: [
    'agua', 'refresco', 'soda', 'jugo', 'zumo', 'cerveza', 'vino', 'tequila', 'whisky',
    'ron', 'vodka', 'mezcal', 'hidratante', 'suero', 'electrolit', 'limonada', 'naranjada',
    'water', 'juice', 'beer', 'wine', 'drink', 'beverage', 'cola', 'sparkling',
    'eau', 'jus', 'biere', 'vin', 'boisson',
  ],
  cleaning: [
    'detergente', 'jabon', 'cloro', 'limpiador', 'suavizante', 'fabuloso', 'pinol', 'escoba',
    'trapeador', 'esponja', 'fibra', 'bolsa de basura', 'bolsas de basura', 'servilleta',
    'servilletas', 'papel higienico', 'toalla de cocina', 'toallas de papel', 'aluminio',
    'papel aluminio', 'plastico adherente', 'jabon de trastes', 'lavatrastes', 'desinfectante',
    'quitamanchas', 'destapacaños', 'insecticida',
    'detergent', 'bleach', 'cleaner', 'softener', 'sponge', 'trash bag', 'napkin', 'napkins',
    'toilet paper', 'paper towel', 'foil', 'dish soap', 'disinfectant',
    'lessive', 'javel', 'eponge', 'essuie', 'papier toilette',
  ],
  personal: [
    'shampoo', 'champu', 'acondicionador', 'jabon corporal', 'jabon de tocador',
    'pasta dental', 'pasta de dientes', 'cepillo de dientes', 'enjuague bucal', 'hilo dental',
    'desodorante', 'antitranspirante', 'crema corporal', 'bloqueador', 'protector solar',
    'rastrillo', 'crema de afeitar', 'toalla femenina', 'toallas femeninas', 'panal', 'panales',
    'toallitas humedas', 'algodon', 'cotonetes', 'vitamina', 'paracetamol', 'ibuprofeno',
    'aspirina', 'alcohol', 'curita', 'curitas', 'gel antibacterial',
    'soap', 'toothpaste', 'toothbrush', 'deodorant', 'lotion', 'sunscreen', 'razor', 'diaper',
    'diapers', 'wipes', 'vitamins', 'medicine', 'shaving',
    'savon', 'dentifrice', 'deodorant', 'couches', 'shampooing',
  ],
  pets: [
    'croquetas', 'alimento para perro', 'alimento para gato', 'comida para perro',
    'comida para gato', 'arena para gato', 'premio para perro', 'mascota', 'perro', 'gato',
    'dog food', 'cat food', 'pet food', 'cat litter', 'kibble', 'chien', 'chat', 'croquettes',
  ],
};

export function classifyAisle(name: string, explicitCategory?: string | null): AisleCategory | string {
  if (explicitCategory && explicitCategory.trim() && explicitCategory.trim() !== 'general') {
    return explicitCategory.trim();
  }
  const normalized = itemNameKey(name);
  if (!normalized) return 'general';

  // Primero coincidencias de frase multi-palabra (ej. "jabon de trastes" vs "jabon")
  for (const aisle of AISLE_ORDER) {
    if (aisle === 'general') continue;
    const keywords = AISLE_KEYWORDS[aisle];
    for (const kw of keywords) {
      if (kw.includes(' ') && normalized.includes(kw)) {
        return aisle;
      }
    }
  }

  const words = normalized.split(/\s+/);
  for (const aisle of AISLE_ORDER) {
    if (aisle === 'general') continue;
    const keywords = AISLE_KEYWORDS[aisle];
    for (const kw of keywords) {
      if (words.includes(kw) || words.some((w) => w.length >= 4 && (w === `${kw}s` || w === `${kw}es`))) {
        return aisle;
      }
    }
  }

  return 'general';
}

export function aisleSortIndex(category: string | null | undefined): number {
  const idx = AISLE_ORDER.indexOf((category || 'general') as AisleCategory);
  return idx === -1 ? AISLE_ORDER.length - 1 : idx;
}

const WORD_NUMBERS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  one: 1,
  a: 1,
  an: 1,
  medio: 0.5,
  media: 0.5,
  half: 0.5,
  dos: 2,
  two: 2,
  deux: 2,
  tres: 3,
  three: 3,
  trois: 3,
  cuatro: 4,
  four: 4,
  quatre: 4,
  cinco: 5,
  five: 5,
  cinq: 5,
  seis: 6,
  six: 6,
  docena: 12,
  dozen: 12,
};

const UNIT_ALIASES: Record<string, string> = {
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogramo: 'kg',
  kilogramos: 'kg',
  g: 'g',
  gr: 'g',
  gramo: 'g',
  gramos: 'g',
  l: 'l',
  lt: 'l',
  lts: 'l',
  litro: 'l',
  litros: 'l',
  liter: 'l',
  liters: 'l',
  ml: 'ml',
  mililitro: 'ml',
  mililitros: 'ml',
  lb: 'lb',
  lbs: 'lb',
  libra: 'lb',
  libras: 'lb',
  pound: 'lb',
  pounds: 'lb',
  oz: 'oz',
  onza: 'oz',
  onzas: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  bolsa: 'bolsas',
  bolsas: 'bolsas',
  bag: 'bolsas',
  bags: 'bolsas',
  pza: 'pza',
  pzas: 'pza',
  pieza: 'pza',
  piezas: 'pza',
  paquete: 'pza',
  paquetes: 'pza',
  caja: 'pza',
  cajas: 'pza',
  lata: 'pza',
  latas: 'pza',
  botella: 'pza',
  botellas: 'pza',
  rollo: 'pza',
  rollos: 'pza',
  unidad: 'pza',
  unidades: 'pza',
  pc: 'pza',
  pcs: 'pza',
  pack: 'pza',
};

/**
 * Analizador gramatical 100% local y determinista (sin IA externa).
 * Convierte texto libre o dictado por voz ("2 kg de tomate a $35, 1 leche y jabón cada 15 días")
 * en una lista de ítems estructurados con cantidad, unidad, precio, recurrencia y pasillo.
 */
export function parseSmartEntryText(rawText: string): SmartParsedItem[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Proteger decimales como "1,5 kg" antes de separar por comas
  const decimalProtected = rawText.replace(/(\d),(\d)/g, '$1.$2');

  const segments = decimalProtected
    .split(/(?:[\n;]+|,|\s+(?:y|e|and|et|und)\s+)/i)
    .map((s) => s.replace(/^[\s•\-*]+/, '').trim())
    .filter((s) => s.length >= 2);

  const results: SmartParsedItem[] = [];
  const seenKeys = new Set<string>();

  for (let segment of segments) {
    let isRecurring = false;
    let recurrenceDays: number | null = null;
    let estimatedPrice: number | null = null;

    // 1. Extraer recurrencia: "cada 15 días", "every 2 weeks", "semanal", "quincenal", "mensual"
    const recDaysMatch = segment.match(
      /\b(?:cada|every|tous\s+les)\s+(\d{1,3})\s*(?:d[ií]as?|days?|jours?|d)\b/i,
    );
    const recWeeksMatch = segment.match(
      /\b(?:cada|every|toutes\s+les)\s+(\d{1,2})\s*(?:semanas?|weeks?|semaines?)\b/i,
    );
    const recMonthsMatch = segment.match(
      /\b(?:cada|every|tous\s+les)\s+(\d{1,2})\s*(?:mes(?:es)?|months?|mois)\b/i,
    );
    const recNamedMatch = segment.match(
      /\b(diario|cada\s+d[ií]a|daily|semanal(?:mente)?|cada\s+semana|weekly|quincenal(?:mente)?|cada\s+quincena|biweekly|mensual(?:mente)?|cada\s+mes|monthly)\b/i,
    );

    if (recDaysMatch) {
      isRecurring = true;
      recurrenceDays = Math.min(365, Math.max(1, parseInt(recDaysMatch[1], 10)));
      segment = segment.replace(recDaysMatch[0], ' ');
    } else if (recWeeksMatch) {
      isRecurring = true;
      recurrenceDays = Math.min(365, Math.max(1, parseInt(recWeeksMatch[1], 10) * 7));
      segment = segment.replace(recWeeksMatch[0], ' ');
    } else if (recMonthsMatch) {
      isRecurring = true;
      recurrenceDays = Math.min(365, Math.max(1, parseInt(recMonthsMatch[1], 10) * 30));
      segment = segment.replace(recMonthsMatch[0], ' ');
    } else if (recNamedMatch) {
      isRecurring = true;
      const token = itemNameKey(recNamedMatch[1]);
      if (token.includes('diario') || token.includes('dia') || token.includes('daily')) {
        recurrenceDays = 1;
      } else if (token.includes('seman') || token.includes('week')) {
        recurrenceDays = 7;
      } else if (token.includes('quincen') || token.includes('biweek')) {
        recurrenceDays = 15;
      } else {
        recurrenceDays = 30;
      }
      segment = segment.replace(recNamedMatch[0], ' ');
    }

    // 2. Extraer precio estimado: "a $35.50", "por $40", "$35", "a 35 pesos/usd/mxn/cad"
    const priceSymbolMatch = segment.match(
      /(?:\b(?:a|por|en|at|for)\s+)?\$\s*(\d{1,6}(?:\.\d{1,2})?)\b/i,
    );
    const priceWordMatch = segment.match(
      /(?:\b(?:a|por|en|at|for)\s+)?\b(\d{1,6}(?:\.\d{1,2})?)\s*(?:pesos?|mxn|usd|cad|eur|d[oó]lares?|dollars?)\b/i,
    );

    if (priceSymbolMatch) {
      estimatedPrice = Math.round(parseFloat(priceSymbolMatch[1]) * 100) / 100;
      segment = segment.replace(priceSymbolMatch[0], ' ');
    } else if (priceWordMatch) {
      estimatedPrice = Math.round(parseFloat(priceWordMatch[1]) * 100) / 100;
      segment = segment.replace(priceWordMatch[0], ' ');
    }

    segment = segment.replace(/\s+/g, ' ').trim();
    if (!segment) continue;

    // 3. Extraer cantidad y unidad al inicio (ej. "2 kg de tomate", "media docena de huevos", "3 leches")
    let quantity = 1;
    let unit = 'pza';

    const halfDozenMatch = segment.match(/^(?:media\s+docena|half\s+(?:a\s+)?dozen)\s+(?:de\s+|of\s+)?(.+)$/i);
    if (halfDozenMatch) {
      quantity = 6;
      unit = 'pza';
      segment = halfDozenMatch[1].trim();
    } else {
      const qtyUnitMatch = segment.match(
        /^(\d+(?:\.\d{1,2})?|un|una|uno|one|medio|media|half|dos|two|deux|tres|three|trois|cuatro|four|quatre|cinco|five|cinq|seis|six|docena|dozen)\s*(?:([a-zA-Záéíóúñ]+)\s+(?:de\s+|del\s+|of\s+|d'\s*)?)?(.+)$/i,
      );
      if (qtyUnitMatch) {
        const rawQty = itemNameKey(qtyUnitMatch[1]);
        const parsedQty = WORD_NUMBERS[rawQty] ?? parseFloat(rawQty);
        const potentialUnitRaw = qtyUnitMatch[2] ? itemNameKey(qtyUnitMatch[2]) : null;
        const remainder = qtyUnitMatch[3].trim();

        if (Number.isFinite(parsedQty) && parsedQty >= 0.01 && parsedQty <= 99999) {
          if (potentialUnitRaw && UNIT_ALIASES[potentialUnitRaw]) {
            quantity = Math.round(parsedQty * 100) / 100;
            unit = UNIT_ALIASES[potentialUnitRaw];
            segment = remainder.replace(/^(?:de|del|of)\s+/i, '').trim();
          } else if (potentialUnitRaw && /^(?:de|del|of)$/i.test(potentialUnitRaw)) {
            quantity = Math.round(parsedQty * 100) / 100;
            segment = remainder;
          } else {
            // No había unidad reconocida: "2 tomates" o "medio aguacate"
            quantity = Math.round(parsedQty * 100) / 100;
            segment = (qtyUnitMatch[2] ? `${qtyUnitMatch[2]} ${remainder}` : remainder)
              .replace(/^(?:de|del|of)\s+/i, '')
              .trim();
          }
        }
      }
    }

    const cleanName = segment
      .replace(/^[,.\-:\s]+|[,.\-:\s]+$/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .slice(0, 140)
      .trim();

    if (!cleanName) continue;

    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const key = itemNameKey(formattedName);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);

    results.push({
      name: formattedName,
      quantity,
      unit,
      category: classifyAisle(formattedName),
      estimatedPrice,
      isRecurring,
      recurrenceDays,
    });
  }

  return results;
}

const RECEIPT_NOISE_LINE =
  /\b(subtotal|sub-total|total|iva|ieps|impuesto|tax|efectivo|cash|cambio|change|tarjeta|visa|mastercard|amex|debito|credito|gracias|thank\s+you|ticket|folio|sucursal|cajero|rfc|telefono|tel\.|www\.|http|aut\.|aprobacion|propina|descuento|ahorro|puntos|monedero)\b/i;

function tokenSimilarity(a: string, b: string): number {
  const keyA = itemNameKey(a);
  const keyB = itemNameKey(b);
  if (!keyA || !keyB) return 0;
  if (keyA === keyB) return 1;
  if (keyA.includes(keyB) || keyB.includes(keyA)) {
    const minLen = Math.min(keyA.length, keyB.length);
    if (minLen >= 3) return 0.85;
  }

  const stop = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'sin', 'para', 'en', 'kg', 'gr', 'lt', 'ml', 'pza']);
  const tokensA = keyA.split(/\s+/).filter((t) => t.length >= 3 && !stop.has(t));
  const tokensB = keyB.split(/\s+/).filter((t) => t.length >= 3 && !stop.has(t));
  if (!tokensA.length || !tokensB.length) return 0;

  let matches = 0;
  for (const tA of tokensA) {
    const stemA = tA.replace(/(?:es|s)$/, '');
    if (
      tokensB.some((tB) => {
        const stemB = tB.replace(/(?:es|s)$/, '');
        return stemA === stemB || (stemA.length >= 4 && (tB.startsWith(stemA) || tA.startsWith(stemB)));
      })
    ) {
      matches++;
    }
  }
  return matches / Math.min(tokensA.length, tokensB.length);
}

/**
 * Analizador heurístico de tickets de supermercado 100% local (sin IA externa).
 * Extrae renglones con precio, los empareja con productos de la lista y calcula
 * el ajuste automático de recurrencia según los días reales desde la última compra.
 */
export function scanReceiptText(
  receiptText: string,
  listItems: ListItem[],
  now: Date = new Date(),
): ReceiptScanResponse {
  if (!receiptText || typeof receiptText !== 'string') {
    return { lines: [], detectedTotal: 0 };
  }

  const rawLines = receiptText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  const lines: ReceiptLineMatch[] = [];
  const matchedItemIds = new Set<string>();
  let detectedTotal = 0;

  // Priorizar productos pendientes, luego comprados/archivados recurrentes
  const candidateItems = [...listItems].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  for (const rawLine of rawLines) {
    if (RECEIPT_NOISE_LINE.test(rawLine)) continue;
    // Ignorar líneas que son solo números, fechas o códigos de barras
    if (/^[\d\s\-/:.*#]+$/.test(rawLine)) continue;

    // Extraer precio al final de la línea (ej. "LECHE DESLACTOSADA 1L $28.50" o "TOMATE 34.90")
    const priceMatch = rawLine.match(/(?:\$\s*)?(\d{1,5}[.,]\d{2})\s*[A-Z]?\s*$/);
    const price = priceMatch ? Math.round(parseFloat(priceMatch[1].replace(',', '.')) * 100) / 100 : null;

    let namePart = priceMatch ? rawLine.slice(0, priceMatch.index).trim() : rawLine;
    // Limpiar códigos SKU iniciales (ej. "0012345 LECHE") y multiplicadores ("2 X $14.00")
    let quantity = 1;
    const qtyPrefix = namePart.match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:x|X|\*|kg|KG|pza|PZA)?\s+(.+)$/);
    if (qtyPrefix && parseFloat(qtyPrefix[1]) <= 100 && qtyPrefix[1].length <= 4) {
      quantity = parseFloat(qtyPrefix[1].replace(',', '.')) || 1;
      namePart = qtyPrefix[2].trim();
    }
    namePart = namePart.replace(/^\d{5,}\s+/, '').replace(/\s+\d+(?:[.,]\d+)?\s*(?:KG|G|L|ML|PZA)\b/i, '').trim();
    if (namePart.length < 2 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(namePart)) continue;

    let bestItem: ListItem | null = null;
    let bestScore = 0;

    for (const item of candidateItems) {
      if (matchedItemIds.has(item.id)) continue;
      const score = tokenSimilarity(namePart, item.name);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestItem = item;
      }
    }

    let previousRecurrenceDays: number | null = null;
    let suggestedRecurrenceDays: number | null = null;

    if (bestItem) {
      matchedItemIds.add(bestItem.id);
      previousRecurrenceDays = bestItem.recurrenceDays;

      const lastBought = bestItem.lastPurchasedAt ?? bestItem.purchasedAt;
      if (lastBought) {
        const elapsedDays = Math.round((now.getTime() - new Date(lastBought).getTime()) / DAY_MS);
        if (elapsedDays >= 1 && elapsedDays <= 365) {
          suggestedRecurrenceDays = bestItem.recurrenceDays
            ? Math.max(1, Math.min(365, Math.round(bestItem.recurrenceDays * 0.6 + elapsedDays * 0.4)))
            : elapsedDays;
        }
      }
      if (suggestedRecurrenceDays === null && bestItem.recurrenceDays) {
        suggestedRecurrenceDays = bestItem.recurrenceDays;
      }
    }

    if (price !== null) {
      detectedTotal = Math.round((detectedTotal + price) * 100) / 100;
    }

    lines.push({
      rawLine,
      detectedName: namePart,
      price,
      quantity,
      matchedItemId: bestItem?.id ?? null,
      matchedItemName: bestItem?.name ?? null,
      previousRecurrenceDays,
      suggestedRecurrenceDays,
    });
  }

  return { lines, detectedTotal };
}
