import { PrismaClient } from '@prisma/client'
import { TopicContent } from '../src/types/topic-content'
import { getTopicImagesFromMCP } from '../src/services/mcp-client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // 1. Crear Carrera de SSO
  const ssoCareer = await prisma.career.upsert({
    where: { slug: 'sso' },
    update: {},
    create: {
      name: 'Seguridad y Salud Ocupacional',
      slug: 'sso',
      description: 'Carrera técnica en Seguridad y Salud Ocupacional según normativa peruana',
      icon: '🦺',
      color: '#FF6B35',
      durationMonths: 12,
      level: 'Técnico',
      isActive: true
    }
  })

  console.log('✅ Carrera SSO creada')

  // 2. Crear Instructor IA de SSO
  const ssoInstructor = await prisma.aIInstructor.upsert({
    where: { id: 'instructor_sso_001' },
    update: {},
    create: {
      id: 'instructor_sso_001',
      name: 'Prof. Claude - Instructor de SSO',
      specialty: 'Seguridad y Salud Ocupacional',
      bio: 'Instructor especializado en normativa peruana de seguridad y salud en el trabajo. Experto en IPERC, Ley 29783 y gestión de riesgos laborales.',
      avatar: '🧑‍🏫',
      modelId: 'claude-sonnet-4-5-20250929',
      systemPromptBase: 'Eres un instructor experto en Seguridad y Salud Ocupacional con conocimiento profundo de la normativa peruana.',
      temperature: 0.7,
      maxTokens: 2048,
      expertiseAreas: ['Ley 29783', 'IPERC', 'ISO 45001', 'Planes de Seguridad'],
      tone: 'Profesional, empático y motivador',
      isActive: true
    }
  })

  console.log('✅ Instructor SSO creado')

  // 3. Crear Curso de Fundamentos
  const fundamentosCourse = await prisma.course.upsert({
    where: { slug: 'fundamentos-sso' },
    update: {},
    create: {
      title: 'Fundamentos de Seguridad y Salud Ocupacional',
      slug: 'fundamentos-sso',
      description: 'Curso introductorio a la SSO según normativa peruana',
      type: 'CAREER',
      careerId: ssoCareer.id,
      order: 1,
      isPublished: true
    }
  })

  console.log('✅ Curso Fundamentos creado')

  // 4. Crear Tema IPERC con contenido completo
  const ipercContent: TopicContent = {
    topic: {
      id: 'topic_iperc_001',
      title: 'IPERC - Identificación de Peligros, Evaluación y Control de Riesgos',
      learning_objective: 'El estudiante comprenderá y aplicará la metodología IPERC para identificar peligros, evaluar riesgos y establecer controles según la Ley 29783 de Seguridad y Salud en el Trabajo del Perú',
      expected_learning: 'Al finalizar este tema, el estudiante será capaz de realizar una matriz IPERC básica identificando peligros, evaluando riesgos y proponiendo controles jerárquicos',
      key_points: [
        'Identificación de peligros en el área de trabajo',
        'Evaluación de riesgos usando matriz de probabilidad y severidad',
        'Determinación de controles según jerarquía',
        'Cumplimiento de la Ley 29783'
      ],
      moments: [
        {
          id: 'moment_001',
          title: 'Conceptos Fundamentales del IPERC',
          order: 1,
          description: 'Introducción a peligros y riesgos',
          activities: [
            {
              id: 'activity_001',
              type: 'explanation',
              teaching: {
                agent_instruction: 'Explica qué es IPERC y su importancia en la prevención de accidentes laborales. Define la diferencia entre peligro (fuente de daño) y riesgo (probabilidad de que ocurra el daño). Usa ejemplos peruanos del sector construcción.',
                key_concepts: [
                  'Peligro: Fuente o situación con potencial de daño',
                  'Riesgo: Probabilidad de que el peligro cause daño',
                  'IPERC: Metodología sistemática de gestión de riesgos'
                ],
                examples: [
                  'Peligro: Piso mojado → Riesgo: Probabilidad de resbalarse',
                  'Peligro: Cable pelado → Riesgo: Probabilidad de electrocución',
                  'Peligro: Escalera sin barandal → Riesgo: Probabilidad de caerse'
                ],
                image: {
                  url: 'https://example.com/images/peligro_vs_riesgo.png',
                  description: 'Infografía mostrando la diferencia entre peligro y riesgo'
                }
              },
              verification: {
                method: 'conversational',
                initial_question: 'Ahora que hemos visto la diferencia entre peligro y riesgo, ¿puedes explicarme con tus propias palabras cuál es esa diferencia? Dame un ejemplo de tu vida cotidiana o trabajo.',
                success_criteria: {
                  must_include: [
                    'Identifica que el peligro es la fuente/condición peligrosa',
                    'Entiende que el riesgo es la probabilidad/posibilidad de daño',
                    'Da un ejemplo coherente'
                  ],
                  understanding_level: 'applied',
                  min_completeness: 70
                },
                reprompt_strategy: {
                  if_incomplete: [
                    'Entiendo lo que dices, pero ¿podrías explicar también la diferencia entre ambos conceptos?',
                    'Vas por buen camino. Ahora, ¿cómo relacionas eso con la probabilidad de que ocurra un daño?'
                  ],
                  if_memorized_only: [
                    'Correcto, esa es la definición. Ahora, para asegurarme de que lo entendiste: imagina que ves un cable eléctrico sin aislamiento. ¿Qué sería el peligro y qué sería el riesgo?'
                  ],
                  if_incorrect: [
                    'Veo que hay confusión. Déjame darte una pista: el peligro es algo que ya existe, mientras que el riesgo es algo que podría pasar. ¿Puedes intentarlo nuevamente?'
                  ],
                  hints: [
                    'Piensa: el peligro es la CAUSA, el riesgo es la CONSECUENCIA potencial',
                    'Ejemplo: si hay un charco (peligro), ¿qué podría pasar? (riesgo)',
                    'Peligro = ¿Qué situación peligrosa hay? | Riesgo = ¿Qué probabilidad hay de daño?'
                  ]
                }
              },
              student_evidence: {
                type: 'conversational_assessment',
                description: 'El estudiante explica con sus palabras la diferencia entre peligro y riesgo',
                captured_data: {
                  conversation_transcript: true,
                  key_insights: true,
                  attempts_count: true,
                  understanding_level: true
                }
              },
              student_questions: {
                allowed: true,
                scope: {
                  current_activity: true,
                  current_moment: true,
                  current_topic: true,
                  related_topics: false,
                  off_topic: false
                },
                out_of_scope_strategy: {
                  acknowledge: true,
                  brief_answer: true,
                  redirect: true,
                  response_templates: {
                    related_but_future_topic: 'Excelente pregunta sobre {tema}. Ese tema lo veremos más adelante. Por ahora, enfoquémonos en entender bien peligro vs riesgo.',
                    related_but_different_course: 'Buena pregunta. {tema} es parte de otro curso. Si te interesa, puedes inscribirte después.',
                    tangentially_related: 'Interesante punto, aunque no es parte de este tema. Te puedo dar una respuesta breve: {respuesta_corta}. Ahora, volvamos a IPERC.',
                    completely_off_topic: 'Entiendo tu curiosidad, pero esa pregunta está fuera del alcance de este curso de SSO. Mantengamos el foco en IPERC.'
                  }
                },
                expected_question_types: ['clarification', 'example_request', 'application', 'why_question']
              },
              guardrails: {
                prohibited_topics: ['sexual_content', 'violence', 'illegal_activities', 'personal_attacks'],
                response_on_violation: {
                  template: 'No puedo ayudarte con ese tema. Soy un instructor de {especialidad} y debo mantener conversaciones profesionales. ¿Volvemos a {tema_actual}?',
                  log_incident: true,
                  escalate_after: 3
                },
                tone_requirements: {
                  professional: true,
                  respectful: true,
                  encouraging: true,
                  no_judgment: true
                }
              },
              metadata: {
                estimated_minutes: 10,
                difficulty: 'easy',
                max_reprompts: 3,
                allow_skip: false,
                required_for_completion: true
              }
            }
          ]
        },
        // MOMENTO 2: Identificación de Peligros
        {
          id: 'moment_002',
          title: 'Identificación de Peligros',
          order: 2,
          description: 'Aprende a identificar los 7 tipos de peligros en el trabajo',
          activities: [
            {
              id: 'activity_002',
              type: 'explanation',
              teaching: {
                agent_instruction: 'Enseña cómo identificar peligros: mecánicos, físicos, químicos, biológicos, ergonómicos, psicosociales y locativos. Explica que se debe recorrer el área de trabajo y observar todas las actividades.',
                key_concepts: [
                  'Mecánicos: Máquinas, herramientas, vehículos',
                  'Físicos: Ruido, vibración, iluminación, temperatura',
                  'Químicos: Solventes, gases, polvos',
                  'Biológicos: Virus, bacterias, hongos',
                  'Ergonómicos: Posturas forzadas, movimientos repetitivos',
                  'Psicosociales: Estrés, hostigamiento, carga mental',
                  'Locativos: Pisos, escaleras, techos, espacios confinados'
                ],
                examples: [
                  'Taller de soldadura: proyección de chispas (mecánico), humos metálicos (químico), ruido (físico)',
                  'Oficina: postura sentada prolongada (ergonómico), carga de trabajo (psicosocial)',
                  'Almacén: estanterías inestables (locativo), cargas pesadas (ergonómico)'
                ],
                image: {
                  url: 'https://example.com/images/tipos_peligros.png',
                  description: 'Tabla con los 7 tipos de peligros y ejemplos'
                }
              },
              verification: {
                method: 'conversational',
                initial_question: 'Te voy a describir un taller de soldadura: hay máquinas de soldar funcionando, trabajadores cortando metal, humos en el ambiente, ruido constante y algunos cables en el piso. ¿Qué peligros identificas aquí? Nómbralos y clasifícalos por tipo.',
                success_criteria: {
                  must_include: [
                    'Identifica al menos 3 tipos diferentes de peligros',
                    'Clasifica correctamente cada peligro',
                    'Menciona peligros reales del escenario'
                  ],
                  understanding_level: 'applied',
                  min_completeness: 70
                },
                reprompt_strategy: {
                  if_incomplete: [
                    'Bien, has identificado algunos. ¿Qué más observas? Piensa en el ruido, los humos y el estado del piso.',
                    'Vas bien, pero faltan algunos. Te doy una pista: ¿qué pasa con el aire que respiran? ¿Y el nivel de ruido?'
                  ],
                  if_memorized_only: [
                    'Correcto en la teoría. Ahora aplícalo: en el taller que te describí, ¿cuáles específicamente serían los peligros mecánicos y químicos?'
                  ],
                  if_incorrect: [
                    'Revisa la clasificación. Por ejemplo, los humos metálicos son peligros químicos, no físicos. ¿Puedes intentarlo de nuevo?'
                  ],
                  hints: [
                    'Recuerda: máquinas y herramientas = mecánico, sustancias en el aire = químico, sonido = físico',
                    'Los cables en el piso también son un peligro. ¿De qué tipo?',
                    'Piensa en qué puede dañar al trabajador: las máquinas, los gases, el ruido...'
                  ]
                }
              },
              student_evidence: {
                type: 'conversational_assessment',
                description: 'El estudiante identifica y clasifica peligros en un escenario laboral',
                captured_data: {
                  conversation_transcript: true,
                  key_insights: true,
                  attempts_count: true,
                  understanding_level: true
                }
              },
              student_questions: {
                allowed: true,
                scope: {
                  current_activity: true,
                  current_moment: true,
                  current_topic: true,
                  related_topics: false,
                  off_topic: false
                },
                out_of_scope_strategy: {
                  acknowledge: true,
                  brief_answer: true,
                  redirect: true,
                  response_templates: {
                    related_but_future_topic: 'Buena pregunta. Ese tema lo veremos más adelante.',
                    related_but_different_course: 'Esa pregunta corresponde a otro curso.',
                    tangentially_related: 'Interesante, pero enfoquémonos en identificar peligros primero.',
                    completely_off_topic: 'Esa pregunta está fuera del tema. Volvamos a IPERC.'
                  }
                },
                expected_question_types: ['clarification', 'example_request', 'application']
              },
              guardrails: {
                prohibited_topics: ['sexual_content', 'violence', 'illegal_activities', 'personal_attacks'],
                response_on_violation: {
                  template: 'No puedo ayudarte con ese tema. Mantengamos una conversación profesional sobre SSO.',
                  log_incident: true,
                  escalate_after: 3
                },
                tone_requirements: {
                  professional: true,
                  respectful: true,
                  encouraging: true,
                  no_judgment: true
                }
              },
              metadata: {
                estimated_minutes: 12,
                difficulty: 'medium',
                max_reprompts: 3,
                allow_skip: false,
                required_for_completion: true
              }
            }
          ]
        },
        // MOMENTO 3: Evaluación de Riesgos
        {
          id: 'moment_003',
          title: 'Evaluación de Riesgos',
          order: 3,
          description: 'Aprende a evaluar riesgos usando la matriz de probabilidad y severidad',
          activities: [
            {
              id: 'activity_003',
              type: 'explanation',
              teaching: {
                agent_instruction: 'Explica la matriz de evaluación de riesgos: Probabilidad (Baja=1, Media=2, Alta=3) x Severidad (Ligeramente dañino=1, Dañino=2, Extremadamente dañino=3). Resultado: Trivial (1-2), Tolerable (3-4), Moderado (5-6), Importante (8-9), Intolerable (12+).',
                key_concepts: [
                  'Probabilidad: ¿Qué tan probable es que ocurra? (Baja, Media, Alta)',
                  'Severidad: Si ocurre, ¿qué tan grave sería? (Leve, Dañino, Extremo)',
                  'Nivel de Riesgo = Probabilidad × Severidad',
                  'Acción según nivel: Trivial (seguimiento), Tolerable (verificar), Moderado (reducir), Importante (corregir pronto), Intolerable (detener trabajo)'
                ],
                examples: [
                  'Piso mojado: Probabilidad Alta (3) × Severidad Dañina (2) = 6 (Moderado)',
                  'Trabajo en altura sin arnés: Probabilidad Media (2) × Severidad Extrema (3) = 6 pero crítico',
                  'Cable pelado en zona de tránsito: Probabilidad Alta (3) × Severidad Extrema (3) = 9 (Importante)'
                ],
                image: {
                  url: 'https://example.com/images/matriz_riesgo.png',
                  description: 'Matriz 5x5 de evaluación de riesgos (severidad vs probabilidad)'
                }
              },
              verification: {
                method: 'conversational',
                initial_question: 'Ahora vamos a practicar. Si tenemos un peligro de "proyección de chispas durante soldadura" y sabemos que ocurre frecuentemente en el taller (probabilidad Alta=3) y puede causar quemaduras en piel (severidad Dañina=2), ¿cuál sería el nivel de riesgo? Muéstrame el cálculo.',
                success_criteria: {
                  must_include: [
                    'Realiza el cálculo correcto: 3 × 2 = 6',
                    'Identifica el nivel de riesgo: Moderado',
                    'Demuestra comprensión de la fórmula'
                  ],
                  understanding_level: 'applied',
                  min_completeness: 80
                },
                reprompt_strategy: {
                  if_incomplete: [
                    'Bien el cálculo. Ahora, con ese resultado de 6, ¿en qué categoría de riesgo lo clasificarías?',
                    'Correcto. Y según esa clasificación, ¿qué acción deberíamos tomar?'
                  ],
                  if_memorized_only: [
                    'La fórmula está correcta. Ahora aplícala: ¿cuánto es 3 por 2?'
                  ],
                  if_incorrect: [
                    'Revisa la operación. Recuerda: Probabilidad × Severidad. Si es Alta (3) y Dañina (2), ¿cuánto da?',
                    'Ese resultado no es correcto. La probabilidad Alta es 3, la severidad Dañina es 2. ¿Qué operación hacemos con esos números?'
                  ],
                  hints: [
                    'Recuerda: es una multiplicación, no una suma',
                    'Alta = 3, Dañina = 2. Entonces: 3 × 2 = ?',
                    'Los niveles son: 1-2 Trivial, 3-4 Tolerable, 5-6 Moderado, 8-9 Importante, 12 Intolerable'
                  ]
                }
              },
              student_evidence: {
                type: 'conversational_assessment',
                description: 'El estudiante calcula correctamente el nivel de riesgo',
                captured_data: {
                  conversation_transcript: true,
                  key_insights: true,
                  attempts_count: true,
                  understanding_level: true
                }
              },
              student_questions: {
                allowed: true,
                scope: {
                  current_activity: true,
                  current_moment: true,
                  current_topic: true,
                  related_topics: false,
                  off_topic: false
                },
                out_of_scope_strategy: {
                  acknowledge: true,
                  brief_answer: true,
                  redirect: true,
                  response_templates: {
                    related_but_future_topic: 'Esa pregunta la veremos más adelante.',
                    related_but_different_course: 'Eso corresponde a otro curso.',
                    tangentially_related: 'Interesante, pero enfoquémonos en la evaluación de riesgos.',
                    completely_off_topic: 'Mantengamos el foco en IPERC.'
                  }
                },
                expected_question_types: ['clarification', 'example_request', 'application']
              },
              guardrails: {
                prohibited_topics: ['sexual_content', 'violence', 'illegal_activities', 'personal_attacks'],
                response_on_violation: {
                  template: 'Mantengamos una conversación profesional sobre SSO.',
                  log_incident: true,
                  escalate_after: 3
                },
                tone_requirements: {
                  professional: true,
                  respectful: true,
                  encouraging: true,
                  no_judgment: true
                }
              },
              metadata: {
                estimated_minutes: 15,
                difficulty: 'medium',
                max_reprompts: 3,
                allow_skip: false,
                required_for_completion: true
              }
            }
          ]
        },
        // MOMENTO 4: Determinación de Controles
        {
          id: 'moment_004',
          title: 'Determinación de Controles',
          order: 4,
          description: 'Aprende la jerarquía de controles según normativa peruana',
          activities: [
            {
              id: 'activity_004',
              type: 'explanation',
              teaching: {
                agent_instruction: 'Explica la jerarquía de controles: 1° Eliminación, 2° Sustitución, 3° Controles de ingeniería, 4° Controles administrativos (señalización, capacitación, procedimientos), 5° EPP (última opción). Enfatiza que el EPP solo protege al trabajador pero no elimina el peligro.',
                key_concepts: [
                  '1. Eliminación: Remover completamente el peligro',
                  '2. Sustitución: Reemplazar por algo menos peligroso',
                  '3. Controles de ingeniería: Barreras, ventilación, guardas',
                  '4. Controles administrativos: Procedimientos, capacitación, señalización',
                  '5. EPP: Equipos de protección personal (última línea de defensa)'
                ],
                examples: [
                  'Eliminación: Automatizar soldadura para que no haya operador expuesto',
                  'Sustitución: Usar pintura al agua en vez de pintura con solventes',
                  'Ingeniería: Instalar extractores de humo en zona de soldadura',
                  'Administrativos: Crear procedimiento de trabajo seguro para soldadura',
                  'EPP: Careta de soldar, guantes de cuero, mandil'
                ],
                image: {
                  url: 'https://example.com/images/jerarquia_controles.png',
                  description: 'Pirámide invertida de jerarquía de controles'
                }
              },
              verification: {
                method: 'conversational',
                initial_question: 'Perfecto. Ahora dime: ¿por qué crees que el EPP (como casco, guantes, lentes) es la última opción en la jerarquía y no la primera? Explica con tus palabras.',
                success_criteria: {
                  must_include: [
                    'Menciona que el EPP solo protege al trabajador',
                    'Entiende que el peligro sigue existiendo con EPP',
                    'Explica que eliminar/sustituir es más efectivo'
                  ],
                  understanding_level: 'understood',
                  min_completeness: 70
                },
                reprompt_strategy: {
                  if_incomplete: [
                    'Vas bien. Ahora piensa: si un trabajador usa casco, ¿el riesgo de caída de objetos desaparece o solo se reduce el daño?',
                    'Correcto. Entonces, ¿qué sería mejor: eliminar el riesgo de caída o darle casco al trabajador?'
                  ],
                  if_memorized_only: [
                    'Exacto, esa es la teoría. Dame un ejemplo práctico: si hay un cable pelado, ¿es mejor darle guantes al trabajador o reparar el cable?'
                  ],
                  if_incorrect: [
                    'Piénsalo así: el EPP protege a la persona, pero el peligro sigue ahí. Si eliminamos el peligro, ya no hace falta el EPP. ¿Ahora tiene más sentido?'
                  ],
                  hints: [
                    'Pista: El EPP es como un paraguas. Te protege de la lluvia, pero la lluvia sigue cayendo',
                    'Los controles superiores atacan la causa; el EPP solo reduce la consecuencia',
                    'Si puedes eliminar el peligro, ¿para qué necesitas EPP?'
                  ]
                }
              },
              student_evidence: {
                type: 'conversational_assessment',
                description: 'El estudiante explica la jerarquía de controles',
                captured_data: {
                  conversation_transcript: true,
                  key_insights: true,
                  attempts_count: true,
                  understanding_level: true
                }
              },
              student_questions: {
                allowed: true,
                scope: {
                  current_activity: true,
                  current_moment: true,
                  current_topic: true,
                  related_topics: false,
                  off_topic: false
                },
                out_of_scope_strategy: {
                  acknowledge: true,
                  brief_answer: true,
                  redirect: true,
                  response_templates: {
                    related_but_future_topic: 'Eso lo veremos después.',
                    related_but_different_course: 'Eso es otro tema.',
                    tangentially_related: 'Interesante, pero enfoquémonos en la jerarquía de controles.',
                    completely_off_topic: 'Volvamos al tema de controles.'
                  }
                },
                expected_question_types: ['clarification', 'example_request', 'why_question']
              },
              guardrails: {
                prohibited_topics: ['sexual_content', 'violence', 'illegal_activities', 'personal_attacks'],
                response_on_violation: {
                  template: 'Mantengamos una conversación profesional.',
                  log_incident: true,
                  escalate_after: 3
                },
                tone_requirements: {
                  professional: true,
                  respectful: true,
                  encouraging: true,
                  no_judgment: true
                }
              },
              metadata: {
                estimated_minutes: 12,
                difficulty: 'medium',
                max_reprompts: 3,
                allow_skip: false,
                required_for_completion: true
              }
            }
          ]
        },
        // MOMENTO 5: Evaluación Final - Aplicación Completa
        {
          id: 'moment_005',
          title: 'Evaluación Final - Aplicación Completa de IPERC',
          order: 5,
          description: 'Demuestra tu comprensión aplicando todo lo aprendido',
          activities: [
            {
              id: 'activity_005',
              type: 'project',
              teaching: {
                agent_instruction: 'Guía al estudiante para que aplique toda la metodología IPERC: 1) Elegir un área de trabajo (su casa, oficina, taller), 2) Identificar mínimo 2 peligros, 3) Evaluar cada riesgo con la matriz, 4) Proponer controles usando la jerarquía.',
                key_concepts: [
                  'Aplicación completa de IPERC',
                  'Identificación de peligros reales',
                  'Evaluación cuantitativa de riesgos',
                  'Propuesta de controles jerárquicos'
                ],
                examples: [
                  'Ejemplo completo: Peligro=escalera sin barandal → Riesgo=caída → P(3)×S(3)=9 (Importante) → Control: instalar barandal (ingeniería)',
                  'Otro: Peligro=monitor muy cerca → Riesgo=fatiga visual → P(2)×S(1)=2 (Trivial) → Control: ajustar distancia (administrativo)'
                ],
                image: {
                  url: 'https://example.com/images/plantilla_iperc.png',
                  description: 'Plantilla de matriz IPERC'
                }
              },
              verification: {
                method: 'conversational',
                initial_question: 'Para tu evaluación final, elige un lugar que conozcas (tu casa, trabajo, o un lugar público). Identifica 2 peligros, evalúa sus riesgos y propón controles. Usa este formato:\n\nPeligro 1: [describe]\nRiesgo: [qué daño podría ocurrir]\nProbabilidad: [Baja/Media/Alta]\nSeveridad: [Leve/Dañino/Extremo]\nNivel de Riesgo: [cálculo]\nControles propuestos: [lista]',
                success_criteria: {
                  must_include: [
                    'Identifica 2 peligros reales y específicos',
                    'Evalúa correctamente probabilidad y severidad',
                    'Calcula nivel de riesgo correctamente',
                    'Propone controles que siguen la jerarquía'
                  ],
                  understanding_level: 'analyzed',
                  min_completeness: 80
                },
                reprompt_strategy: {
                  if_incomplete: [
                    'Bien, pero falta completar algunos campos. ¿Podrías agregar la evaluación de probabilidad y severidad?',
                    'Vas bien, pero necesito que propongas controles específicos para cada peligro.'
                  ],
                  if_memorized_only: [
                    'Veo que conoces la teoría. Ahora sé más específico: en lugar de decir "usar EPP", dime qué EPP exactamente.'
                  ],
                  if_incorrect: [
                    'Revisa tu cálculo de riesgo. Recuerda que es Probabilidad × Severidad.',
                    'Ese control no sigue la jerarquía. ¿Hay algo que puedas hacer antes de llegar al EPP?'
                  ],
                  hints: [
                    'Piensa en tu entorno diario: cables, escaleras, ventanas, productos de limpieza...',
                    'Recuerda usar la escala: 1, 2 o 3 para probabilidad y severidad',
                    'Los controles deben ser realistas y aplicables'
                  ]
                }
              },
              student_evidence: {
                type: 'conversational_assessment',
                description: 'Matriz IPERC completa con 2 peligros evaluados',
                captured_data: {
                  conversation_transcript: true,
                  key_insights: true,
                  attempts_count: true,
                  understanding_level: true
                }
              },
              student_questions: {
                allowed: true,
                scope: {
                  current_activity: true,
                  current_moment: true,
                  current_topic: true,
                  related_topics: true,
                  off_topic: false
                },
                out_of_scope_strategy: {
                  acknowledge: true,
                  brief_answer: true,
                  redirect: true,
                  response_templates: {
                    related_but_future_topic: 'Buena pregunta, pero enfoquémonos en completar tu IPERC.',
                    related_but_different_course: 'Eso es otro curso.',
                    tangentially_related: 'Interesante, pero terminemos tu evaluación primero.',
                    completely_off_topic: 'Mantengamos el foco en tu proyecto IPERC.'
                  }
                },
                expected_question_types: ['clarification', 'example_request', 'application']
              },
              guardrails: {
                prohibited_topics: ['sexual_content', 'violence', 'illegal_activities', 'personal_attacks'],
                response_on_violation: {
                  template: 'Mantengamos una conversación profesional.',
                  log_incident: true,
                  escalate_after: 3
                },
                tone_requirements: {
                  professional: true,
                  respectful: true,
                  encouraging: true,
                  no_judgment: true
                }
              },
              metadata: {
                estimated_minutes: 20,
                difficulty: 'hard',
                max_reprompts: 5,
                allow_skip: false,
                required_for_completion: true
              }
            }
          ]
        }
      ]
    }
  }

  // Cargar imágenes desde MCP Server
  console.log('📸 Obteniendo imágenes desde MCP Server...')
  const ipercImages = await getTopicImagesFromMCP('iperc')

  if (ipercImages.length > 0) {
    console.log(`✅ Se cargaron ${ipercImages.length} imágenes desde MCP`)
  } else {
    console.log('⚠️  No se encontraron imágenes en MCP (continuando sin imágenes)')
  }

  const ipercTopic = await prisma.topic.upsert({
    where: { slug: 'iperc-basico' },
    update: {
      contentJson: ipercContent as any,
      estimatedMinutes: 69, // 10+12+15+12+20
      images: ipercImages as any,
      imagesLoadedAt: new Date()
    },
    create: {
      title: 'IPERC - Identificación de Peligros, Evaluación y Control de Riesgos',
      slug: 'iperc-basico',
      description: 'Aprende la metodología IPERC según normativa peruana',
      courseId: fundamentosCourse.id,
      instructorId: ssoInstructor.id,
      order: 1,
      estimatedMinutes: 120,
      difficulty: 'Básico',
      contentJson: ipercContent as any,
      images: ipercImages as any,
      imagesLoadedAt: new Date(),
      isPublished: true
    }
  })

  console.log('✅ Tema IPERC creado con imágenes')

  // 5. Crear usuario de prueba
  const testUser = await prisma.user.upsert({
    where: { email: 'estudiante@test.com' },
    update: {},
    create: {
      email: 'estudiante@test.com',
      name: 'Estudiante de Prueba',
      googleId: null
    }
  })

  console.log('✅ Usuario de prueba creado')

  console.log('\n🎉 Seed completado!')
  console.log('\nDatos creados:')
  console.log(`- Carrera: ${ssoCareer.name}`)
  console.log(`- Instructor: ${ssoInstructor.name}`)
  console.log(`- Curso: ${fundamentosCourse.title}`)
  console.log(`- Tema: ${ipercTopic.title}`)
  console.log(`- Usuario: ${testUser.email}`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
