import type { UIMessage } from 'ai';
import type { Difficulty } from './prompts';

export type Mode = 'theory' | 'pdf' | 'lectures' | 'quiz';

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type Lecture = {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
  durationSec: number;
  views: number;
  url: string;
  note?: string;
  order?: number;
};

export type UploadedDoc = { id: string; name: string; pages: number; url?: string };

export type ChatSession = {
  id: string;
  title: string;
  mode: Mode;
  updatedAt: number;
  messages: UIMessage[];
  docs: UploadedDoc[];
  difficulty: Difficulty;
  eli12: boolean;
};
