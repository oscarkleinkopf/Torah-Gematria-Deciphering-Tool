# Material de terceros / Third-party material

Este repositorio incluye o referencia material que **no** es de propiedad de Osias Kleinkopf. Ese material **no** queda cubierto por `LICENSE` (ni por `LICENSE-CONTENT.md`, si existe). Se rige por la licencia o los términos de su titular.

This repository includes or references material not owned by Osias Kleinkopf. Such material is NOT covered by `LICENSE` (or `LICENSE-CONTENT.md`) and remains under its owners' licenses or terms.

## Inventario

| Material | Ubicación en el repo | Origen / titular | Licencia o términos | Notas |
|---|---|---|---|---|
| Corpus consonántico de la Torá | `torah_text.js` (generado por `scripts/build_torah_corpus.js`) | Westminster Leningrad Codex (WLC), vía Sefaria (https://www.sefaria.org) | CC BY-SA (según el README; versión por confirmar: el script lee `heLicense` de la API de Sefaria y no la guarda en `torah_text.js`) | Atribución obligatoria: "Texto: Westminster Leningrad Codex, vía Sefaria (https://www.sefaria.org), CC BY-SA". Este archivo NO está bajo MIT ni bajo CC BY-NC-SA. |
| Versículos curados (TORAH_VERSES) | `database.js` (`const TORAH_VERSES`) | Texto bíblico; fuente editorial por confirmar | Por confirmar | El arreglo incluye hebreo, transliteración, traducción al español y comentarios (`commentary`). La fuente y la licencia no están declaradas en el repo. |
| Salmos (TEHILIM_PSALMS) | `database.js` (`const TEHILIM_PSALMS`) | Texto bíblico (Salmos); fuente editorial por confirmar | Por confirmar | Hebreo y traducción al español en el mismo arreglo. |
| Plegarias (SACRED_PRAYERS) | `database.js` (`const SACRED_PRAYERS`) | Texto tradicional; cada entrada cita un versículo en `source` | Por confirmar | |
| Citas bibliográficas ELS | `database.js` (`const ELS_BIBLIOGRAPHY`) | Autores citados (Bachya, Cordovero, Weissmandl, WRR, Drosnin, McKay y otros) | Por confirmar | Solo fichas y notas breves; no se incluye el texto de las obras. |
| Fuentes tipográficas (Cinzel, Cinzel Decorative, Inter, Rubik) | `styles.css` (import de Google Fonts; no están embebidas) | Google Fonts | Por confirmar | Solo se referencian por URL. |
| Dependencias npm | `package.json` y `package-lock.json` | Cada paquete | La de cada paquete | No quedan cubiertas por `LICENSE`. |

## Categorías a revisar

- **Textos tradicionales o de terceros** (p. ej. Torá, brajot, tefilot, citas, traducciones ajenas).
- **Datos** (APIs, datasets, tablas oficiales).
- **Audio** (música, grabaciones de personas, tropos/melodías).
- **Imágenes e ilustraciones** (de terceros, stock o generadas por IA con términos del proveedor).
- **Fuentes tipográficas e íconos.**
- **Marcas y logotipos** de terceros: se usan solo como referencia y no se licencian.
- **Dependencias de software:** ver `package.json` / lockfile. Cada paquete conserva su propia licencia.

Si eres titular de algún material incluido y quieres que se corrija la atribución o se retire, escribe a través de https://aqabank.cl.
