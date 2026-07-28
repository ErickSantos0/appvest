export interface UserProfile {
  name: string;
  target: string;
  targetDaysLeft: number;
  streakDays: number;
  onboardingCompleted?: boolean;
  stats: {
    hoursStudied: string;
    exercisesSolved: number;
    dailyGoalPercent: number;
    aiChatsToday: number;
  };
  reminders: StudyReminder[];
  performance: Record<string, number>;
}

export interface StudyReminder {
  id: string;
  title: string;
  datetime: string;
  dateLabel: string;
  type: string; // "simulado" | "prova" | "vestibular" | "compromisso"
}

export interface FeedComment {
  id: string;
  user: string;
  text: string;
}

export interface FeedPost {
  id: string;
  user: {
    username: string;
    avatar: string;
    badge: string;
  };
  timeAgo: string;
  content: string;
  image?: string;
  category: string;
  likes: number;
  hasLiked?: boolean;
  comments: FeedComment[];
  isExercise?: boolean;
  exerciseData?: {
    subject: string;
    equation: string;
    options: string[];
    correctAnswer: string;
  };
}

export interface PracticeQuestion {
  subject?: string;
  complexity?: string;
  exam?: string;
  year?: string | number;
  sourceUrl?: string;
  isRealQuestion?: boolean;
  adaptedFrom?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  origin: string;
}

export interface EssayCorrection {
  totalScore: number;
  comp1: { score: number; feedback: string };
  comp2: { score: number; feedback: string };
  comp3: { score: number; feedback: string };
  comp4: { score: number; feedback: string };
  comp5: { score: number; feedback: string };
  generalFeedback: string;
  strengths: string[];
  weaknesses: string[];
  corrections: Array<{
    original: string;
    corrected: string;
    why: string;
  }>;
}

export interface SubjectTopic {
  title: string;
  description: string;
  concepts: string[];
}

export interface SubjectModule {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  topics: SubjectTopic[];
}
