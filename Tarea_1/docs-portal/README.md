# Portal de documentación — Reserva Inteligente

Developer portal (estilo Spotify/Stripe) construido con **Docusaurus 3** + **Redoc**
(`redocusaurus`). Combina **páginas-guía escritas a mano** (Overview, Quickstart,
Autenticación, Errores, Conceptos) con la **referencia de endpoints** generada
automáticamente desde el OpenAPI del backend.

> No confundir con Swagger UI (`/api-docs`): aquello es la referencia cruda
> auto-generada; esto es un portal curado con narrativa, navegación y diseño.

## Estructura

```
docs-portal/
├─ docs/                 # páginas-guía (Markdown) — el contenido a mano
│  ├─ intro.md           # Overview (homepage)
│  ├─ quickstart.md
│  ├─ autenticacion.md
│  ├─ errores.md
│  └─ conceptos.md
├─ static/openapi.json   # spec OpenAPI exportado del backend (alimenta Redoc)
├─ src/css/custom.css    # tema (acento verde estilo Spotify)
├─ docusaurus.config.js  # config del sitio + preset redocusaurus
└─ sidebars.js
```

## Cómo correrlo

```bash
# 1) (opcional) regenerar el spec OpenAPI desde el backend
npm run sync:openapi          # == npm --prefix ../backend run export:openapi

# 2) instalar dependencias (solo la 1a vez)
npm install

# 3a) modo desarrollo (hot-reload) en http://localhost:3000
npm start

# 3b) build estático para producción / entrega
npm run build
npm run serve                 # sirve el build en http://localhost:3000
```

- **Guía:** `http://localhost:3000/`
- **Referencia API (Redoc):** `http://localhost:3000/reference/`

## Mantener la referencia sincronizada

La referencia se genera desde `static/openapi.json`, que es un **volcado** del mismo
spec que sirve Swagger UI. Si cambian los endpoints del backend:

```bash
npm run sync:openapi    # vuelve a exportar openapi.json
npm start               # (o npm run build)
```

El script de exportación vive en el backend: `backend/src/swagger/export-openapi.ts`
(`npm run export:openapi`).
