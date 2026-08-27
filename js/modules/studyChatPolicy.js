/**
 * Política del chat de estudio: compañero exploratorio, nunca profecía.
 * Compartido por el navegador, la función Netlify y test.js.
 */
(function (global) {
  'use strict';

  const SYSTEM_PROMPT = [
    'Eres el compañero de estudio de «Torá Gematria Deciphering Tool», una app estática en español.',
    'Hablas con claridad, sin misticismo de vendedor y sin afirmar milagros.',
    '',
    'Hechos de ESTA app (no los contradigas):',
    '- Cinta ELS: los cinco libros de la Torá completos, consonantes WLC (~306 269 letras). No es el Tanaj (faltan Profetas y Escritos).',
    '- Ejemplo reproducible: תורה cada 50 letras desde la ת de בראשית (letra #5, Génesis 1:1) y desde la primera ת de Shemot (letra #7 del Éxodo, Éxodo 1:1). Palabra de 4 letras, salto fijo: hallazgo exploratorio, no prueba de diseño.',
    '- Acrósticos (Roshei/Sofei Teivot) se buscan en versículos con espacios, no en la cinta ELS.',
    '- Semáforo de honestidad: muy común / plausible / raro. Palabras cortas aparecen por azar.',
    '- Deuteronomio 32:3 conserva gematría almacenada 708 (resonancia simbólica con 5708/1948); no la “corrijas”.',
    '- Control barajado (McKay et al., 1999): si el salto también sale en texto mezclado, no es distintivo.',
    '',
    'Prohibido:',
    '- Afirmar que «el código predijo» asesinatos, atentados, nombres de políticos o fechas futuras.',
    '- Presentar matrices de Drosnin (Rabin, Hitler, 11-S) o el experimento WRR de grandes rabinos como hallazgos de esta app.',
    '- Eliyahu Rips rechazó el uso predictivo de esos libros. Dilo si preguntan.',
    '- Inventar ELS, versículos o gematrías que no puedas anclar a lo anterior; si no sabes, dilo y apunta a las pestañas de la app (ELS, Acrósticos, Calculadora).',
    '',
    'Si el usuario pide una predicción o un «código oculto» de noticias: niégalo con respeto, explica el sesgo de elección de salto, y ofrece estudiar un ejemplo reproducible (תורה@50) o un acróstico curado (BILU, Dt 30:12).',
    'Responde en español, breve (salvo que pidan detalle). No uses la palabra «Asombroso» para un ELS.'
  ].join('\n');

  const PROPHECY_RE = /predij|predicci[oó]n|el c[oó]digo (dijo|anunci|revel)|asesinat|rabin|hitler|11[\s-]?s|atentado|drosnin|wrr|witztum|grandes rabinos|profec[ií]a|el futuro/i;

  const MAX_MESSAGES = 12;
  const MAX_CHARS = 2000;

  function isProphecyAsk(text) {
    return PROPHECY_RE.test(String(text || ''));
  }

  function sanitizeMessages(raw) {
    const list = Array.isArray(raw) ? raw : [];
    const out = [];
    for (let i = 0; i < list.length && out.length < MAX_MESSAGES; i++) {
      const m = list[i] || {};
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      const role = m.role;
      const content = String(m.content || '').trim().slice(0, MAX_CHARS);
      if (!content) continue;
      out.push({ role, content });
    }
    return out;
  }

  function lastUserText(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  }

  const CANNED = {
    els: 'ELS (equidistant letter sequence) es leer letras a salto fijo en la cinta consonántica. En esta app la cinta son los cinco libros de la Torá (WLC, ~306 mil letras), no el Tanaj. Una palabra corta con un salto elegido a posteriori es común: el semáforo lo marca como exploratorio, no como prueba.',
    tora50: 'Desde la ת de בראשית (letra #5, Génesis 1:1) cada 50 letras se lee תורה. Lo mismo ocurre en Shemot desde la primera ת (letra #7 del Éxodo). Es un ejemplo clásico de Weissmandl/Bachya, reproducible aquí. Palabra de 4 letras y salto fijo: no es un milagro ni una predicción.',
    corpus: 'Esta app embebe Génesis, Éxodo, Levítico, Números y Deuteronomio completos (consonantes). No incluye Profetas ni Escritos. Los acrósticos se buscan en versículos con espacios (Shemá, Birkat Kohanim, Decálogo…), no en la cinta ELS.',
    prophecy: 'Esta app no afirma que «el código predijera» asesinatos, atentados ni nombres de políticos. Las matrices de Drosnin y el experimento WRR no se presentan como hallazgos nuestros: Eliyahu Rips rechazó el uso predictivo, y McKay et al. (1999) hallaron «códigos» equivalentes en Guerra y paz. Si quieres estudiar algo reproducible, abre תורה a salto 50 en Génesis o Éxodo, o un acróstico curado (BILU, Dt 30:12).'
  };

  function localReply(userText) {
    const t = String(userText || '');
    if (isProphecyAsk(t)) return CANNED.prophecy;
    if (/els|equidistan|salto de letras|c[oó]digo de la (biblia|tor[aá])/i.test(t)) return CANNED.els;
    if (/תורה|torah@50|cada 50|weissmandl|shemot|éxodo 1/i.test(t)) return CANNED.tora50;
    if (/corpus|cu[aá]ntas letras|tanaj|cinco libros|qu[eé] hay en esta tor/i.test(t)) return CANNED.corpus;
    return 'Puedo orientar el estudio (gematría, ELS, acrósticos) sin vender profecías. Prueba un chip de arriba, o pregunta por תורה a salto 50, BILU, o qué contiene esta cinta. El chat en vivo (Netlify AI Gateway) explica con más detalle cuando el sitio está desplegado con IA activa; si no, estas respuestas locales cubren lo esencial.';
  }

  function buildGatewayMessages(history) {
    const messages = sanitizeMessages(history);
    const userText = lastUserText(messages);
    const extra = isProphecyAsk(userText)
      ? '\n\nEl último mensaje pide predicción o un código de noticias. Niégalo con claridad y no improvises matrices Drosnin/WRR.'
      : '';
    return {
      messages,
      userText,
      prophecy: isProphecyAsk(userText),
      system: SYSTEM_PROMPT + extra
    };
  }

  const api = {
    SYSTEM_PROMPT,
    PROPHECY_RE,
    CANNED,
    MAX_MESSAGES,
    MAX_CHARS,
    isProphecyAsk,
    sanitizeMessages,
    lastUserText,
    localReply,
    buildGatewayMessages
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.StudyChatPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
