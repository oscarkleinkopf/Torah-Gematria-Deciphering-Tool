/**
 * Base de datos de conocimiento para la aplicación GematriaDecipher.
 * Contiene información de letras hebreas, versículos de la Torá, correlaciones históricas del Sionismo y reflexiones.
 */

const HEBREW_LETTERS = [
  { char: 'א', name: 'Alef', value: 1, ordinal: 1, reduced: 1, meaning: 'Líder, buey, fuerza primordial, unidad divina. Representa el canal entre el cielo y la tierra.', element: 'Aire' },
  { char: 'ב', name: 'Bet', value: 2, ordinal: 2, reduced: 2, meaning: 'Casa, contenedor, dualidad, creación. La primera letra de la Torá (Bereshit).', element: 'Tierra / Saturno' },
  { char: 'ג', name: 'Gimel', value: 3, ordinal: 3, reduced: 3, meaning: 'Camello, benevolencia, movimiento, el puente entre los opuestos. Dar y recibir.', element: 'Júpiter' },
  { char: 'ד', name: 'Dalet', value: 4, ordinal: 4, reduced: 4, meaning: 'Puerta, humildad, las cuatro esquinas de la tierra. Representa la vasija receptora.', element: 'Marte' },
  { char: 'ה', name: 'He', value: 5, ordinal: 5, reduced: 5, meaning: 'Ventana, aliento de vida, revelación divina, el poder de la expresión y la palabra.', element: 'Aries' },
  { char: 'ו', name: 'Vav', value: 6, ordinal: 6, reduced: 6, meaning: 'Clavo, conexión, gancho. Une lo espiritual con lo material, el cielo con la tierra.', element: 'Tauro' },
  { char: 'ז', name: 'Zayin', value: 7, ordinal: 7, reduced: 7, meaning: 'Espada, corona, el tiempo, descanso. El número sagrado del Shabat y la creación.', element: 'Géminis' },
  { char: 'ח', name: 'Chet', value: 8, ordinal: 8, reduced: 8, meaning: 'Cerca, vida (Chai), trascendencia. Representa ir más allá del orden natural (el 7).', element: 'Cáncer' },
  { char: 'ט', name: 'Tet', value: 9, ordinal: 9, reduced: 9, meaning: 'Cesta, bondad oculta (Tov), gestación. El potencial espiritual dentro de la materia.', element: 'Leo' },
  { char: 'י', name: 'Yod', value: 10, ordinal: 10, reduced: 1, meaning: 'Mano, punto primordial, la chispa divina inicial. El potencial infinito en la humildad.', element: 'Virgo' },
  { char: 'כ', name: 'Kaf', value: 20, ordinal: 11, reduced: 2, meaning: 'Palma de la mano, moldear, potencial realizado. El poder de manifestar las ideas.', element: 'Sol' },
  { char: 'ך', name: 'Kaf Sofit', value: 500, ordinal: 11, reduced: 2, meaning: 'Forma final de Kaf. Representa el potencial completamente materializado al final del camino.', element: 'Sol (Final)' },
  { char: 'ל', name: 'Lamed', value: 30, ordinal: 12, reduced: 3, meaning: 'Aguijón, aprender, enseñar. La letra más alta, que se eleva hacia el plano espiritual.', element: 'Libra' },
  { char: 'מ', name: 'Mem', value: 40, ordinal: 13, reduced: 4, meaning: 'Agua (Mayim), matriz, misterio, flujo constante de la vida y el inconsciente.', element: 'Agua' },
  { char: 'ם', name: 'Mem Sofit', value: 600, ordinal: 13, reduced: 4, meaning: 'Forma final de Mem. Representa el misterio cerrado, la sabiduría oculta y finalizada.', element: 'Agua (Final)' },
  { char: 'נ', name: 'Nun', value: 50, ordinal: 14, reduced: 5, meaning: 'Pez, alma, caída y resurrección, fidelidad. La luz que brilla en la oscuridad.', element: 'Escorpio' },
  { char: 'ן', name: 'Nun Sofit', value: 700, ordinal: 14, reduced: 5, meaning: 'Forma final de Nun. Representa el alma que se ha erguido e iluminado por completo.', element: 'Escorpio (Final)' },
  { char: 'ס', name: 'Samekh', value: 60, ordinal: 15, reduced: 6, meaning: 'Soporte, escudo, infinito. Representa el ciclo completo y la protección divina.', element: 'Sagitario' },
  { char: 'ע', name: 'Ayin', value: 70, ordinal: 16, reduced: 7, meaning: 'Ojo, visión espiritual, fuente de agua. Ver más allá de las apariencias físicas.', element: 'Capricornio' },
  { char: 'פ', name: 'Pe', value: 80, ordinal: 17, reduced: 8, meaning: 'Boca, palabra, comunicación. El poder creador del habla y la transmisión del conocimiento.', element: 'Venus' },
  { char: 'ף', name: 'Pe Sofit', value: 800, ordinal: 17, reduced: 8, meaning: 'Forma final de Pe. La expresión verbal que ha logrado su impacto final en el mundo.', element: 'Venus (Final)' },
  { char: 'צ', name: 'Tsadi', value: 90, ordinal: 18, reduced: 9, meaning: 'Anzuelo, el justo (Tzadik), rectitud. El equilibrio entre el cielo y la tierra en la acción.', element: 'Acuario' },
  { char: 'ץ', name: 'Tsadi Sofit', value: 900, ordinal: 18, reduced: 9, meaning: 'Forma final de Tsadi. La justicia y rectitud que triunfan al final de los tiempos.', element: 'Acuario (Final)' },
  { char: 'ק', name: 'Qof', value: 100, ordinal: 19, reduced: 1, meaning: 'Ojo de aguja, santidad en lo material. La capacidad de elevar incluso lo más denso.', element: 'Piscis' },
  { char: 'ר', name: 'Resh', value: 200, ordinal: 20, reduced: 2, meaning: 'Cabeza, inicio, flujo mental. Representa el intelecto y el discernimiento.', element: 'Mercurio' },
  { char: 'ש', name: 'Shin', value: 300, ordinal: 21, reduced: 3, meaning: 'Diente, fuego divino (Esh), transformación activa, dinamismo y equilibrio cósmico.', element: 'Fuego' },
  { char: 'ת', name: 'Tav', value: 400, ordinal: 22, reduced: 4, meaning: 'Sello, marca, verdad (Emet). La última letra de la creación, que sella la realidad.', element: 'Luna' }
];

const TORAH_VERSES = [
  {
    reference: 'Génesis 1:1',
    hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
    transliteration: 'Bereshit bara Elohim et hashamayim ve\'et ha\'aretz',
    translation: 'En el principio creó Dios los cielos y la tierra.',
    gematria: 2701,
    commentary: 'El valor 2701 es el 73º número triangular (la suma de todos los números del 1 al 73). En la matemática de la Torá, representa el diseño geométrico de la creación.'
  },
  {
    reference: 'Deuteronomio 30:3',
    hebrew: 'וְשָׁב יְהוָה אֱלֹהֶיךָ אֶת שְׁבוּתְךָ וְרִחֲמֶךָ וְשָׁב וְקִבֶּצְךָ מִכל הָעַמִּים',
    transliteration: 'Veshav Adonai Elohecha et shevutcha verichamecha veshav vekibetzecha mikol ha\'amim',
    translation: 'Entonces el Señor tu Dios te restaurará, tendrá compasión de ti, y volverá a reunirte de entre todos los pueblos.',
    gematria: 2865,
    commentary: 'El versículo central que profetiza el retorno físico del pueblo judío a la Tierra de Israel, un pilar del ideal sionista.'
  },
  {
    reference: 'Isaías 2:5',
    hebrew: 'בֵּית יַעֲקֹב לְכוּ וְנֵלְכָה בְּאוֹר יְהוָה',
    transliteration: 'Beit Ya\'akov lechu venelcha be\'or Adonai',
    translation: 'Casa de Jacob, venid y caminemos a la luz del Señor.',
    gematria: 1047,
    commentary: 'Las primeras letras de esta frase forman el acrónimo BILU (ביל"ו), que fue el nombre del primer movimiento pionero sionista moderno en 1882, que inició la primera Aliyá.'
  },
  {
    reference: 'Isaías 60:22',
    hebrew: 'הַקָּטֹן יִהְיֶה לְאֶלֶף וְהַצָּעִיר לְגוֹי עָצוּם אֲנִי יְהוָה בְּעִתָּהּ אֲחִישֶׁנָּה',
    transliteration: 'Hakaton yihyeh le\'elef vehatzair legoy atzum ani Adonai be\'itah achishenah',
    translation: 'El más pequeño llegará a ser un millar, y el menor, una nación poderosa. Yo, el Señor, a su tiempo lo apresuraré.',
    gematria: 2758,
    commentary: 'Profecía sobre la redención y el retorno. Los místicos asocian "a su tiempo lo apresuraré" con los procesos pioneros del Sionismo práctico.'
  },
  {
    reference: 'Deuteronomio 32:3',
    hebrew: 'כִּי שֵׁם יְהוָה אֶקְרָא הָבוּ גֹדֶל לֵאלֹהֵינוּ',
    transliteration: 'Ki shem Adonai ekra havu godel leloheinu',
    translation: 'Porque proclamaré el nombre del Señor; dad grandeza a nuestro Dios.',
    gematria: 708,
    commentary: 'El valor numérico de este versículo central es 708, coincidiendo de forma asombrosa con el año hebreo 5708 (תש"ח - 1948), año del nacimiento del Estado de Israel.'
  },
  {
    reference: 'Deuteronomio 30:12',
    hebrew: 'מִי יַעֲלֶה לָּנוּ הַשָּׁמַיְמָה',
    transliteration: 'Mi ya\'aleh lanu hashamaymah',
    translation: '¿Quién subirá por nosotros al cielo?',
    gematria: 651,
    commentary: 'Las iniciales forman מילה (circuncisión / palabra) y las finales יהוה. Ejemplo clásico de Roshei y Sofei Teivot en cuatro palabras.'
  }
];

const ACROSTIC_EXAMPLES = [
  {
    id: 'bilu',
    label: 'BILU · Isaías 2:5',
    type: 'roshei',
    target: 'בילו',
    reference: 'Isaías 2:5'
  },
  {
    id: 'milah',
    label: 'מילה · Deut. 30:12',
    type: 'roshei',
    target: 'מילה',
    reference: 'Deuteronomio 30:12'
  },
  {
    id: 'yhvh',
    label: 'יהוה · Deut. 30:12 (finales)',
    type: 'sofei',
    target: 'יהוה',
    reference: 'Deuteronomio 30:12'
  }
];

const ZIONIST_CORRELATIONS = [
  {
    concept: 'Sión (Tzion)',
    hebrew: 'ציון',
    gematria: 156,
    historicalContext: 'Sión es históricamente el nombre de la colina de Jerusalén sobre la que se construyó la ciudad de David, y por extensión representa a toda la Tierra de Israel y al pueblo judío.',
    mysticalConnection: 'El valor numérico 156 es idéntico al de "Yosef" (יְהוֹסֵף / יוסף - José). En la mística judía (Cábala), José representa el arquetipo de la edificación del plano físico, la provisión y el retorno de los exiliados. Esto alinea el Sionismo histórico con el concepto de "Mashiach ben Yosef" (el proceso físico y político de reconstrucción de la nación antes de la paz espiritual).'
  },
  {
    concept: 'BILU (Pioneros de 1882)',
    hebrew: 'ביל"ו',
    gematria: 48,
    historicalContext: 'BILU fue un grupo de pioneros judíos rusos que fundaron algunas de las primeras colonias agrícolas en Israel (como Rishon LeZion) en 1882, marcando el inicio del Sionismo práctico.',
    mysticalConnection: 'Es el acrónimo del versículo de Isaías 2:5: "Beit Ya\'akov Lechu Vened\'ah" (Casa de Jacob, venid y caminemos). El número 48 representa en la Cábala las 48 vías de sabiduría necesarias para adquirir el entendimiento de la Torá y de la Tierra.'
  },
  {
    concept: 'El Año del Retorno (Tashach / 1948)',
    hebrew: 'תש"ח',
    gematria: 708,
    historicalContext: 'Representa el año hebreo 5708, que corresponde a 1948 en el calendario gregoriano, el año de la Declaración de Independencia de Israel.',
    mysticalConnection: 'En la Torá, el Cantar de Ha\'azinu (Deuteronomio 32), que describe el destino profético, el exilio y la consolación final de Israel, contiene exactamente 708 palabras. Esto es considerado por los sabios como una firma numérica codificada de cuándo terminaría el largo exilio del pueblo judío.'
  },
  {
    concept: 'Herzl (El Visionario)',
    hebrew: 'הרצל',
    gematria: 325,
    historicalContext: 'Theodor Herzl fue el fundador del Sionismo Político moderno y organizador del Primer Congreso Sionista en Basilea (1897).',
    mysticalConnection: 'El valor 325 equivale a "Barak" (בָּרָק - Relámpago o brillo intenso). Herzl actuó como un destello inesperado en la historia judía, despertando la conciencia nacional. En hebreo, 325 también corresponde a la palabra "Na\'arah" (נערה - joven mujer), asociada místicamente con la congregación de Israel ("Kneset Yisrael") que despierta de su letargo en el exilio.'
  },
  {
    concept: 'Estado de Israel (Medinat Yisrael)',
    hebrew: 'מדינת ישראל',
    gematria: 1045,
    historicalContext: 'El nombre oficial proclamado por David Ben-Gurión el 14 de mayo de 1948.',
    mysticalConnection: 'El valor 1045 reduce a 1 (1+0+4+5=10 -> 1+0=1), simbolizando el retorno a la unidad original del pueblo. Numéricamente equivale a frases proféticas de consuelo como "כי עין בעין יראו בשוב יהוה ציון" ("Porque ojo a ojo verán cuando el Señor vuelva a Sión" - Isaías 52:8), que evoca la manifestación visible del plan divino.'
  },
  {
    concept: 'Jerusalén (Yerushalayim)',
    hebrew: 'ירושלים',
    gematria: 582,
    historicalContext: 'La capital eterna e indivisible del pueblo de Israel, el foco geográfico del anhelo sionista.',
    mysticalConnection: 'El valor 582 es equivalente a "Tzion HaKedoshah" (ציון הקדושה - Sión la Santa) y también se asocia con "Ahavat Olam" (אהבת עולם - Amor Eterno). La conexión mística enseña que el retorno a Jerusalén está motivado y sostenido por un lazo de amor eterno que trasciende el tiempo histórico.'
  }
];

const DAILY_REFLECTIONS = [
  {
    title: 'El Poder del Retorno (Teshuvá y Aliyá)',
    text: 'En hebreo, la palabra para retornar a la Tierra (Aliyá) y retornar a uno mismo o a Dios (Teshuvá) comparten la misma raíz conceptual del retorno. La gematria nos muestra que el retorno físico de una nación a su tierra y el retorno espiritual de un individuo a su esencia están intrínsecamente conectados. Hoy, reflexiona: ¿Qué aspecto de tu vida necesita un "retorno" a su estado original de paz y autenticidad?'
  },
  {
    title: 'Amor y Unidad (13 y 26)',
    text: 'La palabra hebrea para Amor es "Ahavá" (אהבה), cuyo valor es 13. La palabra para Unidad es "Ejad" (אחד), que también vale 13. Al sumarse, dan 26, el valor exacto del Nombre inefable de Dios (YHWH - יהוה). Esto nos enseña que Dios se manifiesta en el mundo a través de la unión del amor y la unidad. En el Sionismo, la unidad del pueblo fue clave para superar la adversidad. ¿Cómo puedes sembrar unidad a tu alrededor hoy?'
  },
  {
    title: 'El Esfuerzo Físico como Canal Espiritual',
    text: 'El Sionismo práctico se centró en labrar la tierra, construir casas y secar pantanos (el arquetipo de José / valor 156). La Cábala enseña que lo espiritual no flota en el aire, sino que necesita un recipiente físico fuerte para manifestarse. Tu propio desarrollo espiritual o intelectual necesita rutinas diarias, orden y esfuerzo físico. ¿Estás construyendo la vasija física necesaria para tus sueños?'
  },
  {
    title: 'La Esperanza no se pierde (Hatikvah)',
    text: 'La palabra "Hatikvah" (התקוה) tiene un valor de 516. Coincide exactamente con la suma de la plegaria de Moisés para entrar a la Tierra en Deuteronomio. La esperanza no es una ilusión pasiva; es un motor activo de cambio que sostiene a los seres humanos en los momentos más oscuros del exilio. Cuando sientas desaliento, recuerda que la esperanza tiene un valor matemático grabado en el orden del universo.'
  }
];

const KNOWLEDGE_GRAPH = [
  // --- Nombres Divinos ---
  {
    id: 'yhwh',
    hebrew: 'יהוה',
    spanish: 'YHVH',
    category: 'divino',
    tags: ['nombre divino', 'misericordia', 'cábala'],
    mysticalNote: 'El Tetragramatón. Representa el aspecto eterno y de infinita misericordia de Dios (quien fue, es y será). Su valor es 26.',
    relatedVerses: ['Deuteronomio 6:4']
  },
  {
    id: 'elohim',
    hebrew: 'אלהים',
    spanish: 'Elohim',
    category: 'divino',
    tags: ['nombre divino', 'justicia', 'creación', 'naturaleza'],
    mysticalNote: 'El aspecto de justicia divina y ley natural en la creación. Su gematria es 86, el mismo valor de "HaTeva" (הטבע - La Naturaleza).',
    relatedVerses: ['Génesis 1:1']
  },
  {
    id: 'el_shaddai',
    hebrew: 'אל שדי',
    spanish: 'El Shaddai',
    category: 'divino',
    tags: ['nombre divino', 'autosuficiencia', 'protección'],
    mysticalNote: 'El Dios Todopoderoso o "Aquel que tiene suficiente". Su valor es 345, idéntico al de "Moshé" (משה), vinculando el nombre divino protector con el mensajero de la Redención.',
    relatedVerses: ['Génesis 17:1']
  },
  {
    id: 'adonai',
    hebrew: 'אדני',
    spanish: 'Adonai',
    category: 'divino',
    tags: ['nombre divino', 'soberanía', 'manifestación'],
    mysticalNote: 'Señor o Soberano. El canal a través del cual la presencia divina (Shejiná) se manifiesta en el mundo terrenal (Malkhut). Su valor es 65.',
    relatedVerses: ['Deuteronomio 10:17']
  },
  {
    id: 'ehyeh',
    hebrew: 'אהיה',
    spanish: 'Ehyeh',
    category: 'divino',
    tags: ['nombre divino', 'potencial', 'redención'],
    mysticalNote: '"Yo Seré". Revelado a Moisés en la zarza ardiente ("Yo seré el que seré" - אהיה אשר אהיה). Representa el potencial ilimitado de transformación. Su valor es 21.',
    relatedVerses: ['Éxodo 3:14']
  },

  // --- Las Sefirot (Árbol de la Vida) ---
  {
    id: 'keter',
    hebrew: 'כתר',
    spanish: 'Kéter',
    category: 'sefirah',
    tags: ['corona', 'voluntad', 'infinito'],
    mysticalNote: 'La Corona. La primera Sefirá, que representa la voluntad divina absoluta y la luz trans-intelectual del Infinito (Ein Sof). Su valor es 620.',
    relatedVerses: []
  },
  {
    id: 'chochmah',
    hebrew: 'חכמה',
    spanish: 'Jojmá',
    category: 'sefirah',
    tags: ['sabiduría', 'destello', 'padre'],
    mysticalNote: 'La Sabiduría. El destello intuitivo de la revelación intelectual, el punto de inicio de la creación ("Con Jojmá hiciste todo"). Su valor es 73.',
    relatedVerses: ['Salmos 104:24']
  },
  {
    id: 'binah',
    hebrew: 'בינה',
    spanish: 'Biná',
    category: 'sefirah',
    tags: ['entendimiento', 'análisis', 'madre'],
    mysticalNote: 'El Entendimiento. La capacidad analítica y de dar forma a la chispa intuitiva de Jojmá. Es la "Madre Superiora". Su valor es 67.',
    relatedVerses: ['Proverbios 2:3']
  },
  {
    id: 'chesed_sef',
    hebrew: 'חסד',
    spanish: 'Jésed',
    category: 'sefirah',
    tags: ['bondad', 'amor', 'expansión'],
    mysticalNote: 'La Bondad o Amor Incondicional. La fuerza benevolente y expansiva que desea dar luz sin límites. Asociada al patriarca Abraham. Su valor es 72.',
    relatedVerses: ['Salmos 89:3']
  },
  {
    id: 'gevurah',
    hebrew: 'גבורה',
    spanish: 'Gevurá',
    category: 'sefirah',
    tags: ['rigor', 'restricción', 'juicio'],
    mysticalNote: 'El Rigor, Fuerza o Restricción. El poder de establecer límites, contraerse (Tzimtzum) y juzgar para canalizar adecuadamente el flujo expansivo de Jésed. Su valor es 216.',
    relatedVerses: []
  },
  {
    id: 'tiferet',
    hebrew: 'תפארת',
    spanish: 'Tiféret',
    category: 'sefirah',
    tags: ['belleza', 'armonía', 'verdad'],
    mysticalNote: 'La Belleza o Armonía. El equilibrio perfecto entre Jésed (dar) y Gevurá (limitar), representando la compasión y la verdad (Emet). Asociada a Jacob. Su valor es 1081.',
    relatedVerses: []
  },
  {
    id: 'netzach',
    hebrew: 'נצח',
    spanish: 'Nétzaj',
    category: 'sefirah',
    tags: ['victoria', 'eternidad', 'perseverancia'],
    mysticalNote: 'La Victoria, Eternidad o Perseverancia. La fuerza activa que busca dominar la inercia del plano físico para manifestar la luz. Asociada a Moisés. Su valor es 148.',
    relatedVerses: []
  },
  {
    id: 'hod',
    hebrew: 'הוד',
    spanish: 'Hod',
    category: 'sefirah',
    tags: ['esplendor', 'rendición', 'agradecimiento'],
    mysticalNote: 'El Esplendor o Agradecimiento. El reconocimiento humilde, el diseño y refinamiento que equilibra la fuerza motriz de Nétzaj. Asociada a Aarón. Su valor es 15.',
    relatedVerses: []
  },
  {
    id: 'yesod',
    hebrew: 'יסוד',
    spanish: 'Yesod',
    category: 'sefirah',
    tags: ['fundamento', 'conexión', 'fuerza vital'],
    mysticalNote: 'El Fundamento. El embudo energético que consolida las fuerzas superiores antes de verterlas en el plano físico (Malkhut). Representa la fidelidad y la energía creativa (José). Su valor es 80.',
    relatedVerses: []
  },
  {
    id: 'malkhut',
    hebrew: 'מלכות',
    spanish: 'Maljut',
    category: 'sefirah',
    tags: ['reino', 'manifestación', 'tierra'],
    mysticalNote: 'El Reino. La vasija receptora final, nuestro plano material, donde la luz divina se condensa en materia. Es también la "Shejiná" (Presencia Divina). Su valor es 496.',
    relatedVerses: []
  },
  {
    id: 'daat',
    hebrew: 'דעת',
    spanish: 'Daat',
    category: 'sefirah',
    tags: ['conocimiento', 'síntesis', 'conexión mística'],
    mysticalNote: 'El Conocimiento. La Sefirá oculta que sintetiza la sabiduría (Jojmá) y el entendimiento (Biná) en experiencia directa y transformadora. Su valor es 474.',
    relatedVerses: []
  },

  // --- Conceptos Clave (Cabalísticos, Bíblicos y Espirituales) ---
  {
    id: 'torah',
    hebrew: 'תורה',
    spanish: 'Torá',
    category: 'concepto',
    tags: ['instrucción', 'ley', 'cosmos'],
    mysticalNote: 'La Ley, Guía o Instrucción. Representa el plano maestro cósmico de la creación. La Cábala enseña que Dios miró la Torá y creó el mundo. Su valor es 611.',
    relatedVerses: ['Deuteronomio 33:4']
  },
  {
    id: 'shalom',
    hebrew: 'שלום',
    spanish: 'Shalom',
    category: 'concepto',
    tags: ['paz', 'integridad', 'armonía'],
    mysticalNote: 'Paz. Proviene de la raíz "Shalem" (entero o íntegro). En la mística, la paz no es la ausencia de conflicto, sino la integración armoniosa de todas las partes opuestas. Su valor es 376.',
    relatedVerses: ['Números 6:26']
  },
  {
    id: 'emet',
    hebrew: 'אמת',
    spanish: 'Emet',
    category: 'concepto',
    tags: ['verdad', 'sello', 'infinito'],
    mysticalNote: 'La Verdad. Compuesta por la primera (Alef), media (Mem) y última (Tav) letra del alfabeto hebreo, denotando que la verdad abarca todo el principio, medio y fin. Su valor es 441.',
    relatedVerses: ['Salmos 119:160']
  },
  {
    id: 'teshuvah',
    hebrew: 'תשובה',
    spanish: 'Teshuvá',
    category: 'concepto',
    tags: ['retorno', 'arrepentimiento', 'redención'],
    mysticalNote: 'Retorno. El acto de volver a la esencia pura de uno mismo y a la divinidad. La gematria es 712. Se asocia con el concepto sionista de retorno a la Tierra.',
    relatedVerses: ['Deuteronomio 30:2']
  },
  {
    id: 'mashiach',
    hebrew: 'משיח',
    spanish: 'Mesías',
    category: 'concepto',
    tags: ['ungido', 'redención', 'era de paz'],
    mysticalNote: 'El Ungido. La energía o líder de la redención final que restaurará la paz planetaria. Su valor es 358, igual a "Najash" (נחש - Serpiente), indicando que el Mesías transmuta y sana el error arquetípico original.',
    relatedVerses: []
  },
  {
    id: 'olam',
    hebrew: 'עולם',
    spanish: 'Olam',
    category: 'concepto',
    tags: ['mundo', 'universo', 'ocultamiento'],
    mysticalNote: 'Mundo o Universo. Deriva de la raíz "He\'elem" (ocultamiento), sugiriendo que el mundo físico es un velo que oculta la presencia de la energía divina subyacente. Su valor es 146.',
    relatedVerses: ['Eclesiastés 3:11']
  },
  {
    id: 'nefesh',
    hebrew: 'נפש',
    spanish: 'Néfesh',
    category: 'concepto',
    tags: ['alma física', 'vitalidad', 'sangre'],
    mysticalNote: 'El alma física o nivel básico del alma, que rige los instintos vitales, la sangre y el movimiento del cuerpo físico. Su valor es 430.',
    relatedVerses: ['Génesis 9:4']
  },
  {
    id: 'neshamah',
    hebrew: 'נשמה',
    spanish: 'Neshamá',
    category: 'concepto',
    tags: ['alma superior', 'intelecto espiritual', 'aliento'],
    mysticalNote: 'El alma intelectual y espiritual superior, asociada con el aliento de vida divina soplado directamente en el ser humano. Su valor es 395.',
    relatedVerses: ['Génesis 2:7']
  },
  {
    id: 'ruach',
    hebrew: 'רוח',
    spanish: 'Rúaj',
    category: 'concepto',
    tags: ['espíritu', 'viento', 'emoción'],
    mysticalNote: 'Espíritu o Viento. El nivel intermedio del alma que rige las emociones, la moral y la fuerza expresiva de la palabra. Su valor es 214.',
    relatedVerses: ['Génesis 1:2']
  },
  {
    id: 'ahava',
    hebrew: 'אהבה',
    spanish: 'Amor',
    category: 'concepto',
    tags: ['amor', 'emoción', 'unidad'],
    mysticalNote: 'Amor. Su valor es 13, idéntico al de "Ejad" (אחד - Unidad), lo que revela místicamente que el amor verdadero es el camino hacia la unidad espiritual absoluta.',
    relatedVerses: ['Cantar de los Cantares 8:7']
  },
  {
    id: 'echad',
    hebrew: 'אחד',
    spanish: 'Unidad',
    category: 'concepto',
    tags: ['uno', 'unidad', 'credo'],
    mysticalNote: 'Uno o Unidad. Proclama la indivisibilidad de lo divino. Su valor es 13. Sumado a "Ahavá" (13) da 26, el valor de YHVH.',
    relatedVerses: ['Deuteronomio 6:4']
  },
  {
    id: 'israel',
    hebrew: 'ישראל',
    spanish: 'Israel',
    category: 'concepto',
    tags: ['lucha divina', 'pueblo', 'patria'],
    mysticalNote: '"El que lucha con Dios" o "Príncipe de Dios". Nombre dado a Jacob tras su encuentro con el ángel. Su valor es 541, el cual es el 10º número de la estrella y el 100º número primo.',
    relatedVerses: ['Génesis 32:28']
  },
  {
    id: 'yerushalayim',
    hebrew: 'ירושלים',
    spanish: 'Jerusalén',
    category: 'concepto',
    tags: ['ciudad sagrada', 'visión de paz', 'centro cósmico'],
    mysticalNote: '"Visión de Paz" o "Fundamento de Paz". El corazón espiritual de Israel y el canal de bendición del mundo. Su valor es 582, igual a "Tzion HaKedoshah" (Sión la Santa).',
    relatedVerses: ['Salmos 122:6']
  },
  {
    id: 'tzion',
    hebrew: 'ציון',
    spanish: 'Sión',
    category: 'concepto',
    tags: ['monte', 'anhelo', 'sionismo'],
    mysticalNote: 'Sión. Representa la colina sagrada y el foco de memoria y esperanza del exilio. Su valor es 156, equivalente al de "Yosef" (José), el constructor físico de la nación.',
    relatedVerses: ['Salmos 137:1']
  },

  // --- Nombres Bíblicos ---
  {
    id: 'avraham',
    hebrew: 'אברהם',
    spanish: 'Abraham',
    category: 'nombre',
    tags: ['patriarca', 'amor', 'fe'],
    mysticalNote: 'El primer patriarca, arquetipo del amor incondicional y la hospitalidad (Jésed). Su valor es 248, correspondiente al número de preceptos positivos en la Torá.',
    relatedVerses: ['Génesis 17:5']
  },
  {
    id: 'yitzchak',
    hebrew: 'יצחק',
    spanish: 'Isaac',
    category: 'nombre',
    tags: ['patriarca', 'rigor', 'risa'],
    mysticalNote: 'El segundo patriarca, arquetipo de la restricción, el auto-sacrificio y el temor reverente (Gevurá). Su valor es 208, que es 8 veces 26 (YHVH), aludiendo al octavo día de la circuncisión.',
    relatedVerses: ['Génesis 21:3']
  },
  {
    id: 'yaakov',
    hebrew: 'יעקב',
    spanish: 'Jacob',
    category: 'nombre',
    tags: ['patriarca', 'belleza', 'verdad'],
    mysticalNote: 'El tercer patriarca, arquetipo del equilibrio, la armonía y el estudio (Tiféret). Su valor es 182, que es la suma de los valores de 7 veces YHVH (7 x 26 = 182).',
    relatedVerses: ['Génesis 25:26']
  },
  {
    id: 'moshe',
    hebrew: 'משה',
    spanish: 'Moisés',
    category: 'nombre',
    tags: ['legislador', 'profeta', 'libertador'],
    mysticalNote: 'El redentor que sacó a Israel de Egipto y entregó la Torá. Su valor es 345, coincidiendo con "El Shaddai" (Dios Todopoderoso) y con la frase inversa "Shiló" (שילה - El Mesías).',
    relatedVerses: ['Éxodo 2:10']
  },
  {
    id: 'aharon',
    hebrew: 'אהרן',
    spanish: 'Aarón',
    category: 'nombre',
    tags: ['sacerdote', 'paz', 'templo'],
    mysticalNote: 'El Sumo Sacerdote, arquetipo del pacificador y amante de sus semejantes (Hod). Su valor es 256, equivalente a 2 elevado a 8, denotando la perfección sacerdotal.',
    relatedVerses: ['Éxodo 4:14']
  },
  {
    id: 'yosef',
    hebrew: 'יוסף',
    spanish: 'José',
    category: 'nombre',
    tags: ['proveedor', 'fidelidad', 'constructor'],
    mysticalNote: 'José el Justo, arquetipo de la manifestación de los sueños en la realidad económica y social (Yesod). Su valor es 156, idéntico al de "Tzion" (Sión) y "Kehal YHVH" (Congregación de Dios).',
    relatedVerses: ['Génesis 30:24']
  },
  {
    id: 'david',
    hebrew: 'דוד',
    spanish: 'David',
    category: 'nombre',
    tags: ['rey', 'salmos', 'realeza'],
    mysticalNote: 'El rey de quien descenderá el linaje mesiánico, arquetipo de la humildad receptora (Maljut). Su valor es 14, un número que denota la mano (Yad = 14) y representa la acción y el liderazgo.',
    relatedVerses: ['1 Samuel 16:13']
  },
  {
    id: 'shlomo',
    hebrew: 'שלמה',
    spanish: 'Salomón',
    category: 'nombre',
    tags: ['rey', 'sabiduría', 'templo'],
    mysticalNote: 'El rey sabio que construyó el Primer Templo de Jerusalén. Su valor es 376, idéntico al de "Shalom" (Paz), ya que su reinado fue una era de paz y plenitud.',
    relatedVerses: ['1 Reyes 1:39']
  },
  {
    id: 'sarah',
    hebrew: 'שרה',
    spanish: 'Sara',
    category: 'nombre',
    tags: ['matriarca', 'nobleza', 'milagro'],
    mysticalNote: 'La primera matriarca, madre de Isaac y co-fundadora de la fe monoteísta. Su valor es 505.',
    relatedVerses: ['Génesis 17:15']
  },
  {
    id: 'hateva',
    hebrew: 'הטבע',
    spanish: 'La Naturaleza',
    category: 'concepto',
    tags: ['naturaleza', 'ley física', 'cosmos'],
    mysticalNote: 'La Naturaleza. Su valor numérico es exactamente 86, idéntico al del Nombre Divino "Elohim" (אלהים). La Cábala enseña que la naturaleza es el ropaje físico visible de las leyes divinas.',
    relatedVerses: ['Génesis 1:1']
  },
  {
    id: 'nachash',
    hebrew: 'נחש',
    spanish: 'Serpiente',
    category: 'concepto',
    tags: ['transmutación', 'prueba', 'sanación'],
    mysticalNote: 'La Serpiente primordial. Su gematria es 358, idéntica a la de "Mashiach" (משיח - Mesías). Esto revela que la energía que causó la caída es la misma que, al ser transmutada y elevada, produce la redención.',
    relatedVerses: ['Génesis 3:1', 'Números 21:9']
  },
  {
    id: 'chai',
    hebrew: 'חי',
    spanish: 'Chai (Vida)',
    category: 'concepto',
    tags: ['vida', 'vitalidad', 'bendición'],
    mysticalNote: 'Vida. El número 18 es un símbolo universal de buena fortuna, salud y energía vital en la tradición judía.',
    relatedVerses: ['Deuteronomio 30:19']
  },
  {
    id: 'chaim',
    hebrew: 'חיים',
    spanish: 'Chaim (Vidas)',
    category: 'concepto',
    tags: ['vida plural', 'eternidad', 'alma'],
    mysticalNote: 'La forma plural de vida, indicando que la vida humana abarca simultáneamente el mundo presente (Olam Hazeh) y el venidero (Olam Haba). Su valor es 68.',
    relatedVerses: ['Proverbios 3:18']
  },
  {
    id: 'lev',
    hebrew: 'לב',
    spanish: 'Corazón',
    category: 'concepto',
    tags: ['corazón', 'emoción', 'sabiduría'],
    mysticalNote: 'Corazón. Su valor es 32, aludiendo a los "32 Senderos de la Sabiduría" (Lamed-Bet Netivot Jojmá) del Sefer Yetzirá con los que fue creado el cosmos.',
    relatedVerses: ['Deuteronomio 6:5']
  },
  {
    id: 'or',
    hebrew: 'אור',
    spanish: 'Luz',
    category: 'concepto',
    tags: ['luz primordial', 'iluminación', 'revelación'],
    mysticalNote: 'Luz primordial. Su valor es 207, idéntico al de "Raz" (רז - Misterio) e "Ein Sof" (אין סוף - Infinito). La luz divina contiene todos los misterios del infinito.',
    relatedVerses: ['Génesis 1:3']
  },
  {
    id: 'tzadik',
    hebrew: 'צדיק',
    spanish: 'Tzadik (El Justo)',
    category: 'concepto',
    tags: ['justicia', 'fundamento', 'santidad'],
    mysticalNote: 'El Justo. "Tzadik Yesod Olam" (El Justo es el fundamento del mundo). Su valor es 204.',
    relatedVerses: ['Proverbios 10:25']
  },
  {
    id: 'tikkun',
    hebrew: 'תיקון',
    spanish: 'Tikún (Rectificación)',
    category: 'concepto',
    tags: ['reparación', 'propósito', 'evolución'],
    mysticalNote: 'Rectificación o Reparación del Mundo (Tikún Olam). El propósito ético y espiritual de la humanidad. Su valor es 566.',
    relatedVerses: []
  },
  {
    id: 'rachamim',
    hebrew: 'רחמים',
    spanish: 'Rajamim (Compasión)',
    category: 'concepto',
    tags: ['misericordia', 'equilibrio', 'matriz'],
    mysticalNote: 'Misericordia o Compasión. Deriva de "Réjem" (matriz). Representa el amor protector incondicional. Su valor es 298.',
    relatedVerses: ['Éxodo 34:6']
  },
  {
    id: 'bereshit',
    hebrew: 'בראשית',
    spanish: 'Bereshit (En el Principio)',
    category: 'concepto',
    tags: ['origen', 'génesis', 'creación'],
    mysticalNote: 'La primera palabra de la Torá. Su valor es 913, equivalente a "BeRov Jojmá" (ברוב חכמה - Con Gran Sabiduría) y "Brit Shalom" (ברית שלום - Pacto de Paz).',
    relatedVerses: ['Génesis 1:1']
  },
  {
    id: 'kadosh',
    hebrew: 'קדוש',
    spanish: 'Kadosh (Santo)',
    category: 'concepto',
    tags: ['santidad', 'separación', 'elevación'],
    mysticalNote: 'Santo o Sagrado. Separado para un propósito trascendente. Su valor es 410, coincidiendo con los 410 años que duró el Primer Templo de Jerusalén.',
    relatedVerses: ['Levítico 19:2', 'Isaías 6:3']
  },
  {
    id: 'tashach',
    hebrew: 'תשח',
    spanish: 'Tashach (1948 / Año del Retorno)',
    category: 'historia',
    tags: ['1948', 'independencia', 'retorno', 'sionismo'],
    mysticalNote: 'Año hebreo 5708 (1948), año de la fundación del Estado moderno de Israel. Su valor numérico es 708, coincidiendo con el número de palabras en el Cantar de Haázinu.',
    relatedVerses: ['Deuteronomio 32:3']
  },

  // --- Sionismo Moderno e Hitos Históricos ---
  {
    id: 'aliya',
    hebrew: 'עליה',
    spanish: 'Aliyá',
    category: 'concepto',
    tags: ['inmigración', 'retorno', 'ascenso'],
    mysticalNote: '"Ascenso". Nombre dado a la inmigración judía a la Tierra prometida. Espiritualmente significa ascender de nivel vibratorio al pisar la tierra de los profetas. Su valor es 115.',
    relatedVerses: []
  },
  {
    id: 'kibbutz',
    hebrew: 'קיבוץ',
    spanish: 'Kibutz',
    category: 'concepto',
    tags: ['comunidad', 'agricultura', 'socialismo'],
    mysticalNote: 'Comunas agrícolas que forjaron la infraestructura comunitaria del moderno Israel. Deriva de la raíz "Kabetz" (reunir). Su valor es 208, igual al de Isaac, indicando el rigor y el esfuerzo físico.',
    relatedVerses: []
  },
  {
    id: 'hagana',
    hebrew: 'הגנה',
    spanish: 'Haganá',
    category: 'concepto',
    tags: ['defensa', 'fuerza', 'protección'],
    mysticalNote: '"Defensa". La organización militar de autodefensa judía bajo el Mandato Británico, predecesora de las Fuerzas de Defensa de Israel. Su valor es 63.',
    relatedVerses: []
  },
  {
    id: 'hatikvah',
    hebrew: 'התקוה',
    spanish: 'Hatikvah',
    category: 'concepto',
    tags: ['esperanza', 'himno', 'sionismo'],
    mysticalNote: '"La Esperanza". El himno nacional de Israel, basado en un poema de Naftali Herz Imber. Su valor es 516, idéntico a las 516 súplicas de Moisés para cruzar a la Tierra de Israel en el Midrash.',
    relatedVerses: []
  },
  {
    id: 'ben_gurion',
    hebrew: 'בן גוריון',
    spanish: 'David Ben-Gurión',
    category: 'nombre',
    tags: ['fundador', 'independencia', 'liderazgo'],
    mysticalNote: 'El primer primer ministro de Israel y el arquitecto del Estado moderno. Su valor es 321, que reduce a 6 (el número de la conexión física y espiritual de la letra Vav).',
    relatedVerses: []
  },
  {
    id: 'herzl',
    hebrew: 'הרצל',
    spanish: 'Theodor Herzl',
    category: 'nombre',
    tags: ['visionario', 'congreso', 'política'],
    mysticalNote: 'El visionario del Estado judío. Su valor es 325, que equivale a "Barak" (relámpago o destello de genialidad). Su profecía en Basilea se cumplió exactamente 50 años después.',
    relatedVerses: []
  },
  {
    id: 'balfour',
    hebrew: 'בלפור',
    spanish: 'Declaración Balfour',
    category: 'concepto',
    tags: ['documento', 'reconocimiento', 'imperio británico'],
    mysticalNote: 'El documento oficial británico de 1917 que reconoció el derecho del pueblo judío a establecer un "hogar nacional" en Palestina. Su valor es 316.',
    relatedVerses: []
  },
  {
    id: 'basilea',
    hebrew: 'בזל',
    spanish: 'Basilea',
    category: 'concepto',
    tags: ['ciudad', 'congreso', 'origen'],
    mysticalNote: 'La ciudad suiza donde se celebró el Primer Congreso Sionista en 1897. Su valor es 39.',
    relatedVerses: []
  },
  {
    id: 'medinat_yisrael',
    hebrew: 'מדינת ישראל',
    spanish: 'Estado de Israel',
    category: 'concepto',
    tags: ['estado', 'independencia', 'soberanía'],
    mysticalNote: 'El nombre oficial del Estado judío fundado en 1948. Su valor es 1045, que contiene numéricamente los anhelos de consuelo y redención profetizados en Isaías.',
    relatedVerses: []
  },
  {
    id: 'knesset',
    hebrew: 'כנסת',
    spanish: 'Knesset',
    category: 'concepto',
    tags: ['parlamento', 'reunión', 'democracia'],
    mysticalNote: 'El Parlamento de Israel. Su nombre proviene de la "Kneset HaGedolah" (la Gran Asamblea) de la época del Segundo Templo, que constaba de 120 miembros. Su valor es 510.',
    relatedVerses: []
  },
  {
    id: 'tzahal',
    hebrew: 'צהל',
    spanish: 'Fuerzas de Defensa de Israel',
    category: 'concepto',
    tags: ['ejército', 'defensa', 'heroísmo'],
    mysticalNote: 'Acrónimo de Tzeva Hahaganah LeYisrael. Representa el escudo físico del pueblo en su patria soberana. Su valor es 125.',
    relatedVerses: []
  },
  {
    id: 'ein_sof',
    hebrew: 'אין סוף',
    spanish: 'Ein Sof',
    category: 'divino',
    tags: ['cábala', 'infinito', 'emanación'],
    mysticalNote: 'El Infinito — la esencia divina antes de toda emanación. En la Cábala, Ein Sof es el origen sin límite del que descienden las Sefirot.',
    relatedVerses: []
  },
  {
    id: 'shekhinah',
    hebrew: 'שכינה',
    spanish: 'Shejiná',
    category: 'divino',
    tags: ['presencia', 'cábala', 'femenino divino'],
    mysticalNote: 'La Presencia Divina que mora con Israel. En la tradición mística es la manifestación inmanente de lo Divino, asociada a la redención y al retorno.',
    relatedVerses: ['Éxodo 25:8']
  },
  {
    id: 'chai',
    hebrew: 'חי',
    spanish: 'Jai (Vida)',
    category: 'concepto',
    tags: ['vida', '18', 'bendición'],
    mysticalNote: 'Vida. Su valor es 18, número central de la tradición judía de bendición y donativos (chai). Resonancia con el Árbol de la Vida.',
    relatedVerses: ['Génesis 2:7']
  },
  {
    id: 'mitzvah',
    hebrew: 'מצוה',
    spanish: 'Mitzvá',
    category: 'concepto',
    tags: ['mandamiento', 'alianza', 'práctica'],
    mysticalNote: 'Mandamiento o acto sagrado. Cada mitzvá es un puente entre lo humano y lo divino; su valor es 141.',
    relatedVerses: ['Deuteronomio 6:1']
  },
  {
    id: 'geulah',
    hebrew: 'גאולה',
    spanish: 'Gueulá (Redención)',
    category: 'concepto',
    tags: ['redención', 'sionismo', 'esperanza'],
    mysticalNote: 'La redención nacional y espiritual. Puente entre el anhelo de retorno a Sión y la restauración cósmica en la Cábala.',
    relatedVerses: ['Éxodo 6:6']
  },
  {
    id: 'brit',
    hebrew: 'ברית',
    spanish: 'Brit (Alianza)',
    category: 'concepto',
    tags: ['alianza', 'pacto', 'abrahmico'],
    mysticalNote: 'La alianza entre Dios y el pueblo. Su valor es 612. Fundamento de la identidad y de la promesa de la tierra.',
    relatedVerses: ['Génesis 17:7']
  },
  {
    id: 'tikkun',
    hebrew: 'תיקון',
    spanish: 'Tikún (Reparación)',
    category: 'concepto',
    tags: ['cábala', 'reparación', 'mundo'],
    mysticalNote: 'Tikún Olam — la reparación del mundo. En Luria, el trabajo humano de reunir las chispas divinas dispersas.',
    relatedVerses: []
  }
];

const HISTORICAL_EVENTS = [
  { year: -1313, label: '~1313 a.C.', title: 'Entrega de la Torá en Sinaí', desc: 'Según la tradición, la revelación en el monte Sinaí establece la alianza nacional y la Torá como eje espiritual de Israel.', hebrewYear: 'ב\'תמ"ח', gematriaMatches: [611, 130], searchTerms: ['תורה', 'סיני', 'משה'] },
  { year: -586, label: '586 a.C.', title: 'Destrucción del Primer Templo', desc: 'El Templo de Salomón es destruido por los babilonios, dando inicio al primer exilio judío.', hebrewYear: 'ג\'קכ"ד', gematriaMatches: [586], searchTerms: ['מקדש', 'בבל', 'גלות'] },
  { year: -516, label: '516 a.C.', title: 'Dedicación del Segundo Templo', desc: 'Tras el retorno de Babilonia, se dedica el Segundo Templo en Jerusalén, símbolo de la renovación nacional.', hebrewYear: 'ג\'רמ"ח', gematriaMatches: [516, 444], searchTerms: ['מקדש', 'ירושלים', 'שיבה'] },
  { year: 70, label: '70 d.C.', title: 'Destrucción del Segundo Templo', desc: 'Los romanos destruyen Jerusalén y el Segundo Templo, iniciando el exilio prolongado (Galut).', hebrewYear: 'ג\'תת"ק', gematriaMatches: [70, 800], searchTerms: ['רומא', 'ירושלים', 'מקדש'] },
  { year: 135, label: '135 d.C.', title: 'Caída de Betar (Bar Kojba)', desc: 'Fin de la revuelta de Bar Kojba. Intensificación del exilio y de la esperanza mesiánica de retorno.', hebrewYear: 'ג\'תתצ"ה', gematriaMatches: [135], searchTerms: ['ביתר', 'גלות', 'ציון'] },
  { year: 1492, label: '1492', title: 'Expulsión de España', desc: 'Los Reyes Católicos decretan la expulsión de los judíos de España (Sefarad). Gran migración espiritual.', hebrewYear: 'ה\'רנ"ב', gematriaMatches: [1492, 252], searchTerms: ['ספרד', 'גורש', 'גלות'] },
  { year: 1882, label: '1882', title: 'Primera Aliyá & BILU', desc: 'Inicia el retorno sionista agrícola moderno. Fundación de Rishon LeZion y Petaj Tikva.', hebrewYear: 'תרמ"ב', gematriaMatches: [1882, 642, 48], searchTerms: ['ביל"ו', 'עליה', 'ציון'] },
  { year: 1897, label: '1897', title: 'Congreso de Basilea', desc: 'Theodor Herzl preside el Primer Congreso Sionista Mundial en Basilea, formulando el Programa Sionista.', hebrewYear: 'תרנ"ז', gematriaMatches: [1897, 657, 325, 39], searchTerms: ['הרצל', 'בזל', 'מדינה'] },
  { year: 1917, label: '1917', title: 'Declaración Balfour', desc: 'Gran Bretaña expresa apoyo a un hogar nacional judío en Palestina, catalizando la diplomacia sionista.', hebrewYear: 'תרע"ח', gematriaMatches: [1917, 678], searchTerms: ['בלפור', 'ציון', 'ארץ'] },
  { year: 1948, label: '1948', title: 'Declaración del Estado de Israel', desc: 'Proclamada el 14 de mayo por David Ben-Gurión, marcando la soberanía nacional judía tras 19 siglos.', hebrewYear: 'תש"ח', gematriaMatches: [1948, 708, 1045, 321], searchTerms: ['ישראל', 'מדינה', 'תש"ח', 'אייר'] },
  { year: 1967, label: '1967', title: 'Guerra de los Seis Días', desc: 'Reunificación de Jerusalén, recuperando el acceso al Muro de los Lamentos y el casco antiguo.', hebrewYear: 'תשכ"ז', gematriaMatches: [1967, 727, 582], searchTerms: ['ירושלים', 'ציון', 'שלום'] },
  { year: 1979, label: '1979', title: 'Paz Egipto–Israel', desc: 'Tratado de Camp David: primer acuerdo de paz entre Israel y un Estado árabe vecino.', hebrewYear: 'תשל"ט', gematriaMatches: [1979, 739, 376], searchTerms: ['שלום', 'מצרים', 'ישראל'] },
  { year: 1993, label: '1993', title: 'Acuerdos de Oslo', desc: 'Primer acuerdo cara a cara entre el Estado de Israel y la OLP para buscar una paz regional.', hebrewYear: 'תשנ"ג', gematriaMatches: [1993, 753], searchTerms: ['שלום', 'ישראל', 'ברית'] }
];

const LEGENDARY_PAIRS = [
  {
    title: 'Amor y Unidad',
    wordA: 'אהבה',
    labelA: 'Ahavá (Amor)',
    wordB: 'אחד',
    labelB: 'Ejad (Unidad)',
    synopsis: 'Ambas palabras valen 13. Su suma es 26, el valor exacto del Nombre Inefable YHVH (יהוה). Enseña que la presencia divina se manifiesta cuando el amor culmina en unidad.',
    theme: 'espiritual'
  },
  {
    title: 'Sión y José',
    wordA: 'ציון',
    labelA: 'Tzion (Sión)',
    wordB: 'יוסף',
    labelB: 'Yosef (José)',
    synopsis: 'Ambas comparten el valor exacto de 156. Muestra que el retorno a Sión es la materialización del arquetipo de José (la reconstrucción económica, agrícola y física de la nación).',
    theme: 'sionismo'
  },
  {
    title: 'Mesías y Serpiente',
    wordA: 'משיח',
    labelA: 'Mashiach (Mesías)',
    wordB: 'נחש',
    labelB: 'Najash (Serpiente)',
    synopsis: 'Ambas poseen el valor idéntico de 358. La Cábala enseña que la fuerza que originó el error es la misma que, transmutada por la sabiduría, engendra la redención.',
    theme: 'mistica'
  },
  {
    title: 'Elohim y La Naturaleza',
    wordA: 'אלהים',
    labelA: 'Elohim (Dios Creador)',
    wordB: 'הטבע',
    labelB: 'HaTeva (La Naturaleza)',
    synopsis: 'Ambas valen 86. Revela que el orden cósmico y las leyes de la física son la manifestación visible del juicio y diseño divino en el universo.',
    theme: 'filosofia'
  },
  {
    title: 'Israel y Torá',
    wordA: 'ישראל',
    labelA: 'Yisrael (541)',
    wordB: 'תורה',
    labelB: 'Torah (611)',
    synopsis: 'La diferencia entre Torá (611) e Israel (541) es exactamente 70 (la letra Ayin - ojo / visión), aludiendo a las 70 facetas de la Torá y las 70 naciones del mundo.',
    theme: 'estudio'
  },
  {
    title: 'Salomón y Shalom (Paz)',
    wordA: 'שלמה',
    labelA: 'Shlomo (Salomón)',
    wordB: 'שלום',
    labelB: 'Shalom (Paz)',
    synopsis: 'Ambas valen 376. Salomón recibió ese nombre profético porque su reinado fue una era de integración armónica y paz duradera.',
    theme: 'historia'
  }
];

// --- 4. DICCIONARIO SEMÁNTICO CONCEPTUAL ESPAÑOL - HEBREO ---
const SPANISH_HEBREW_DICT = [
  { spanish: 'amor', hebrew: 'אהבה', transliteration: 'Ahava', gematria: 13, category: 'virtud', tags: ['sentimiento', 'cariño', 'afecto', 'union'] },
  { spanish: 'uno', hebrew: 'אחד', transliteration: 'Echad', gematria: 13, category: 'divino', tags: ['unidad', 'unico', 'monoteismo', 'dios'] },
  { spanish: 'unidad', hebrew: 'אחדות', transliteration: 'Achdut', gematria: 419, category: 'concepto', tags: ['uno', 'cohesion', 'hermandad'] },
  { spanish: 'paz', hebrew: 'שלום', transliteration: 'Shalom', gematria: 376, category: 'virtud', tags: ['tranquilidad', 'armonia', 'saludo', 'completitud'] },
  { spanish: 'verdad', hebrew: 'אמת', transliteration: 'Emet', gematria: 441, category: 'virtud', tags: ['sinceridad', 'certeza', 'realidad', 'sello'] },
  { spanish: 'vida', hebrew: 'חיים', transliteration: 'Chayim', gematria: 68, category: 'concepto', tags: ['vitalidad', 'existencia', 'vivir'] },
  { spanish: 'vivo', hebrew: 'חי', transliteration: 'Chai', gematria: 18, category: 'concepto', tags: ['vida', 'existente', '18', 'suerte'] },
  { spanish: 'luz', hebrew: 'אור', transliteration: 'Or', gematria: 207, category: 'mística', tags: ['iluminacion', 'claridad', 'brillo', 'creacion'] },
  { spanish: 'fuego', hebrew: 'אש', transliteration: 'Esh', gematria: 301, category: 'naturaleza', tags: ['llama', 'pasion', 'ardor', 'elemento'] },
  { spanish: 'agua', hebrew: 'מים', transliteration: 'Mayim', gematria: 90, category: 'naturaleza', tags: ['torah', 'pureza', 'vida', 'fluir'] },
  { spanish: 'tierra', hebrew: 'ארץ', transliteration: 'Eretz', gematria: 291, category: 'naturaleza', tags: ['mundo', 'israel', 'suelo', 'pais'] },
  { spanish: 'cielo', hebrew: 'שמים', transliteration: 'Shamayim', gematria: 390, category: 'naturaleza', tags: ['firmamento', 'elevacion', 'astros'] },
  { spanish: 'dios', hebrew: 'אלהים', transliteration: 'Elohim', gematria: 86, category: 'divino', tags: ['creador', 'senor', 'todopoderoso', 'juez'] },
  { spanish: 'tetragramaton', hebrew: 'יהוה', transliteration: 'YHVH', gematria: 26, category: 'divino', tags: ['nombre inefable', 'dios', 'eterno', 'misericordia'] },
  { spanish: 'todopoderoso', hebrew: 'שדי', transliteration: 'Shaddai', gematria: 314, category: 'divino', tags: ['dios', 'guardian', 'protector'] },
  { spanish: 'rey', hebrew: 'מלך', transliteration: 'Melech', gematria: 90, category: 'liderazgo', tags: ['soberano', 'gobernante', 'majestad'] },
  { spanish: 'reino', hebrew: 'מלכות', transliteration: 'Maljut', gematria: 496, category: 'sefirah', tags: ['realeza', 'manifestacion', 'mundo fisico'] },
  { spanish: 'sabiduria', hebrew: 'חכמה', transliteration: 'Jojmah', gematria: 73, category: 'sefirah', tags: ['entendimiento', 'mente', 'destello', 'luz'] },
  { spanish: 'entendimiento', hebrew: 'בינה', transliteration: 'Binah', gematria: 67, category: 'sefirah', tags: ['discernimiento', 'intuicion', 'madre'] },
  { spanish: 'corona', hebrew: 'כתר', transliteration: 'Keter', gematria: 620, category: 'sefirah', tags: ['voluntad suprema', 'origen', 'cima'] },
  { spanish: 'bondad', hebrew: 'חסד', transliteration: 'Chesed', gematria: 72, category: 'sefirah', tags: ['misericordia', 'gracia', 'amor infinito', 'dar'] },
  { spanish: 'misericordia', hebrew: 'רחמים', transliteration: 'Rachamim', gematria: 298, category: 'virtud', tags: ['compasion', 'perdon', 'piedad'] },
  { spanish: 'fuerza', hebrew: 'גבורה', transliteration: 'Gevurah', gematria: 216, category: 'sefirah', tags: ['poder', 'justicia', 'limite', 'rigor', 'valentia'] },
  { spanish: 'poder', hebrew: 'כח', transliteration: 'Koach', gematria: 28, category: 'concepto', tags: ['fuerza', 'energia', 'capacidad'] },
  { spanish: 'belleza', hebrew: 'תפארת', transliteration: 'Tiferet', gematria: 1081, category: 'sefirah', tags: ['armonia', 'equilibrio', 'esplendor', 'verdad'] },
  { spanish: 'victoria', hebrew: 'נצח', transliteration: 'Netzach', gematria: 148, category: 'sefirah', tags: ['eternidad', 'triunfo', 'persistencia'] },
  { spanish: 'gloria', hebrew: 'הוד', transliteration: 'Hod', gematria: 15, category: 'sefirah', tags: ['esplendor', 'reconocimiento', 'majestad'] },
  { spanish: 'fundamento', hebrew: 'יסוד', transliteration: 'Yesod', gematria: 80, category: 'sefirah', tags: ['canal', 'conexion', 'conexion divina'] },
  { spanish: 'alma', hebrew: 'נשמה', transliteration: 'Neshamah', gematria: 395, category: 'espiritual', tags: ['espiritu', 'aliento', 'conciencia', 'mente'] },
  { spanish: 'espiritu', hebrew: 'רוח', transliteration: 'Ruach', gematria: 214, category: 'espiritual', tags: ['viento', 'soplo', 'fuerza vital'] },
  { spanish: 'corazon', hebrew: 'לב', transliteration: 'Lev', gematria: 32, category: 'cuerpo', tags: ['32 senderos', 'emocion', 'centro', 'sabiduria'] },
  { spanish: 'hombre', hebrew: 'אדם', transliteration: 'Adam', gematria: 45, category: 'humanidad', tags: ['ser humano', 'persona', 'primer hombre'] },
  { spanish: 'mujer', hebrew: 'אשה', transliteration: 'Ishah', gematria: 306, category: 'humanidad', tags: ['femenino', 'esposa', 'matriz'] },
  { spanish: 'pueblo', hebrew: 'עם', transliteration: 'Am', gematria: 110, category: 'colectivo', tags: ['nacion', 'gente', 'comunidad'] },
  { spanish: 'israel', hebrew: 'ישראל', transliteration: 'Yisrael', gematria: 541, category: 'colectivo', tags: ['pueblo de dios', 'tierra santa', 'jacob'] },
  { spanish: 'jerusalen', hebrew: 'ירושלים', transliteration: 'Yerushalayim', gematria: 586, category: 'lugar', tags: ['capital', 'ciudad santa', 'sion', 'paz'] },
  { spanish: 'sion', hebrew: 'ציון', transliteration: 'Tzion', gematria: 156, category: 'lugar', tags: ['jerusalen', 'monte', 'retorno', 'sionismo'] },
  { spanish: 'redencion', hebrew: 'גאולה', transliteration: 'Geulah', gematria: 45, category: 'mística', tags: ['salvacion', 'liberacion', 'era mesianica'] },
  { spanish: 'salvacion', hebrew: 'ישועה', transliteration: 'Yeshuah', gematria: 391, category: 'mística', tags: ['socorro', 'ayuda divina', 'liberacion'] },
  { spanish: 'mesias', hebrew: 'משיח', transliteration: 'Mashiach', gematria: 358, category: 'mística', tags: ['ungido', 'libertador', 'redentor', 'rey david'] },
  { spanish: 'tora', hebrew: 'תורה', transliteration: 'Torah', gematria: 611, category: 'sagrado', tags: ['ley', 'ensenanza', 'biblia', 'pentateuco'] },
  { spanish: 'mandamiento', hebrew: 'מצוה', transliteration: 'Mitzvah', gematria: 513, category: 'sagrado', tags: ['precepto', 'buena accion', 'conexion'] },
  { spanish: 'pacto', hebrew: 'ברית', transliteration: 'Brit', gematria: 612, category: 'sagrado', tags: ['alianza', 'circuncision', 'compromiso'] },
  { spanish: 'sabado', hebrew: 'שבת', transliteration: 'Shabbat', gematria: 702, category: 'sagrado', tags: ['descanso', 'septimo dia', 'santidad', 'paz'] },
  { spanish: 'arrepentimiento', hebrew: 'תשובה', transliteration: 'Teshuvah', gematria: 713, category: 'virtud', tags: ['retorno', 'correccion', 'perdon'] },
  { spanish: 'rectificacion', hebrew: 'תיקון', transliteration: 'Tikkun', gematria: 516, category: 'mística', tags: ['reparacion', 'tikkun olam', 'orden'] },
  { spanish: 'santo', hebrew: 'קדוש', transliteration: 'Kadosh', gematria: 410, category: 'sagrado', tags: ['santidad', 'elevado', 'sagrado', 'puro'] },
  { spanish: 'santidad', hebrew: 'קדושה', transliteration: 'Kedushah', gematria: 415, category: 'sagrado', tags: ['pureza', 'elevacion', 'espiritualidad'] },
  { spanish: 'justo', hebrew: 'צדיק', transliteration: 'Tzadik', gematria: 204, category: 'virtud', tags: ['hombre justo', 'pilar del mundo', 'recto'] },
  { spanish: 'justicia', hebrew: 'צדק', transliteration: 'Tzedek', gematria: 194, category: 'virtud', tags: ['rectitud', 'equidad', 'ley'] },
  { spanish: 'caridad', hebrew: 'צדקה', transliteration: 'Tzedakah', gematria: 199, category: 'virtud', tags: ['justicia social', 'donacion', 'ayuda'] },
  { spanish: 'profeta', hebrew: 'נביא', transliteration: 'Navi', gematria: 63, category: 'liderazgo', tags: ['visionario', 'mensajero divino'] },
  { spanish: 'profecia', hebrew: 'נבואה', transliteration: 'Nevuah', gematria: 68, category: 'espiritual', tags: ['vision', 'revelacion', 'mensaje'] },
  { spanish: 'bendicion', hebrew: 'ברכה', transliteration: 'Berajah', gematria: 232, category: 'sagrado', tags: ['prosperidad', 'bien', 'abundancia'] },
  { spanish: 'oracion', hebrew: 'תפלה', transliteration: 'Tefilah', gematria: 515, category: 'sagrado', tags: ['rezo', 'conexion', 'suplica'] },
  { spanish: 'esperanza', hebrew: 'תקוה', transliteration: 'Tikvah', gematria: 511, category: 'virtud', tags: ['hatikvah', 'fe', 'anhelo'] },
  { spanish: 'fe', hebrew: 'אמונה', transliteration: 'Emunah', gematria: 102, category: 'virtud', tags: ['confianza', 'creencia', 'fidelidad'] },
  { spanish: 'gracia', hebrew: 'חן', transliteration: 'Chen', gematria: 58, category: 'virtud', tags: ['favor', 'simpatia', 'belleza interior'] },
  { spanish: 'alegria', hebrew: 'שמחה', transliteration: 'Simchah', gematria: 353, category: 'virtud', tags: ['felicidad', 'gozo', 'celebracion'] },
  { spanish: 'secreto', hebrew: 'סוד', transliteration: 'Sod', gematria: 70, category: 'mística', tags: ['misterio', 'cabala', 'oculto'] },
  { spanish: 'arbol', hebrew: 'עץ', transliteration: 'Etz', gematria: 160, category: 'naturaleza', tags: ['arbol de la vida', 'planta', 'madera'] },
  { spanish: 'sol', hebrew: 'שמש', transliteration: 'Shemesh', gematria: 640, category: 'astros', tags: ['astro rey', 'dia', 'calor'] },
  { spanish: 'luna', hebrew: 'ירח', transliteration: 'Yareach', gematria: 218, category: 'astros', tags: ['noche', 'mes', 'calendario'] },
  { spanish: 'estrella', hebrew: 'כוכב', transliteration: 'Kojav', gematria: 48, category: 'astros', tags: ['firmamento', 'guia', 'luz nocturna'] },
  { spanish: 'camino', hebrew: 'דרך', transliteration: 'Derech', gematria: 234, category: 'concepto', tags: ['sendero', 'via', 'conducta'] },
  { spanish: 'puerta', hebrew: 'שער', transliteration: 'Shaar', gematria: 570, category: 'concepto', tags: ['porton', 'acceso', 'portal'] },
  { spanish: 'heroe', hebrew: 'גבור', transliteration: 'Gibor', gematria: 211, category: 'fuerza', tags: ['valiente', 'soldado', 'defensor', 'fdi'] },
  { spanish: 'defensa', hebrew: 'הגנה', transliteration: 'Haganah', gematria: 63, category: 'fuerza', tags: ['proteccion', 'fuerzas de defensa', 'escudo'] },
  { spanish: 'escudo', hebrew: 'מגן', transliteration: 'Magen', gematria: 93, category: 'fuerza', tags: ['magen david', 'amparo', 'proteccion'] },
  { spanish: 'ejercito', hebrew: 'צבא', transliteration: 'Tzava', gematria: 93, category: 'fuerza', tags: ['tzahal', 'tropas', 'huestes'] },
  { spanish: 'espada', hebrew: 'חרב', transliteration: 'Cherev', gematria: 218, category: 'fuerza', tags: ['arma', 'filo', 'combate'] },
  { spanish: 'milagro', hebrew: 'נס', transliteration: 'Nes', gematria: 110, category: 'mística', tags: ['prodigio', 'maravilla', 'intervencion divina'] },
  { spanish: 'desierto', hebrew: 'מדבר', transliteration: 'Midbar', gematria: 246, category: 'lugar', tags: ['sinai', 'exodo', 'purificacion'] },
  { spanish: 'templo', hebrew: 'מקדש', transliteration: 'Mikdash', gematria: 444, category: 'sagrado', tags: ['santuario', 'casa de dios', 'jerusalen'] },
  { spanish: 'angel', hebrew: 'מלאך', transliteration: 'Malaj', gematria: 91, category: 'espiritual', tags: ['mensajero celestial', 'guia'] },
  { spanish: 'padre', hebrew: 'אב', transliteration: 'Av', gematria: 3, category: 'familia', tags: ['patriarca', 'origen', 'progenitor'] },
  { spanish: 'madre', hebrew: 'אם', transliteration: 'Em', gematria: 41, category: 'familia', tags: ['matriarca', 'origen', 'vida'] },
  { spanish: 'hijo', hebrew: 'בן', transliteration: 'Ben', gematria: 52, category: 'familia', tags: ['descendiente', 'heredero'] },
  { spanish: 'hija', hebrew: 'בת', transliteration: 'Bat', gematria: 402, category: 'familia', tags: ['descendiente', 'mujer'] },
  { spanish: 'hermano', hebrew: 'אח', transliteration: 'Ach', gematria: 9, category: 'familia', tags: ['fraternidad', 'companero'] }
];

// ==========================================================================
// COLECCIÓN DE SALMOS (TEHILIM) Y PLEGARIAS SAGRADAS (CARACTERÍSTICA 2)
// ==========================================================================

const TEHILIM_PSALMS = [
  {
    id: 'psalm-23',
    number: 23,
    title: 'Salmo 23 (Mizmor LeDavid)',
    hebrewTitle: 'מזמור לדוד יהוה רעי',
    category: 'confianza',
    intention: 'Confianza, Sustento y Paz Interior',
    verses: [
      {
        verseNum: 1,
        hebrew: 'מזמור לדוד יהוה רעי לא אחסר',
        spanish: 'Salmo de David. El Señor es mi pastor; nada me faltará.',
        gematria: 923
      },
      {
        verseNum: 2,
        hebrew: 'בנאות דשא ירביצני על מי מנוחות ינהלני',
        spanish: 'En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.',
        gematria: 1374
      },
      {
        verseNum: 3,
        hebrew: 'נפשי ישובב ינחני במעגלי צדק למען שמו',
        spanish: 'Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.',
        gematria: 1076
      },
      {
        verseNum: 4,
        hebrew: 'גם כי אלך בגיא צלמות לא אירא רע כי אתה עמדי שבטך ומשענתך המה ינחמני',
        spanish: 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento.',
        gematria: 2348
      },
      {
        verseNum: 5,
        hebrew: 'תערך לפני שלחן נגד צררי דשנת בשמן ראשי כוסי רויה',
        spanish: 'Aderezas mesa delante de mí en presencia de mis angustiadores; unges mi cabeza con aceite; mi copa está rebosando.',
        gematria: 2217
      },
      {
        verseNum: 6,
        hebrew: 'אך טוב וחסד ירדפוני כל ימי חיי ושבתי בבית יהוה לארך ימים',
        spanish: 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa del Señor moraré por largos días.',
        gematria: 1533
      }
    ],
    totalGematria: 9471,
    mysticalNotes: 'Uno de los salmos más recitados para abrir las puertas del sustento (Parnasá) y disipar la ansiedad espiritual.'
  },
  {
    id: 'psalm-91',
    number: 91,
    title: 'Salmo 91 (Shir Shel Pegaim - Salmo de Protección)',
    hebrewTitle: 'ישב בסתר עליון בצל שדי יתלונן',
    category: 'proteccion',
    intention: 'Máxima Protección Espiritual y Amparo Divino',
    verses: [
      {
        verseNum: 1,
        hebrew: 'ישב בסתר עליון בצל שדי יתלונן',
        spanish: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.',
        gematria: 1475
      },
      {
        verseNum: 2,
        hebrew: 'אמר ליהוה מחסי ומצודתי אלהי אבטח בו',
        spanish: 'Diré yo al Señor: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.',
        gematria: 852
      },
      {
        verseNum: 4,
        hebrew: 'באברתו יסך לך ותחת כנפיו תחסה צנה וסחרה אמתו',
        spanish: 'Con sus plumas te cubrirá, y debajo de sus alas estarás seguro; escudo y adarga es su verdad.',
        gematria: 2471
      },
      {
        verseNum: 11,
        hebrew: 'כי מלאכיו יצוה לך לשמרך בכל דרכיך',
        spanish: 'Pues a sus ángeles mandará acerca de ti, que te guarden en todos tus caminos.',
        gematria: 876
      }
    ],
    totalGematria: 5674,
    mysticalNotes: 'El salmo supremo de protección utilizado tradicionalmente por los soldados de Israel y antes del descanso nocturno.'
  },
  {
    id: 'psalm-121',
    number: 121,
    title: 'Salmo 121 (Shir LaMaalot - Cántico Gradual)',
    hebrewTitle: 'שיר למעלות אשא עיני אל ההרים',
    category: 'elevacion',
    intention: 'Auxilio Celestial en Momentos de Prueba',
    verses: [
      {
        verseNum: 1,
        hebrew: 'שיר למעלות אשא עיני אל ההרים מאין יבא עזרי',
        spanish: 'Cántico gradual. Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro?',
        gematria: 1530
      },
      {
        verseNum: 2,
        hebrew: 'עזרי מעם יהוה עשה שמים וארץ',
        spanish: 'Mi socorro viene del Señor, que hizo los cielos y la tierra.',
        gematria: 1137
      },
      {
        verseNum: 4,
        hebrew: 'הנה לא ינום ולא יישן שומר ישראל',
        spanish: 'He aquí, no se adormecerá ni dormirá el que guarda a Israel.',
        gematria: 1339
      },
      {
        verseNum: 8,
        hebrew: 'יהוה ישמר צאתך ובואך מעתה ועד עולם',
        spanish: 'El Señor guardará tu salida y tu entrada desde ahora y para siempre.',
        gematria: 1238
      }
    ],
    totalGematria: 5244,
    mysticalNotes: 'Cántico de ascenso espiritual que conecta con el Guardián de Israel (Shomer Yisrael).'
  },
  {
    id: 'psalm-130',
    number: 130,
    title: 'Salmo 130 (MiMaamakim - De lo Profundo)',
    hebrewTitle: 'שיר המעלות ממעמקים קראתיך יהוה',
    category: 'sanacion',
    intention: 'Sanación, Perdón y Elevación del Alma',
    verses: [
      {
        verseNum: 1,
        hebrew: 'שיר המעלות ממעמקים קראתיך יהוה',
        spanish: 'Cántico gradual. De lo profundo, oh Señor, a ti clamo.',
        gematria: 1515
      },
      {
        verseNum: 5,
        hebrew: 'קויתי יהוה קותה נפשי ולדברו הוחלתי',
        spanish: 'Esperé yo al Señor, esperó mi alma; en su palabra he esperado.',
        gematria: 1047
      },
      {
        verseNum: 7,
        hebrew: 'יחל ישראל אל יהוה כי עם יהוה החסד והרבה עמו פדות',
        spanish: 'Espere Israel al Señor, porque en el Señor hay misericordia, y abundante redención con él.',
        gematria: 1729
      }
    ],
    totalGematria: 4291,
    mysticalNotes: 'Recitado en momentos de introspección profunda (Teshuva) y curación de aflicciones.'
  },
  {
    id: 'psalm-150',
    number: 150,
    title: 'Salmo 150 (Haleluya - Culminación)',
    hebrewTitle: 'הללויה הללו אל בקדשו',
    category: 'gratitud',
    intention: 'Alabanza Pura, Gozo y Gratitud Cósmica',
    verses: [
      {
        verseNum: 1,
        hebrew: 'הללויה הללו אל בקדשו הללוהו ברקיע עזו',
        spanish: 'Alabad a Dios en su santuario; alabadle en la magnificencia de su firmamento.',
        gematria: 846
      },
      {
        verseNum: 6,
        hebrew: 'כל הנשמה תהלל יה הללויה',
        spanish: 'Todo lo que respira alabe al Señor. ¡Aleluya!',
        gematria: 565
      }
    ],
    totalGematria: 1411,
    mysticalNotes: 'El cierre triunfal del libro de Tehilim donde cada respiración (Neshama) se convierte en alabanza.'
  }
];

const SACRED_PRAYERS = [
  {
    id: 'shema',
    name: 'Shemá Israel (Declaración de Unidad)',
    hebrew: 'שמע ישראל יהוה אלהינו יהוה אחד',
    transliteration: 'Shemá Yisrael, Adonai Eloheinu, Adonai Ejad',
    spanish: 'Escucha, Israel: el Señor es nuestro Dios, el Señor uno es.',
    source: 'Deuteronomio 6:4',
    letterCount: 25,
    gematria: 1118,
    reduced: 2,
    purpose: 'La proclamación fundamental de la Unicidad divina y devoción suprema.'
  },
  {
    id: 'birkat-kohanim',
    name: 'Birkat Kohanim (Bendición Sacerdotal Triple)',
    hebrew: 'יברכך יהוה וישמרך יאר יהוה פניו אליך ויחנך ישא יהוה פניו אליך וישם לך שלום',
    transliteration: 'Yevarejeja Adonai veyishmereja, Yaer Adonai panav eleja vijuneka, Yisa Adonai panav eleja veyasem leja Shalom',
    source: 'Números 6:24-26',
    letterCount: 60,
    gematria: 2680,
    reduced: 7,
    purpose: 'Canalizar bendición de protección, gracia divina y paz integral (Shalom).'
  },
  {
    id: 'ana-bekoach',
    name: 'Ana Bekoaj (Oración Cabalística de 42 Letras)',
    hebrew: 'אנא בכח גדלת ימינך תתיר צרורה',
    transliteration: 'Ana Bejoaj Guedulat Yeminja Tatir Tzerurah',
    source: 'Atribuida al Rabino Nejunjá ben HaKaná',
    letterCount: 42,
    gematria: 1891,
    reduced: 1,
    purpose: 'Elevar oraciones y desatar bloqueos kármicos conectando con el Nombre de 42 Letras.'
  },
  {
    id: 'shir-hashirim',
    name: 'Cantar de los Cantares (Shir HaShirim 8:6)',
    hebrew: 'שימני כחותם על לבך כחותם על זרועך כי עזה כמות אהבה',
    transliteration: 'Simeni jajotam al libeja jajotam al zeroeja ki azah jamavet ahavah',
    source: 'Cantar de los Cantares 8:6',
    letterCount: 43,
    gematria: 2196,
    reduced: 9,
    purpose: 'El sello de amor eterno entre el alma y lo Divino, más fuerte que la muerte.'
  }
];

// Exportación compatible tanto con módulos ES6 como con scripts convencionales del navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    HEBREW_LETTERS, 
    TORAH_VERSES, 
    ZIONIST_CORRELATIONS, 
    DAILY_REFLECTIONS,
    KNOWLEDGE_GRAPH,
    HISTORICAL_EVENTS,
    LEGENDARY_PAIRS,
    SPANISH_HEBREW_DICT,
    TEHILIM_PSALMS,
    SACRED_PRAYERS,
    ACROSTIC_EXAMPLES
  };
} else {
  window.GematriaDB = { 
    HEBREW_LETTERS, 
    TORAH_VERSES, 
    ZIONIST_CORRELATIONS, 
    DAILY_REFLECTIONS,
    KNOWLEDGE_GRAPH,
    HISTORICAL_EVENTS,
    LEGENDARY_PAIRS,
    SPANISH_HEBREW_DICT,
    TEHILIM_PSALMS,
    SACRED_PRAYERS,
    ACROSTIC_EXAMPLES
  };
}



