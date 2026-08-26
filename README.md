# Torá Gematria & Decodificador Místico (Bible Code ELS)

Una aplicación web interactiva y estática (deployable en Netlify / GitHub Pages) para explorar las correlaciones de Gematria, el entrelazado místico del alfabeto hebreo, la línea de tiempo del Sionismo y el motor de búsqueda del **Código de la Biblia (ELS - Equidistant Letter Sequences)** sobre un corpus consonántico de los **5 libros de la Torá** (~27 000 letras; Génesis amplio; Éxodo–Deuteronomio como extractos curados, con Decálogo, Shemá y Birkat Kohanim).

## Características Principales

1. **Calculadora Multidimensional de Gematria**:
   - Muestra **Estándar (Mispar Hechrah)**, **Absoluto Gadol (Sofit)**, **Ordinal (Sidri)**, **Reducido (Katan)** y cifrados **Atbash / Albam / Avgad**.
   - Soporta entrada directa en Hebreo y traducción fonética inteligente del Español al Hebreo.
   - Constelación de relación interactiva en HTML5 Canvas.

2. **Descubrimientos en Tiempo Real (Grafo de Conocimiento)**:
   - Grafo integrado con 57 conceptos clave (Nombres Divinos, Sefirot, Sionismo, Cábala, Personajes Bíblicos).
   - Genera tarjetas de resonancia matemática y puentes narrativos cabalísticos.

3. **Explorar correlaciones (apellido / fecha / evento)**:
   - Buscador unificado: apellido (Cohen, Herzl…), fecha (`14/05/1948` / `5 Iyar 5708` / `1948`), evento (Oslo, Balfour) o número (`708`).
  - Consultas compuestas: `Herzl + 1897`, `Cohen y 1948`.
  - **Perfil personal**: nombre + apellido + fecha de nacimiento → dossier unificado (gematria, **fecha hebrea real**, timeline, grafo, versículos, ELS).
  - **Diccionario vivo**: léxico hebreo consultable (Cohen, Herzl, Raquel…) más nombres que tú guardas; sugerencias al escribir; se distingue **diccionario** vs **fonética aproximada**.
  - Calendario hebreo civil (Nisán–Adar) sin heurística `año+3760`: 14/05/1948 = 5 de Iyar 5708 (ה׳תש״ח).
  - Inicio de estudio en **Explorar** (Consulta / Mi perfil / Diccionario), con dossier de ejemplo al abrir.
  - Navegación compacta: **Inicio / Calculadora / Código ELS / Favoritos**, y el resto bajo **Más**. Desde un resultado se profundiza (timeline, Torá, comparador, ELS, espejo de letras, acrósticos, reflexión) y se vuelve al estudio.
  - Resultados combinados: grafo, línea de tiempo, tarjetas sionistas, versículos por valor y atajo a ELS.
   - Exportar informe `.txt`, guardar en Favoritos e historial de búsquedas recientes.

4. **Código de la Biblia (ELS Matrix & Auto-Scanner)**:
   - Motor de búsqueda ELS sobre corpus consonántico embebido (~27k letras, 5 libros).
   - Búsqueda asíncrona vía **Web Worker** (`elsWorker.js`) con barra de progreso y **cancelación real** (terminate + `shouldCancel`).
   - Matriz visual responsiva en orientación **RTL** con ajuste dinámico de columnas.
  - Cada hallazgo ELS muestra la **referencia de versículo** real (p. ej. Génesis 1:1, Éxodo 20:2), no un bloque aproximado.
  - Semáforo **muy común / plausible / raro** (Poisson + control en texto mezclado). Un hallazgo no se presenta como prueba.
  - **Crossover Density**, historial y sugerencias rápidas.
   - Exportación **PNG** de la matriz y pestaña de **Favoritos** (LocalStorage).

5. **Acrósticos (Roshei / Sofei Teivot)**:
   - Búsqueda sobre texto propio **o sobre las frases curadas** (`TORAH_VERSES`, con espacios de palabra). No se busca en `TORAH_TEXT` (esa cinta no tiene cortes de palabra).
   - Ejemplos clásicos: BILU (Isaías 2:5), מילה / יהוה (Deuteronomio 30:12).
   - Desde **Inicio**, el hebreo del dossier se puede mandar al buscador de acrósticos en el corpus de frases.
   - Nota de honestidad: un objetivo corto puede aparecer por azar en pocas palabras.

6. **Línea de Tiempo del Sionismo & Comparador de Dos Palabras**:
   - Canvas interactivo de sincronías históricas (Sinaí → Oslo, 13 hitos).
   - Comparador de órbitas duales que construye un puente espiritual entre dos términos.

## Tecnologías

- HTML5 / CSS3 (Vanilla CSS con diseño futurista cósmico / glassmorphism)
- JavaScript ES6+ sin dependencias externas ni backend
- Corpus consonántico embebido en `torah_text.js` (sanitizado en carga; sin API externa)
- Node.js (suites de pruebas `test.js` y `adversarial_test.js`)

## Pruebas Unitarias

```bash
make check
# equivalente:
node test.js && node adversarial_test.js
```

## Despliegue en Netlify

El repositorio incluye `netlify.toml` preconfigurado. Conecta el repositorio GitHub en Netlify o arrastra la carpeta del proyecto a Netlify Drop.

## Arquitectura

Ver [PROJECT.md](PROJECT.md) para contratos de módulos, hitos (M1–M5) y layout del código.
