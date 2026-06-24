# Portal de documentación de la API (developer portal)

> Material de apoyo para el PDF. Explica **qué es** el portal de documentación,
> **por qué** se hizo, **con qué herramientas**, **cómo se construyó** y **cómo se
> ejecuta**. La fuente vive en `Tarea_1/docs-portal/`.

---

## 1. Qué es y por qué existe

Además de la documentación interactiva de **Swagger UI** (que ya existía desde el
Proyecto 1 y se sirve en `/api-docs`), se construyó un **portal de documentación
curado** estilo *developer portal* (como los de Spotify o Stripe).

La diferencia es importante y conviene dejarla clara en el PDF:

| | **Swagger UI** (`/api-docs`) | **Portal de documentación** (`docs-portal/`) |
| --- | --- | --- |
| Qué es | Referencia **auto-generada** del spec OpenAPI | **Sitio de documentación** diseñado y escrito a mano |
| Contenido | Lista de endpoints + "try it out" | Guías + conceptos + referencia, con narrativa y navegación |
| Propósito | Probar la API rápido | Explicar **cómo se usa** la plataforma a un desarrollador nuevo |
| Estética | La de Swagger, utilitaria | Tema propio (tres columnas, modo oscuro, marca) |

En resumen: **Swagger es la referencia cruda; el portal es la documentación
curada**. El portal *reutiliza* el mismo OpenAPI de Swagger para su sección de
referencia, así que ambos nunca se contradicen.

## 2. Herramientas utilizadas y por qué

| Herramienta | Rol | Por qué se eligió |
| --- | --- | --- |
| **Docusaurus 3** | Generador del sitio (la "cáscara" del portal) | Estándar de la industria para developer portals; basado en React; produce un sitio estático rápido; soporta páginas en Markdown + navegación, búsqueda y theming. Es lo más cercano al estilo Spotify. |
| **Redoc** (vía el plugin `redocusaurus`) | Render de la referencia de endpoints | Toma el OpenAPI y lo muestra con el clásico layout de **tres columnas** (navegación / descripción / ejemplos), idéntico en espíritu a Stripe/Spotify. Se integra como preset de Docusaurus. |
| **OpenAPI 3.0** (ya existente) | Fuente de la referencia | Es el mismo spec que alimenta Swagger UI, generado con `swagger-jsdoc` desde los comentarios `@swagger` del backend. No se duplicó nada. |

**Por qué Docusaurus + Redoc y no solo Swagger/Redoc suelto:** el valor que pedía el
profesor no es "una referencia más bonita", sino un **portal con páginas escritas a
mano** (overview, autenticación, guía de inicio, conceptos). Redoc por sí solo seguiría
siendo "el spec renderizado". Docusaurus aporta esas páginas-guía, que son el
diferenciador; Redoc resuelve la referencia sin escribirla a mano.

## 3. Cómo se construyó (flujo de datos de la documentación)

```
Comentarios @swagger en el backend
        │  (swagger-jsdoc)
        ▼
Spec OpenAPI en memoria  ──►  Swagger UI  (/api-docs)
        │
        │  npm run export:openapi   (script nuevo)
        ▼
docs-portal/static/openapi.json   (volcado estático)
        │  (redocusaurus / Redoc)
        ▼
Sección "Referencia API"  (/reference/)  dentro del portal Docusaurus
        +
Páginas-guía escritas a mano (Markdown)  ──►  resto del portal
```

Puntos clave de la implementación:

1. **Exportación del spec.** Se agregó `backend/src/swagger/export-openapi.ts` y el
   script `npm run export:openapi`, que vuelca el **mismo** spec OpenAPI que usa
   Swagger a `docs-portal/static/openapi.json`. Así la referencia del portal es
   siempre fiel al código (single source of truth).
2. **Páginas-guía** (en `docs-portal/docs/`, escritas a mano):
   - `intro.md` — Overview / página de inicio.
   - `quickstart.md` — flujo típico (registro → token → llamada) como referencia.
   - `autenticacion.md` — modelo de seguridad (Keycloak + JWT Bearer, roles).
   - `errores.md` — formato de errores y tabla de códigos HTTP.
   - `conceptos.md` — modelo de dominio + capa analítica (DW/OLAP, Neo4j, rutas).
3. **Referencia embebida.** El preset `redocusaurus` en `docusaurus.config.js`
   monta la referencia en `/reference/` a partir del `openapi.json`.
4. **Tema.** Acento turquesa/tiffany (más profundo en modo claro para mantener
   contraste, más vibrante en modo oscuro), modo oscuro por defecto, íconos de línea
   en la portada (`src/css/custom.css`).

## 4. Estructura de carpetas

```
docs-portal/
├─ docs/                  # páginas-guía (el contenido escrito a mano)
│  ├─ intro.md            # Overview (homepage, ruta /)
│  ├─ quickstart.md
│  ├─ autenticacion.md
│  ├─ errores.md
│  └─ conceptos.md
├─ static/
│  ├─ openapi.json        # spec exportado del backend (alimenta Redoc)
│  └─ img/favicon.svg
├─ src/css/custom.css     # tema (acento turquesa/tiffany, íconos)
├─ docusaurus.config.js   # configuración del sitio + preset redocusaurus
├─ sidebars.js            # organización del menú de la guía
└─ README.md
```

## 5. Cómo ejecutarlo

Requisitos: **Node.js 18+** (probado con Node 22).

```powershell
cd Tarea_1\docs-portal

# (opcional) regenerar el spec OpenAPI desde el backend si cambiaron endpoints
npm run sync:openapi          # equivale a: npm --prefix ..\backend run export:openapi

# instalar dependencias (solo la primera vez)
npm install

# modo desarrollo (hot-reload) -> http://localhost:3000
npm start

# build estático para la entrega / demostración
npm run build                 # genera la carpeta build/
npm run serve                 # sirve ese build en http://localhost:3000
```

Rutas dentro del portal:
- **Guía** (overview, quickstart, etc.): `http://localhost:3000/`
- **Referencia API** (Redoc): `http://localhost:3000/reference/`

> No requiere levantar Docker ni el resto de la plataforma: el portal es un sitio
> **estático** y autocontenido. Los ejemplos de las guías (curl) sí asumen una
> instancia de la API corriendo si alguien quisiera ejecutarlos, pero el portal en sí
> se construye y se muestra de forma independiente.

## 6. Qué mostrar en el video / capturas

- La **portada** con las tarjetas y el tema (modo oscuro, acento turquesa/tiffany).
- Una **página-guía** (por ejemplo *Autenticación* o *Conceptos*) para evidenciar que
  es contenido curado, no auto-generado.
- La **Referencia API** (`/reference/`) con su layout de tres columnas, abriendo un
  endpoint del tag *Graph* para ver descripción + parámetros + ejemplos.
- Mencionar que esa referencia sale del **mismo OpenAPI** que Swagger, exportado
  automáticamente (sincronización garantizada).

## 7. Resumen de decisiones de diseño (para citar en el PDF)

- Se diferenció **documentación curada** (portal) de **referencia auto-generada**
  (Swagger), porque cubren necesidades distintas.
- Se reutilizó el **OpenAPI existente** en lugar de redocumentar endpoints a mano:
  menos trabajo y cero riesgo de desincronización.
- Se eligió **Docusaurus + Redoc** por ser el camino estándar y de mayor impacto
  visual para un developer portal, aprovechando que el proyecto ya usa Node.
- El portal es **estático**: fácil de versionar en git, de construir y de desplegar
  (por ejemplo en GitHub Pages) sin depender de la infraestructura del sistema.
