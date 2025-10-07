Planner (planner.ts)

Rol: arma el contexto del momento y la pregunta guía a partir del JSON.

Entradas: lessonJson (p.ej. lesson_test_001.json), momentoId.
Salidas: PlanDeMomento con actividad, descripcionImagen, evidencias[], preguntaGuia.

Funciones clave

export interface PlanDeMomento {
  momentoId: string;
  actividad: string;
  descripcionImagen: string;
  evidencias: string[];
  preguntaGuia: string;
}

export function cargarMomento(lessonJson: any, momentoId: string): PlanDeMomento {}

export function generarPreguntaGuia(plan: PlanDeMomento): string {}

export function extraerEvidencias(plan: PlanDeMomento): string[] {}

// Útil para inicializar intentos por momento
export function inicializarEstadoMomento(momentoId: string): { intentos: number } {}

Orchestrator (orchestrator.ts)

Rol: decide qué pasa ahora: repreguntar, dar pista, derivar al tutor o avanzar.

Entradas: PlanDeMomento, mensajeEstudiante, estadoIntentos, evaluacion (si aplica).
Salidas: accionSiguiente + payload (feedback/repregunta/pista o nextMomentoId).

Funciones clave

export type NextAction = "AVANZAR" | "REINTENTAR" | "DERIVAR_TUTOR";

export interface Decision {
  action: NextAction;
  mensajeParaEstudiante: string;     // feedback + instrucción
  repregunta?: string;
  pistaNivel?: 0 | 1 | 2 | 3;
  nextMomentoId?: string;
}

export function decidirSiguientePaso(
  plan: PlanDeMomento,
  estado: { intentos: number; maxIntentos: number },
  evaluacion: Evaluacion // ver Evaluator
): Decision {}

export function manejarRespuesta(
  plan: PlanDeMomento,
  estado: { intentos: number; maxIntentos: number },
  mensajeEstudiante: string
): Decision {
  // 1) pedir evaluación → Evaluator
  // 2) aplicar reglas de intentos y categoría → Decision
}

export function reformularPregunta(
  plan: PlanDeMomento,
  nivel: 1 | 2 | 3
): { repregunta: string; pistaNivel: 1 | 2 | 3 } {}

export function avanzarDeMomento(
  momentoActual: string,
  lessonJson: any
): string /* nextMomentoId */ {}

export function registrarIntento(estado: { intentos: number }): { intentos: number } {}


Reglas duras (sugeridas)

maxIntentos = 3.

Correcta ⇒ AVANZAR.

Parcial ⇒ REINTENTAR (1–2 repreguntas) y si no sube, AVANZAR con refuerzo.

Débil/Vaga ⇒ escalado de repreguntas/pistas (niveles 1→3); si no mejora al 3er intento: AVANZAR o DERIVAR_TUTOR si es fallo conceptual.

Tutor (tutor.ts y tutorPrompts.ts)

Rol: explica a profundidad cuando hay duda real o tema complejo.

Entradas: PlanDeMomento, mensajeEstudiante (duda/pregunta), gap detectado por Evaluator.
Salidas: explicación breve y accionable (máximo 3 pasos), con mini-ejemplo.

Funciones clave

export function explicarConcepto(
  plan: PlanDeMomento,
  duda: string
): { explicacion: string; miniEjemplo: string; checkRápido: string } {}

export function darPistasDirigidas(
  plan: PlanDeMomento,
  nivel: 1 | 2 | 3
): string /* pista concreta basada en evidencias/imagen */ {}

// En tutorPrompts.ts (plantillas)
export function plantillaExplicacion(plan: PlanDeMomento, gap: string): string {}
export function plantillaPista(plan: PlanDeMomento, nivel: 1 | 2 | 3): string {}

Evaluator (evaluator.ts)

Rol: puntúa, clasifica (CORRECTA/PARCIAL/DEBIL/VAGA), redacta feedback y propone repregunta+pista.

Entradas: PlanDeMomento, mensajeEstudiante.
Salidas: Evaluacion (score, categoría, feedback, repregunta/pista sugeridas, nextAction sugerida).

Dimensiones y categorías

Dimensiones (0–10 total): Relevancia(0–2), Exactitud(0–3), Razonamiento(0–2), Completitud(0–2), Claridad(0–1).

8–10: CORRECTA | 5–7: PARCIAL | 3–4: DEBIL | 0–2: VAGA.

Funciones clave

export type Categoria = "CORRECTA" | "PARCIAL" | "DEBIL" | "VAGA";

export interface Evaluacion {
  score: number;
  categoria: Categoria;
  dimensiones: {
    relevancia: number; exactitud: number; razonamiento: number; completitud: number; claridad: number;
  };
  feedback: string;                 // listo para estudiante
  repregunta?: string;              // propuesta (simplificada/desglosada/forzada)
  pistaNivel?: 0 | 1 | 2 | 3;       // 0 = sin pista
  nextAction: NextAction;
}

export function evaluarRespuesta(
  plan: PlanDeMomento,
  mensaje: string
): Evaluacion {}

export function evaluarPreguntaDelEstudiante(
  plan: PlanDeMomento,
  pregunta: string
): Evaluacion { /* usa criterios para preguntas (enfoque, profundidad, conexión, avance, claridad) */ }

export function generarRepreguntaYPista(
  plan: PlanDeMomento,
  categoria: Categoria,
  intentos: number
): { repregunta?: string; pistaNivel: 0 | 1 | 2 | 3 } {}

Checker (checker.ts)

Rol: soporte: higiene de entradas, seguridad, control de flujo.

Entradas: mensajeEstudiante, estadoIntentos, plan.
Salidas: flags/ajustes.

Funciones clave

export function sanitizarEntrada(m: string): string {}

export function esFueraDeTema(m: string, plan: PlanDeMomento): boolean {}

export function puedeAvanzar(
  categoria: Categoria,
  intentos: number,
  maxIntentos: number
): boolean {}

export function registrarLogEvento(
  tipo: "EVAL" | "DERIVACION" | "AVANCE" | "REINTENTO",
  detalle: any
): void {}

Contratos de datos compartidos (tipos comunes)
export interface EstadoMomento {
  momentoId: string;
  intentos: number;
  maxIntentos: number; // sugerido: 3
}

export interface MensajeEstudiante {
  tipo: "RESPUESTA" | "PREGUNTA";
  texto: string;
}

Flujo mínimo entre agentes (resumen operativo)

Planner → PlanDeMomento.

Orchestrator.manejarRespuesta recibe mensaje → llama a Evaluator.evaluarRespuesta.

Evaluator devuelve Evaluacion (+repregunta/pista/nextAction sugerida).

Orchestrator aplica reglas de intentos y decide:

AVANZAR → avanzarDeMomento()

REINTENTAR → reformularPregunta(nivel) y devuelve feedback+repregunta+pista

DERIVAR_TUTOR → Tutor.explicarConcepto / darPistasDirigidas

Checker se usa transversalmente (sanitizar, fuera de tema, logs, gating de avance).