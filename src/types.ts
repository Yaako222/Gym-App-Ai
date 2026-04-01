export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type MuscleCategory = 'arme' | 'beine' | 'brust' | 'rücken' | 'schultern' | 'bauch' | 'ganzkörper' | 'cardio' | 'andere';
export type WeightUnit = 'kg' | 'lbs';

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  instructions: string;
}

export interface ExercisePlan {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  dateAdded: string;
  muscleGroup: MuscleCategory;
  exercises?: Exercise[];
}

export interface ExerciseLog {
  id: string;
  planId: string;
  name: string;
  weight?: number;
  unit?: WeightUnit;
  reps?: number;
  steps?: number;
  duration?: number;
  date: string;
  muscleGroup: MuscleCategory;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  searchableUsername: string;
  displayName?: string;
  photoURL?: string;
  theme?: 'dark' | 'light';
  timezone?: string;
  language?: 'de' | 'en';
  hasCompletedOnboarding?: boolean;
}

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}
