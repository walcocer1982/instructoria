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

  // 4. Crear Tema IPERC con contenido completo (estructura simplificada)
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
              complexity: 'simple',
              teaching: {
                agent_instruction: 'Explica de forma concisa qué es IPERC y la diferencia fundamental entre PELIGRO (fuente de daño, algo que ya existe - ejemplo: piso mojado, cable pelado) y RIESGO (probabilidad de que ese peligro cause daño - ejemplo: probabilidad de resbalarse, probabilidad de electrocutarse). Enfatiza que IPERC es la metodología sistemática usada en Perú (Ley 29783) para identificar peligros, evaluar riesgos y establecer controles. Luego presenta un caso práctico con múltiples peligros para que el estudiante aplique los conceptos.',
                target_length: '200-300 palabras',
                context: 'Normativa: Ley 29783. País: Perú. Sector: General'
              },
              verification: {
                question: 'Analiza esta situación de un TALLER MECÁNICO:\n\n"En el área de trabajo hay máquinas con partes móviles expuestas, piso con manchas de aceite, cables eléctricos deteriorados cruzando el pasillo, y ruido constante de más de 85 decibeles."\n\nTarea:\n1. Identifica TRES PELIGROS específicos que observas en este escenario\n2. Para cada peligro, explica cuál sería el RIESGO asociado (¿qué daño podría ocurrir? ¿qué tan probable es?)\n3. Explica con tus palabras: ¿cuál es la diferencia entre peligro y riesgo?\n\nFormato: "Peligro: [X] → Riesgo: [probabilidad de Y daño]"'
              },
              metadata: {
                estimated_minutes: 10,
                difficulty: 'easy',
                max_reprompts: 3
              }
            }
          ]
        },
        {
          id: 'moment_002',
          title: 'Identificación de Peligros',
          order: 2,
          description: 'Aprende a identificar los 7 tipos de peligros laborales',
          activities: [
            {
              id: 'activity_002',
              type: 'explanation',
              complexity: 'simple',
              teaching: {
                agent_instruction: 'Explica brevemente los 7 tipos de peligros laborales según normativa peruana: MECÁNICOS (máquinas, herramientas, vehículos), FÍSICOS (ruido, vibración, temperatura, iluminación), QUÍMICOS (gases, polvos, solventes), BIOLÓGICOS (virus, bacterias, hongos), ERGONÓMICOS (posturas, movimientos repetitivos, cargas), PSICOSOCIALES (estrés, hostigamiento, carga mental), LOCATIVOS (pisos, escaleras, techos, espacios confinados). Muestra la imagen con los 7 tipos para que el estudiante tenga una referencia visual. Luego presenta el caso del taller de soldadura con múltiples peligros simultáneos.',
                target_length: '250-350 palabras',
                context: 'Normativa: Ley 29783, DS 005-2012-TR. País: Perú',
                suggested_image_ids: ['iperc-tipos-riesgos-laborales', 'iperc-caso-soldadura-corte']
              },
              verification: {
                question: 'Observa la [VER IMAGEN: Caso Práctico: Trabajo de Soldadura y Corte]\n\nAnaliza el TALLER DE SOLDADURA mostrado en la imagen:\n\nTarea:\n1. Identifica AL MENOS 5 peligros específicos que observas en la imagen\n2. Clasifica cada uno por tipo usando los 7 tipos: Mecánico, Físico, Químico, Biológico, Ergonómico, Psicosocial o Locativo\n3. Para cada peligro, explica EN UNA LÍNEA por qué pertenece a esa categoría\n\nFormato:\n"Peligro 1: [descripción] - Tipo: [X] - Razón: [porque...]"\n"Peligro 2: [descripción] - Tipo: [Y] - Razón: [porque...]"\n...'
              },
              metadata: {
                estimated_minutes: 12,
                difficulty: 'medium',
                max_reprompts: 3
              }
            }
          ]
        },
        {
          id: 'moment_003',
          title: 'Evaluación de Riesgos',
          order: 3,
          description: 'Aprende a evaluar riesgos usando la matriz 5×5',
          activities: [
            {
              id: 'activity_003',
              type: 'explanation',
              complexity: 'moderate',
              teaching: {
                agent_instruction: 'Explica la Matriz de Evaluación de Riesgos 5×5 mostrada en la imagen. Detalla cómo funciona: eje vertical = SEVERIDAD (Catastrófico=1, Mortalidad=2, Permanente=3, Temporal=4, Menor=5), eje horizontal = FRECUENCIA (Común=A, Ha sucedido=B, Podría suceder=C, Raro=D, Imposible=E). Al cruzarlos obtienes un número (1-25) que indica el nivel de riesgo. Código de colores: ROJO (1-6: intolerable, acción inmediata), AMARILLO (7-14: tolerable con control, revisar periódicamente), VERDE (15-25: aceptable, mantener controles). Luego presenta casos prácticos para que el estudiante evalúe usando la matriz.',
                target_length: '300-400 palabras',
                context: 'Normativa: Ley 29783. Método: Matriz 5×5. País: Perú',
                suggested_image_ids: ['iperc-matriz-evaluacion-5x5']
              },
              verification: {
                question: 'Usa la [VER IMAGEN: Matriz de Evaluación de Riesgos 5×5] para evaluar estos 3 peligros:\n\nPELIGRO 1: "Proyección de chispas durante soldadura"\n• Frecuencia: Ocurre frecuentemente, casi todos los días\n• Daño potencial: Quemaduras leves en piel y ojos\n\nPELIGRO 2: "Caída desde andamio de 8 metros de altura sin arnés"\n• Frecuencia: Poco frecuente, solo 2 veces al mes se usa el andamio\n• Daño potencial: Muerte o lesiones permanentes (paraplejia)\n\nPELIGRO 3: "Trabajo sentado prolongado en oficina (8 horas)"\n• Frecuencia: Todos los días laborales\n• Daño potencial: Dolores lumbares, molestias temporales\n\nPara cada peligro:\n1. Determina SEVERIDAD (1-5) según la matriz\n2. Determina FRECUENCIA (A-E) según la matriz\n3. Encuentra el NÚMERO resultante en la matriz (1-25)\n4. Indica el COLOR (rojo/amarillo/verde) y NIVEL DE RIESGO (intolerable/tolerable/aceptable)\n5. ¿Cuál de los 3 peligros es el MÁS CRÍTICO y por qué?\n\nFormato:\n"Peligro 1: Severidad=X, Frecuencia=Y, Número=Z, Color=[color], Nivel=[nivel]"'
              },
              metadata: {
                estimated_minutes: 15,
                difficulty: 'medium',
                max_reprompts: 3
              }
            }
          ]
        },
        {
          id: 'moment_004',
          title: 'Determinación de Controles',
          order: 4,
          description: 'Aprende la jerarquía de controles y cómo aplicarlos',
          activities: [
            {
              id: 'activity_004',
              type: 'explanation',
              complexity: 'moderate',
              teaching: {
                agent_instruction: 'Explica la Jerarquía de Controles mostrada en la pirámide invertida de la imagen. Los 5 niveles ordenados por efectividad son: 1) ELIMINACIÓN (más efectivo - eliminar completamente el peligro), 2) SUSTITUCIÓN (reemplazar por algo menos peligroso), 3) CONTROLES DE INGENIERÍA (guardas, ventilación, automatización), 4) CONTROLES ADMINISTRATIVOS (procedimientos, capacitación, señalización), 5) EPP (menos efectivo - último recurso porque el peligro sigue existiendo). Enfatiza que siempre se debe buscar controles de los niveles superiores primero. El EPP solo protege al trabajador, no elimina el peligro. Luego presenta casos para que el estudiante proponga controles.',
                target_length: '300-400 palabras',
                context: 'Normativa: Ley 29783, ISO 45001. País: Perú',
                suggested_image_ids: ['iperc-jerarquia-controles']
              },
              verification: {
                question: 'Consulta la [VER IMAGEN: Jerarquía de Controles - Pirámide de Efectividad] y propón controles para estos 3 peligros:\n\nPELIGRO 1: "Ruido de 95 dB en área de producción por máquinas antiguas"\n\nPELIGRO 2: "Trabajadores manipulan solvente tóxico (tolueno) para limpieza de piezas"\n\nPELIGRO 3: "Operarios trabajan con esmeril angular sin guarda de protección"\n\nPara cada peligro:\n1. Propón UN control de cada nivel de la jerarquía que sea aplicable (Eliminación, Sustitución, Ingeniería, Administrativo, EPP)\n2. Indica cuál control es el MÁS EFECTIVO según la jerarquía\n3. Explica POR QUÉ ese control es el más efectivo\n4. Si tuvieras presupuesto limitado y solo pudieras aplicar UN control, ¿cuál elegirías y por qué?\n\nFormato:\n"Peligro 1:\n- Eliminación: [propuesta o N/A]\n- Sustitución: [propuesta]\n- Ingeniería: [propuesta]\n- Administrativo: [propuesta]\n- EPP: [propuesta]\nMás efectivo: [X] porque [razón]\nCon presupuesto limitado: [X] porque [razón práctica]"'
              },
              metadata: {
                estimated_minutes: 12,
                difficulty: 'medium',
                max_reprompts: 3
              }
            }
          ]
        },
        {
          id: 'moment_005',
          title: 'Integración: Matriz IPERC Completa',
          order: 5,
          description: 'Aplica todo lo aprendido en un caso integrador real',
          activities: [
            {
              id: 'activity_005',
              type: 'exercise',
              complexity: 'complex',
              teaching: {
                agent_instruction: 'Presenta el caso integrador final: el estudiante debe realizar una matriz IPERC completa de un área de trabajo real. Recuerda brevemente los 4 pasos: 1) Identificar peligros (usando los 7 tipos), 2) Evaluar riesgos (usando matriz 5×5), 3) Proponer controles (siguiendo jerarquía), 4) Documentar todo. Presenta un escenario complejo con múltiples peligros simultáneos para que demuestre dominio completo de la metodología IPERC.',
                target_length: '250-350 palabras',
                context: 'Caso real: Área de trabajo eléctrico en altura. Normativa: Ley 29783. País: Perú',
                suggested_image_ids: ['iperc-caso-trabajo-electrico-altura']
              },
              verification: {
                question: 'CASO INTEGRADOR FINAL - Matriz IPERC Completa\n\nObserva la [VER IMAGEN: Caso Práctico: Trabajo Eléctrico en Altura]\n\nEres el supervisor de SSO de una empresa eléctrica. Analiza este escenario:\n\nÁREA: Mantenimiento de líneas de transmisión en postes\nFECHA: 15/01/2025\nACTIVIDAD: Dos trabajadores realizan mantenimiento en poste de 12 metros de altura con líneas energizadas de media tensión (22.9 kV)\n\nCONDICIONES OBSERVADAS EN LA IMAGEN:\n• Trabajadores a 12m de altura\n• Líneas eléctricas energizadas cercanas\n• Uso de arnés y línea de vida\n• Condiciones climáticas: soleado, sin viento\n• Herramientas dieléctricas visibles\n\nELABORA UNA MATRIZ IPERC SIMPLIFICADA:\n\n1. IDENTIFICACIÓN (mínimo 4 peligros):\n   - Identifica los peligros presentes\n   - Clasifica cada uno por tipo (Mecánico, Físico, etc.)\n\n2. EVALUACIÓN (usa matriz 5×5):\n   - Para los 2 peligros MÁS CRÍTICOS:\n     * Severidad (1-5)\n     * Frecuencia (A-E)\n     * Nivel de riesgo (número y color)\n\n3. CONTROLES (jerarquía):\n   - Para cada uno de los 2 peligros más críticos:\n     * Controles existentes que observas\n     * 2 controles adicionales que propondrías (indica nivel de jerarquía)\n\n4. CONCLUSIÓN:\n   - ¿Este trabajo es de ALTO RIESGO? ¿Por qué?\n   - ¿Los controles actuales son suficientes? ¿Qué falta?\n\nFormato libre pero estructurado. Demuestra dominio completo de IPERC.'
              },
              metadata: {
                estimated_minutes: 20,
                difficulty: 'hard',
                max_reprompts: 3,
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

  // 5. Crear Tema Inspecciones de Seguridad
  const inspeccionesContent: TopicContent = {
    topic: {
      id: 'topic_inspecciones_001',
      title: 'Inspecciones de Seguridad',
      learning_objective: 'El estudiante comprenderá la metodología completa de inspecciones de seguridad, desde la planificación hasta el seguimiento de hallazgos, aplicando la clasificación de actos y condiciones subestándares según normativa peruana',
      expected_learning: 'Al finalizar este tema, el estudiante será capaz de planificar, ejecutar y documentar inspecciones de seguridad, clasificando hallazgos por nivel de riesgo y proponiendo acciones correctivas con tiempos de levantamiento apropiados',
      key_points: [
        'Diferencia entre actos y condiciones subestándares',
        'Tipos de inspecciones y frecuencias según riesgo',
        'Registro profesional de hallazgos',
        'Clasificación CRÍTICO/MAYOR/MENOR y tiempos de levantamiento',
        'Acciones correctivas y seguimiento hasta el cierre'
      ],
      moments: [
        // MOMENTO 1: Actos y Condiciones Subestándares
        {
          id: 'moment_001',
          title: 'Actos y Condiciones Subestándares',
          order: 1,
          description: 'Fundamentos: distinción entre comportamientos y estados físicos inseguros',
          activities: [
            {
              id: 'activity_001',
              type: 'explanation',
              complexity: 'simple',
              teaching: {
                agent_instruction: 'Explica de forma concisa la diferencia fundamental entre ACTO SUBESTÁNDAR (comportamiento inseguro del trabajador, como no usar EPP o tomar atajos) y CONDICIÓN SUBESTÁNDAR (estado físico inseguro del ambiente/equipo, como piso resbaladizo o máquina sin guarda). Enfatiza que esta distinción es crucial porque los controles son diferentes: actos requieren capacitación/supervisión, condiciones requieren mantenimiento/ingeniería. Luego presenta 6 situaciones variadas para que el estudiante clasifique.',
                target_length: '150-250 palabras',
                context: 'Normativa: Ley 29783, DS 005-2012-TR. País: Perú',
                suggested_image_ids: ['insp-actos-condiciones']
              },
              verification: {
                question: 'Clasifica estas 6 situaciones como ACTO o CONDICIÓN subestándar. Para cada una, escribe solo "A" o "C" y explica en una línea por qué:\n\n1. Trabajador usando celular mientras maneja montacargas\n2. Piso con derrame de aceite no limpiado desde hace días\n3. Operario entra a espacio confinado sin permiso de trabajo\n4. Extintor con manómetro en zona roja (sin presión)\n5. Soldador trabajando sin careta facial\n6. Salida de emergencia bloqueada con cajas apiladas'
              },
              metadata: {
                estimated_minutes: 10,
                difficulty: 'easy',
                max_reprompts: 3
              }
            }
          ]
        },
        // MOMENTO 2: Tipos de Inspecciones
        {
          id: 'moment_002',
          title: 'Tipos de Inspecciones',
          order: 2,
          description: 'Conocer los diferentes tipos y cuándo aplicar cada uno',
          activities: [
            {
              id: 'activity_002',
              type: 'explanation',
              complexity: 'simple',
              teaching: {
                agent_instruction: 'Explica brevemente los tipos de inspecciones: PLANEADAS (programadas con checklist, mensuales/semanales), INOPINADAS (sorpresa sin aviso previo para verificar cumplimiento real), y ESPECÍFICAS (pre-uso de equipos críticos, post-incidente). Menciona las frecuencias según DS 005-2012-TR: diarias (supervisores), semanales (jefes), mensuales (Comité SST). Luego presenta 3 situaciones prácticas para que el estudiante decida qué tipo aplicar.',
                target_length: '150-250 palabras',
                context: 'Normativa: DS 005-2012-TR, Ley 29783. País: Perú'
              },
              verification: {
                question: 'Para estas 3 situaciones, indica: a) Tipo de inspección, b) Frecuencia, c) Quién debe hacerla, d) Por qué:\n\nSITUACIÓN 1: Tienes 5 montacargas que se usan diariamente en tu almacén.\n\nSITUACIÓN 2: Ocurrió un resbalón en el área de producción y necesitas investigar.\n\nSITUACIÓN 3: Notas que cuando avisas las inspecciones con anticipación, todo está "perfecto", pero normalmente hay desorden.'
              },
              metadata: {
                estimated_minutes: 10,
                difficulty: 'easy',
                max_reprompts: 3
              }
            }
          ]
        },
        // MOMENTO 3: Registro de Hallazgos
        {
          id: 'moment_003',
          title: 'Planificación y Registro de Hallazgos',
          order: 3,
          description: 'Documentar hallazgos de forma profesional y objetiva',
          activities: [
            {
              id: 'activity_003',
              type: 'exercise',
              complexity: 'moderate',
              teaching: {
                agent_instruction: 'Enseña el formato estándar de registro de hallazgos: Fecha, Área, Tipo (Acto/Condición), Descripción OBJETIVA (hechos observables, no juicios), Riesgo potencial (qué puede pasar). Enfatiza la importancia de ser OBJETIVO: ❌"Está inseguro" vs ✅"Cable eléctrico temporal sin protección cruza pasillo a 15cm del piso". Luego presenta un hallazgo encontrado para que el estudiante lo redacte formalmente.',
                target_length: '200-300 palabras',
                context: 'Formato según buenas prácticas de SSO en Perú',
                suggested_image_ids: ['insp-almacen-hallazgos']
              },
              verification: {
                question: 'Encontraste este hallazgo en un taller mecánico:\n\n"Un trabajador está usando el esmeril angular para cortar metal. No usa careta facial ni lentes de seguridad, solo tapones auditivos."\n\nRedacta el HALLAZGO #001 con este formato:\n\nHALLAZGO #001\nFecha: 15/01/2025\nÁrea: Taller Mecánico\nTipo: [¿Acto o Condición?]\nDescripción: [Descripción objetiva de lo observado]\nRiesgo potencial: [Qué puede ocurrir si no se corrige]'
              },
              metadata: {
                estimated_minutes: 12,
                difficulty: 'medium',
                max_reprompts: 3
              }
            }
          ]
        },
        // MOMENTO 4: Clasificación de Riesgos
        {
          id: 'moment_004',
          title: 'Evaluación del Nivel de Riesgo',
          order: 4,
          description: 'Clasificar hallazgos y asignar tiempos de levantamiento',
          activities: [
            {
              id: 'activity_004',
              type: 'exercise',
              complexity: 'moderate',
              teaching: {
                agent_instruction: 'Explica la clasificación de hallazgos: CRÍTICO (riesgo inminente grave/fatal, parada inmediata, 0-24h), MAYOR (riesgo alto de lesión grave, acción urgente, 1-7 días), MENOR (desviación de estándar, riesgo bajo, 8-30 días). Enfatiza la pregunta clave: "¿Qué es lo PEOR que puede pasar?". Presenta 6 hallazgos diversos para que clasifique, asigne tiempo y justifique basándose en severidad potencial.',
                target_length: '250-350 palabras',
                context: 'Clasificación según buenas prácticas internacionales adaptadas a Perú',
                suggested_image_ids: ['insp-almacen-hallazgos']
              },
              verification: {
                question: 'Clasifica estos 6 hallazgos como CRÍTICO, MAYOR o MENOR. Para cada uno indica: Clasificación (C/M/m), Tiempo de levantamiento, y Justificación (¿qué es lo peor que puede pasar?):\n\n1. Andamio a 5m de altura: arnés enganchado pero línea de vida floja y mal anclada\n\n2. Tablero eléctrico principal con tapa abierta, conexiones energizadas expuestas, en zona de tránsito frecuente\n\n3. Señalización de ruta de evacuación en pasillo descolorida y casi ilegible\n\n4. Detector de gases vencido hace 3 meses, se sigue usando para autorizar entrada a espacios confinados\n\n5. Bidones de químicos sin etiquetas identificando contenido (operarios "saben de memoria")\n\n6. Sillas de oficina con respaldo roto o ruedas trabadas'
              },
              metadata: {
                estimated_minutes: 13,
                difficulty: 'medium',
                max_reprompts: 3
              }
            }
          ]
        },
        // MOMENTO 5: Inspección Simulada Completa
        {
          id: 'moment_005',
          title: 'Inspección Simulada Completa',
          order: 5,
          description: 'Aplicar todo el proceso de principio a fin',
          activities: [
            {
              id: 'activity_005',
              type: 'project',
              complexity: 'complex',
              teaching: {
                agent_instruction: 'Guía al estudiante en una inspección simulada completa del ÁREA DE SOLDADURA. Recuérdale el proceso: 1) Identificar hallazgos (actos/condiciones), 2) Registrar formalmente, 3) Clasificar por riesgo, 4) Proponer acciones correctivas usando jerarquía de controles, 5) Identificar cuál requiere acción INMEDIATA. Presenta el escenario con 5 hallazgos observables y pide que aplique todo lo aprendido.',
                target_length: '300-400 palabras',
                context: 'Caso práctico: Área de soldadura de empresa metalmecánica peruana',
                suggested_image_ids: ['insp-taller-soldadura-integrador']
              },
              verification: {
                question: 'CASO INTEGRADOR:\n\nEres supervisor de seguridad. Inspecciones el ÁREA DE SOLDADURA (10:00 AM, 15/01/2025).\n\nObservas:\nA) Soldador Juan trabajando sin careta, solo con lentes oscuros comunes\nB) 2 cilindros de gas (oxígeno + acetileno) de pie SIN cadena de sujeción\nC) Piso: electrodos usados y cables enrollados mezclados\nD) Extintor PQS 12kg: última inspección mensual fue octubre 2024 (hace 3 meses)\nE) Soldador Pedro usa celular con una mano mientras sujeta pieza con la otra (no está soldando)\n\nTAREA:\n\n1. Identifica los 5 hallazgos (A-E): ¿Acto o Condición?\n\n2. Clasifica los 3 MÁS CRÍTICOS: C/M/m + tiempo de levantamiento\n\n3. Para EL MÁS CRÍTICO: Redacta hallazgo formal + propón acción correctiva + asigna responsable\n\n4. ¿Cuál requiere ACCIÓN INMEDIATA en ese momento? ¿Por qué?'
              },
              metadata: {
                estimated_minutes: 15,
                difficulty: 'hard',
                max_reprompts: 3
              }
            }
          ]
        }
      ]
    }
  }

  console.log('📸 Obteniendo imágenes de inspecciones desde MCP Server...')
  const inspeccionesImages = await getTopicImagesFromMCP('inspecciones')

  if (inspeccionesImages.length > 0) {
    console.log(`✅ Se cargaron ${inspeccionesImages.length} imágenes desde MCP`)
  } else {
    console.log('⚠️  No se encontraron imágenes en MCP (se cargarán posteriormente)')
  }

  const inspeccionesTopic = await prisma.topic.upsert({
    where: { slug: 'inspecciones-seguridad' },
    update: {
      contentJson: inspeccionesContent as any,
      estimatedMinutes: 60, // 10+10+12+13+15
      images: inspeccionesImages as any,
      imagesLoadedAt: inspeccionesImages.length > 0 ? new Date() : null
    },
    create: {
      title: 'Inspecciones de Seguridad',
      slug: 'inspecciones-seguridad',
      description: 'Aprende a planificar, ejecutar y documentar inspecciones de seguridad, clasificando hallazgos y estableciendo acciones correctivas según normativa peruana',
      courseId: fundamentosCourse.id,
      instructorId: ssoInstructor.id,
      order: 2,
      estimatedMinutes: 60,
      difficulty: 'Intermedio',
      contentJson: inspeccionesContent as any,
      prerequisiteTopicIds: [ipercTopic.id] as any, // Requiere completar IPERC primero
      images: inspeccionesImages as any,
      imagesLoadedAt: inspeccionesImages.length > 0 ? new Date() : null,
      isPublished: true
    }
  })

  console.log('✅ Tema Inspecciones de Seguridad creado')

  // 6. Crear usuario de prueba
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
  console.log(`- Temas:`)
  console.log(`  1. ${ipercTopic.title} (${ipercTopic.estimatedMinutes} min)`)
  console.log(`  2. ${inspeccionesTopic.title} (${inspeccionesTopic.estimatedMinutes} min)`)
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
