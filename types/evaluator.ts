import { LessonMomentPlan } from './lessonPlan';

export type EvaluationCategory = 'CORRECTA' | 'PARCIAL' | 'DEBIL' | 'VAGA';
export type EvaluationNextAction = 'ADVANCE' | 'RETRY' | 'ESCALATE_TUTOR';

export interface EvaluationDimensions {
  relevance: number;
  accuracy: number;
  reasoning: number;
  completeness: number;
  clarity: number;
}

export interface Evaluation {
  score: number;
  category: EvaluationCategory;
  dimensions: EvaluationDimensions;
  feedback: string;
  followUpQuestion?: string;
  hintLevel?: 0 | 1 | 2 | 3;
  nextAction: EvaluationNextAction;
}

export interface EvaluationContext {
  plan: LessonMomentPlan;
  studentMessage: string;
  attempt: number;
}