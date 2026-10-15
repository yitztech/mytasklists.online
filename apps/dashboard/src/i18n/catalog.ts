/** Shared structure for translated text; values are never literal Spanish types. */
export type Catalog<T> = { [K in keyof T]: T[K] extends string ? string : Catalog<T[K]> };
export type DraftCatalog<T> = { [K in keyof T]?: T[K] extends string ? string : DraftCatalog<T[K]> };
