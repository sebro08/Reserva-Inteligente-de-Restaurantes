// =============================================================================
// export-openapi.ts  —  Vuelca el spec OpenAPI a un archivo estático
// =============================================================================
// El portal de documentación (Docusaurus + Redoc) necesita el OpenAPI como un
// JSON estático en disco; en runtime solo vive en memoria (swagger-jsdoc lo
// construye al importar swagger.ts). Este script reutiliza EXACTAMENTE el mismo
// spec que sirve Swagger UI, así la referencia del portal nunca se desincroniza.
//
// Uso (desde la carpeta backend/):
//   npm run export:openapi
//
// Salida: ../docs-portal/static/openapi.json
// =============================================================================
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { swaggerSpec } from "./swagger";

// backend/src/swagger -> Tarea_1/docs-portal/static/openapi.json
const out = resolve(__dirname, "..", "..", "..", "docs-portal", "static", "openapi.json");

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(swaggerSpec, null, 2), "utf-8");

const paths = Object.keys((swaggerSpec as { paths?: object }).paths ?? {}).length;
console.log(`OpenAPI exportado (${paths} endpoints) -> ${out}`);
