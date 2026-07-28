# Torá Gematria & Decodificador Místico (Bible Code ELS)

Una aplicación web interactiva y estática (deployable en Netlify / GitHub Pages) para explorar las correlaciones de Gematria, el entrelazado místico del alfabeto hebreo, la línea de tiempo del Sionismo y el motor de búsqueda del **Código de la Biblia (ELS - Equidistant Letter Sequences)** sobre un corpus consonántico de los **5 libros de la Torá** (~26 000 letras; Génesis completo en extracto amplio; Éxodo–Deuteronomio como extractos curados).

## Características Principales

1. **Calculadora Multidimensional de Gematria**:
   - Muestra **Estándar (Mispar Hechrah)**, **Absoluto Gadol (Sofit)**, **Ordinal (Sidri)**, **Reducido (Katan)** y cifrados **Atbash / Albam / Avgad**.
   - Soporta entrada directa en Hebreo y traducción fonética inteligente del Español al Hebreo.
   - Constelación de relación interactiva en HTML5 Canvas.

2. **Descubrimientos en Tiempo Real (Grafo de Conocimiento)**:
   - Grafo integrado con 50 conceptos clave (Nombres Divinos, Sefirot, Sionismo, Personajes Bíblicos).
   - Genera tarjetas de resonancia matemática y puentes narrativos cabalísticos.

3. **Código de la Biblia (ELS Matrix & Auto-Scanner)**:
   - Motor de búsqueda ELS sobre corpus consonántico embebido (~26k letras, 5 libros).
   - Búsqueda asíncrona vía **Web Worker** (`elsWorker.js`) con barra de progreso y cancelación.
   - Matriz visual responsiva en orientación **RTL** con ajuste dinámico de columnas.
   - **Crossover Density**, p-valor / significancia estadística, historial y sugerencias rápidas.
   - Exportación **PNG** de la matriz y pestaña de **Favoritos** (LocalStorage).

4. **Acrósticos (Roshei / Sofei Teivot)**:
   - Búsqueda de acrósticos de inicio/final de palabra sobre texto hebreo libre.

5. **Línea de Tiempo del Sionismo & Comparador de Dos Palabras**:
   - Canvas interactivo de sincronías históricas (1882 a 1993).
   - Comparador de órbitas duales que construye un puente espiritual entre dos términos.

## Tecnologías

- HTML5 / CSS3 (Vanilla CSS con diseño futurista cósmico / glassmorphism)
- JavaScript ES6+ sin dependencias externas ni backend
- Corpus consonántico embebido en `torah_text.js` (sin API externa)
- Node.js (suites de pruebas `test.js` y `adversarial_test.js`)

## Pruebas Unitarias

```bash
node test.js
node adversarial_test.js
```

## Despliegue en Netlify

El repositorio incluye `netlify.toml` preconfigurado. Conecta el repositorio GitHub en Netlify o arrastra la carpeta del proyecto a Netlify Drop.

## Arquitectura

Ver [PROJECT.md](PROJECT.md) para contratos de módulos, hitos (M1–M5) y layout del código.
