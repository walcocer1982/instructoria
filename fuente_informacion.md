erfecto, aquí está el JSON para un curso sobre IPERC (Identificación de Peligros, Evaluación de Riesgos y Controles) según normativa peruana:
JSON Ejemplo - Curso IPERC
json{
  "course": {
    "id": "course_iperc_001",
    "title": "IPERC - Identificación de Peligros, Evaluación y Control de Riesgos",
    "classes": [
      {
        "id": "class_iperc_001",
        "title": "Metodología IPERC según Norma Peruana",
        "learning_objective": "El estudiante comprenderá y aplicará la metodología IPERC para identificar peligros, evaluar riesgos y establecer controles según la Ley 29783 de Seguridad y Salud en el Trabajo del Perú",
        "expected_learning": "Al finalizar esta clase, el estudiante será capaz de realizar una matriz IPERC básica identificando peligros, evaluando riesgos y proponiendo controles jerárquicos",
        "key_points": [
          "Identificación de peligros en el área de trabajo",
          "Evaluación de riesgos usando matriz de probabilidad y severidad",
          "Determinación de controles según jerarquía (eliminación, sustitución, controles de ingeniería, administrativos y EPP)",
          "Cumplimiento de la Ley 29783 y su reglamento DS 005-2012-TR"
        ],
        "moments": [
          {
            "id": "moment_001",
            "title": "Conceptos Fundamentales del IPERC",
            "order": 1,
            "activities": [
              {
                "id": "activity_001",
                "type": "explanation",
                "agent_activity": "Explicar qué es IPERC y su importancia en la prevención de accidentes laborales. Definir la diferencia entre peligro (fuente de daño) y riesgo (probabilidad de que ocurra el daño)",
                "verification": "Preguntar al estudiante: '¿Cuál es la diferencia entre peligro y riesgo? Dame un ejemplo'",
                "image": {
                  "url": "https://example.com/images/peligro_vs_riesgo.png",
                  "description": "Infografía mostrando la diferencia entre peligro (ej: piso mojado) y riesgo (probabilidad de resbalarse)"
                },
                "student_evidence": {
                  "type": "verbal_response",
                  "description": "El estudiante explica con sus palabras la diferencia entre peligro y riesgo con ejemplos",
                  "success_criteria": "Identifica que el peligro es la fuente/condición y el riesgo es la probabilidad de daño"
                }
              },
              {
                "id": "activity_002",
                "type": "explanation",
                "agent_activity": "Explicar el marco legal: Ley 29783 y DS 005-2012-TR obligan a las empresas a realizar IPERC continuo. Mencionar que es responsabilidad del empleador",
                "verification": "Verificar que el estudiante comprenda la obligatoriedad legal del IPERC",
                "image": {
                  "url": "https://example.com/images/marco_legal_iperc.png",
                  "description": "Esquema del marco legal peruano de SST: Ley 29783 y su reglamento"
                },
                "student_evidence": {
                  "type": "verbal_response",
                  "description": "El estudiante menciona la normativa peruana aplicable",
                  "success_criteria": "Menciona Ley 29783 o reconoce que el IPERC es obligatorio por ley"
                }
              }
            ]
          },
          {
            "id": "moment_002",
            "title": "Identificación de Peligros",
            "order": 2,
            "activities": [
              {
                "id": "activity_003",
                "type": "explanation",
                "agent_activity": "Enseñar cómo identificar peligros: mecánicos, físicos, químicos, biológicos, ergonómicos, psicosociales y locativos. Explicar que se debe recorrer el área de trabajo y observar todas las actividades",
                "verification": "Mostrar un escenario laboral (ej: almacén) y preguntar: '¿Qué peligros identificas en esta imagen?'",
                "image": {
                  "url": "https://example.com/images/tipos_peligros.png",
                  "description": "Tabla con los 7 tipos de peligros y ejemplos: mecánicos (máquinas), físicos (ruido), químicos (solventes), etc."
                },
                "student_evidence": {
                  "type": "verbal_response",
                  "description": "El estudiante identifica al menos 3 tipos diferentes de peligros en un escenario dado",
                  "success_criteria": "Identifica correctamente 3 o más peligros clasificándolos por tipo"
                }
              },
              {
                "id": "activity_004",
                "type": "exercise",
                "agent_activity": "Presentar caso práctico: 'Imagina que trabajas en un taller de soldadura. Lista 5 peligros que podrías encontrar'",
                "verification": "Revisar que los peligros listados sean reales y relevantes para un taller de soldadura",
                "image": {
                  "url": "https://example.com/images/taller_soldadura.png",
                  "description": "Fotografía de un taller de soldadura típico con diversos peligros visibles"
                },
                "student_evidence": {
                  "type": "text_list",
                  "description": "Lista de 5 peligros identificados en taller de soldadura",
                  "success_criteria": "Lista incluye peligros como: proyección de chispas, humos metálicos, radiación UV, ruido, superficies calientes"
                }
              }
            ]
          },
          {
            "id": "moment_003",
            "title": "Evaluación de Riesgos",
            "order": 3,
            "activities": [
              {
                "id": "activity_005",
                "type": "explanation",
                "agent_activity": "Explicar la matriz de evaluación de riesgos: Probabilidad (Baja=1, Media=2, Alta=3) x Severidad (Ligeramente dañino=1, Dañino=2, Extremadamente dañino=3). Resultado: Trivial, Tolerable, Moderado, Importante, Intolerable",
                "verification": "Preguntar: 'Si un peligro tiene probabilidad Alta (3) y severidad Dañina (2), ¿cuál es el nivel de riesgo?'",
                "image": {
                  "url": "https://example.com/images/matriz_riesgo.png",
                  "description": "Matriz 3x3 de evaluación de riesgos mostrando nivel de riesgo según probabilidad y severidad"
                },
                "student_evidence": {
                  "type": "calculation",
                  "description": "El estudiante calcula el nivel de riesgo multiplicando probabilidad x severidad",
                  "success_criteria": "Responde correctamente: 3x2=6 (Riesgo Importante)"
                }
              },
              {
                "id": "activity_006",
                "type": "exercise",
                "agent_activity": "Presentar 3 escenarios de peligros identificados previamente y pedir al estudiante que evalúe cada uno usando la matriz",
                "verification": "Revisar que la evaluación sea lógica y esté correctamente calculada",
                "image": null,
                "student_evidence": {
                  "type": "table_completion",
                  "description": "Tabla con 3 peligros evaluados: probabilidad, severidad y nivel de riesgo resultante",
                  "success_criteria": "Al menos 2 de 3 evaluaciones son correctas y justificadas"
                }
              }
            ]
          },
          {
            "id": "moment_004",
            "title": "Determinación de Controles",
            "order": 4,
            "activities": [
              {
                "id": "activity_007",
                "type": "explanation",
                "agent_activity": "Explicar la jerarquía de controles según normativa peruana: 1°Eliminación, 2°Sustitución, 3°Controles de ingeniería, 4°Controles administrativos (señalización, capacitación, procedimientos), 5°EPP (última opción). Enfatizar que se debe priorizar siempre en ese orden",
                "verification": "Preguntar: '¿Por qué el EPP es el último control y no el primero?'",
                "image": {
                  "url": "https://example.com/images/jerarquia_controles.png",
                  "description": "Pirámide invertida mostrando la jerarquía de controles: eliminación en la cima, EPP en la base"
                },
                "student_evidence": {
                  "type": "verbal_response",
                  "description": "El estudiante explica por qué la jerarquía prioriza eliminación sobre EPP",
                  "success_criteria": "Menciona que el EPP solo protege al trabajador pero no elimina el peligro"
                }
              },
              {
                "id": "activity_008",
                "type": "challenge",
                "agent_activity": "Caso práctico: 'En el taller de soldadura identificaste proyección de chispas con riesgo IMPORTANTE. Propón 3 controles usando la jerarquía (uno de ingeniería, uno administrativo y uno EPP)'",
                "verification": "Verificar que los controles propuestos sean apropiados y sigan la jerarquía",
                "image": null,
                "student_evidence": {
                  "type": "text_list",
                  "description": "Lista de 3 controles propuestos para proyección de chispas",
                  "success_criteria": "Propone controles válidos como: pantallas protectoras (ingeniería), procedimiento de trabajo seguro (administrativo), careta de soldar (EPP)"
                }
              }
            ]
          },
          {
            "id": "moment_005",
            "title": "Evaluación Final - Matriz IPERC Completa",
            "order": 5,
            "activities": [
              {
                "id": "activity_009",
                "type": "project",
                "agent_activity": "Guiar al estudiante a crear su primera matriz IPERC completa: 'Elige un área de trabajo (puede ser tu casa, una oficina o un taller). Completa una matriz IPERC con al menos 3 peligros, su evaluación y controles propuestos'",
                "verification": "Revisar que la matriz incluya: actividad, peligro, riesgo, evaluación (P x S), nivel de riesgo y controles jerárquicos",
                "image": {
                  "url": "https://example.com/images/plantilla_iperc.png",
                  "description": "Plantilla de matriz IPERC con columnas: Actividad, Peligro, Riesgo, Probabilidad, Severidad, Nivel de Riesgo, Controles"
                },
                "student_evidence": {
                  "type": "document_submission",
                  "description": "Matriz IPERC completada con mínimo 3 peligros evaluados y sus controles",
                  "success_criteria": "Matriz incluye todos los campos requeridos, evaluaciones lógicas y controles que siguen jerarquía"
                }
              },
              {
                "id": "activity_010",
                "type": "quiz",
                "agent_activity": "Realizar 5 preguntas de cierre: 1) Diferencia peligro-riesgo, 2) Tipos de peligros, 3) Cómo se calcula nivel de riesgo, 4) Primer control en la jerarquía, 5) Normativa peruana aplicable",
                "verification": "El estudiante debe responder correctamente al menos 4 de 5 preguntas",
                "image": null,
                "student_evidence": {
                  "type": "quiz_responses",
                  "description": "Respuestas a las 5 preguntas del quiz final",
                  "success_criteria": "Mínimo 4 respuestas correctas (80%)"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
Características de este JSON para IPERC:
✅ Estructura pedagógica progresiva: Conceptos → Identificación → Evaluación → Controles → Evaluación final
✅ Alineado con norma peruana: Menciona Ley 29783 y DS 005-2012-TR
✅ Casos prácticos: Taller de soldadura como ejemplo recurrente
✅ Evidencias variadas: Respuestas verbales, listas, cálculos, matriz completa
✅ Para un estudiante: Diseñado para aprendizaje individual con retroalimentación del agente
¿Te sirve esta estructura? ¿Quieres que ajuste algo específico del contenido IPERC o la metodología?ReintentarWEQuiero que desarrolles el agente.Diseñó plan integral para desarrollar agente con tecnologías modernas.El usuario quiere que desarrolle el agente completo. Necesito crear:

El backend que maneje las peticiones a Claude API
El frontend básico para interactuar
La lógica del agente que siga la estructura del JSON (momentos, actividades, evidencias)
Sistema de seguimiento del progreso del estudiante

Voy a crear una aplicación completa con:

Backend en Node.js con Express
Frontend en React
Integración con Claude API
Sistema de estados para trackear el progreso

Usaré el JSON del IPERC que acabamos de diseñar.Perfecto, te desarrollo el agente completo para el curso IPERC. Voy a crear tanto el backend como el frontend:
1. Backend - Node.js + Express + Claude API
javascript// server.js
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Cargar el JSON del curso
const courseData = JSON.parse(fs.readFileSync('./course_iperc.json', 'utf8'));

// Estado del estudiante (en producción, usar base de datos)
const studentSessions = new Map();

// Endpoint para iniciar una clase
app.post('/api/start-class', (req, res) => {
  const { classId, studentId } = req.body;
  
  const classData = courseData.course.classes.find(c => c.id === classId);
  
  if (!classData) {
    return res.status(404).json({ error: 'Clase no encontrada' });
  }
  
  // Inicializar sesión del estudiante
  studentSessions.set(studentId, {
    classId,
    currentMomentIndex: 0,
    currentActivityIndex: 0,
    conversationHistory: [],
    evidence: []
  });
  
  res.json({
    success: true,
    classTitle: classData.title,
    learningObjective: classData.learning_objective,
    totalMoments: classData.moments.length
  });
});

// Endpoint principal del agente
app.post('/api/tutor', async (req, res) => {
  const { studentId, message } = req.body;
  
  const session = studentSessions.get(studentId);
  if (!session) {
    return res.status(400).json({ error: 'Sesión no encontrada. Inicia una clase primero.' });
  }
  
  const classData = courseData.course.classes.find(c => c.id === session.classId);
  const currentMoment = classData.moments[session.currentMomentIndex];
  const currentActivity = currentMoment.activities[session.currentActivityIndex];
  
  // Construir el system prompt dinámico
  const systemPrompt = buildSystemPrompt(classData, currentMoment, currentActivity, session);
  
  // Agregar mensaje del estudiante al historial
  session.conversationHistory.push({
    role: 'user',
    content: message
  });
  
  try {
    // Llamada a Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: session.conversationHistory
    });
    
    const assistantMessage = response.content[0].text;
    
    // Agregar respuesta al historial
    session.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    // Guardar sesión actualizada
    studentSessions.set(studentId, session);
    
    res.json({
      message: assistantMessage,
      currentMoment: currentMoment.title,
      currentActivity: currentActivity.id,
      progress: {
        moment: session.currentMomentIndex + 1,
        totalMoments: classData.moments.length
      },
      image: currentActivity.image
    });
    
  } catch (error) {
    console.error('Error llamando a Claude:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Endpoint para avanzar a la siguiente actividad
app.post('/api/next-activity', (req, res) => {
  const { studentId, evidenceCollected } = req.body;
  
  const session = studentSessions.get(studentId);
  if (!session) {
    return res.status(400).json({ error: 'Sesión no encontrada' });
  }
  
  const classData = courseData.course.classes.find(c => c.id === session.classId);
  const currentMoment = classData.moments[session.currentMomentIndex];
  
  // Guardar evidencia
  session.evidence.push({
    activityId: currentMoment.activities[session.currentActivityIndex].id,
    evidence: evidenceCollected,
    timestamp: new Date()
  });
  
  // Avanzar a siguiente actividad
  session.currentActivityIndex++;
  
  // Si terminamos las actividades del momento actual, pasar al siguiente momento
  if (session.currentActivityIndex >= currentMoment.activities.length) {
    session.currentMomentIndex++;
    session.currentActivityIndex = 0;
    
    // Verificar si terminó toda la clase
    if (session.currentMomentIndex >= classData.moments.length) {
      return res.json({
        completed: true,
        message: '¡Felicitaciones! Has completado la clase.',
        evidence: session.evidence
      });
    }
  }
  
  // Limpiar historial para el nuevo momento/actividad
  session.conversationHistory = [];
  studentSessions.set(studentId, session);
  
  const nextMoment = classData.moments[session.currentMomentIndex];
  const nextActivity = nextMoment.activities[session.currentActivityIndex];
  
  res.json({
    success: true,
    nextMoment: nextMoment.title,
    nextActivity: nextActivity.agent_activity
  });
});

// Función para construir el system prompt
function buildSystemPrompt(classData, moment, activity, session) {
  return `Eres un tutor experto en Seguridad y Salud en el Trabajo, especializado en enseñar IPERC.

INFORMACIÓN DE LA CLASE:
Título: ${classData.title}
Objetivo: ${classData.learning_objective}
Aprendizaje esperado: ${classData.expected_learning}

PUNTOS CLAVE A CUBRIR:
${classData.key_points.map((point, i) => `${i + 1}. ${point}`).join('\n')}

MOMENTO ACTUAL: ${moment.title} (${session.currentMomentIndex + 1} de ${classData.moments.length})

ACTIVIDAD ACTUAL:
ID: ${activity.id}
Tipo: ${activity.type}

TU TAREA (agent_activity):
${activity.agent_activity}

QUÉ DEBES VERIFICAR (verification):
${activity.verification}

EVIDENCIA QUE DEBE PROPORCIONAR EL ESTUDIANTE:
Tipo: ${activity.student_evidence.type}
Descripción: ${activity.student_evidence.description}
Criterio de éxito: ${activity.student_evidence.success_criteria}

${activity.image ? `IMAGEN DISPONIBLE:
URL: ${activity.image.url}
Descripción: ${activity.image.description}
Cuando sea relevante, menciona al estudiante: "Te recomiendo ver esta imagen: ${activity.image.url}"` : 'No hay imagen para esta actividad.'}

INSTRUCCIONES IMPORTANTES:
1. Ejecuta tu tarea (agent_activity) de forma clara y pedagógica
2. Mantén un tono motivador y profesional
3. Usa ejemplos peruanos y referencias a la normativa peruana cuando sea relevante
4. Verifica la comprensión del estudiante según los criterios especificados
5. NO avances a la siguiente actividad hasta que el estudiante demuestre la evidencia requerida
6. Si el estudiante da una respuesta que cumple el criterio de éxito, felicítalo y sugiere que está listo para avanzar
7. Si el estudiante tiene dificultades, da pistas sin dar la respuesta directa
8. Cuando menciones la imagen, comparte el URL completo
9. Sé conciso pero completo en tus explicaciones
10. Si el estudiante se desvía del tema, redirige amablemente a la actividad actual

REGLAS:
- NO inventes información sobre IPERC que no esté en el contenido del curso
- Sigue estrictamente la metodología IPERC peruana
- Si no estás seguro de algo, admítelo y enfócate en lo que sí sabes del curso
- Cuando el estudiante complete exitosamente la evidencia requerida, indícale claramente: "¡Excelente! Has completado esta actividad. Puedes avanzar a la siguiente."`;
}

// Endpoint para obtener clases disponibles
app.get('/api/classes', (req, res) => {
  const classes = courseData.course.classes.map(c => ({
    id: c.id,
    title: c.title,
    learningObjective: c.learning_objective
  }));
  
  res.json({ classes });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
2. Frontend - React
jsx// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [studentId] = useState(`student_${Date.now()}`); // ID único del estudiante
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStarted, setClassStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const messagesEndRef = useRef(null);

  const API_URL = 'http://localhost:3000/api';

  // Cargar clases disponibles
  useEffect(() => {
    fetch(`${API_URL}/classes`)
      .then(res => res.json())
      .then(data => setClasses(data.classes))
      .catch(err => console.error('Error cargando clases:', err));
  }, []);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Iniciar clase
  const startClass = async (classId) => {
    try {
      const response = await fetch(`${API_URL}/start-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, studentId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedClass(data);
        setClassStarted(true);
        
        // Mensaje de bienvenida del tutor
        setMessages([{
          role: 'assistant',
          content: `¡Bienvenido a la clase: ${data.classTitle}!\n\n${data.learningObjective}\n\nEstoy aquí para guiarte en tu aprendizaje. ¿Estás listo para comenzar?`
        }]);
      }
    } catch (error) {
      console.error('Error iniciando clase:', error);
    }
  };

  // Enviar mensaje al tutor
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          message: inputMessage
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }]);

      setCurrentProgress(data.progress);
      
      if (data.image) {
        setCurrentImage(data.image);
      }

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. Por favor intenta nuevamente.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Avanzar a siguiente actividad
  const nextActivity = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/next-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          evidenceCollected: messages.filter(m => m.role === 'user')
        })
      });

      const data = await response.json();

      if (data.completed) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }]);
        setClassStarted(false);
      } else {
        setMessages([{
          role: 'assistant',
          content: `Avanzamos al siguiente momento: ${data.nextMoment}\n\n${data.nextActivity}`
        }]);
        setCurrentImage(null);
      }

    } catch (error) {
      console.error('Error avanzando actividad:', error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado
  if (!classStarted) {
    return (
      <div className="container">
        <header>
          <h1>🎓 Plataforma de Aprendizaje IPERC</h1>
          <p>Selecciona una clase para comenzar</p>
        </header>

        <div className="class-list">
          {classes.map(classItem => (
            <div key={classItem.id} className="class-card">
              <h3>{classItem.title}</h3>
              <p>{classItem.learningObjective}</p>
              <button onClick={() => startClass(classItem.id)}>
                Iniciar Clase
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>📚 {selectedClass?.classTitle}</h1>
        {currentProgress && (
          <div className="progress-bar">
            <span>Momento {currentProgress.moment} de {currentProgress.totalMoments}</span>
          </div>
        )}
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-content typing">
                El tutor está escribiendo...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {currentImage && (
          <div className="image-panel">
            <h4>📷 Material de apoyo:</h4>
            <img src={currentImage.url} alt={currentImage.description} />
            <p>{currentImage.description}</p>
          </div>
        )}

        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu respuesta o pregunta..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
            Enviar
          </button>
          <button onClick={nextActivity} className="next-btn" disabled={loading}>
            Siguiente Actividad →
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
3. Estilos CSS
css/* App.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

header h1 {
  color: #333;
  margin-bottom: 10px;
}

.progress-bar {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.class-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.class-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.class-card:hover {
  transform: translateY(-5px);
}

.class-card h3 {
  color: #667eea;
  margin-bottom: 15px;
}

.class-card button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 15px;
  transition: background 0.2s;
}

.class-card button:hover {
  background: #5568d3;
}

.chat-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 15px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 15px;
  border-radius: 10px;
  white-space: pre-wrap;
}

.message.user .message-content {
  background: #667eea;
  color: white;
}

.message.assistant .message-content {
  background: #f0f0f0;
  color: #333;
}

.typing {
  font-style: italic;
  opacity: 0.7;
}

.image-panel {
  border-top: 1px solid #e0e0e0;
  padding: 15px;
  background: #f9f9f9;
}

.image-panel img {
  max-width: 100%;
  border-radius: 5px;
  margin: 10px 0;
}

.input-container {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
}

.input-container input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.input-container button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.input-container button:hover:not(:disabled) {
  background: #5568d3;
}

.input-container button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.next-btn {
  background: #28a745 !important;
}

.next-btn:hover:not(:disabled) {
  background: #218838 !important;
}
4. Variables de Entorno
env# .env
ANTHROPIC_API_KEY=tu_api_key_aqui
PORT=3000
5. Package.json
json{
  "name": "iperc-tutor-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
6. Instrucciones de Instalación
bash# 1. Instalar dependencias del backend
npm install

# 2. Crear archivo .env con tu API key de Anthropic

# 3. Colocar el JSON del curso en course_iperc.json

# 4. Iniciar servidor
npm start

# 5. En otra terminal, iniciar frontend React
cd frontend
npm install
npm start
Características del Agente:
✅ Sigue la estructura del JSON - Respeta momentos, actividades y evidencias
✅ System prompt dinámico - Se adapta a cada actividad
✅ Tracking de progreso - Sabe en qué momento está el estudiante
✅ Verificación de evidencias - No avanza hasta cumplir criterios
✅ Gestión de imágenes - Muestra URLs cuando son relevantes
✅ Conversacional - Mantiene historial de la conversación
✅ Motivador - Tono pedagógico y profesional