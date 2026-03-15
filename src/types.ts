export type DayOfWeek = 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag' | 'Samstag' | 'Sonntag';
export type MuscleCategory = 'Arme' | 'Beine' | 'Brust' | 'Rücken' | 'Schultern' | 'Bauch' | 'Ganzkörper' | 'Cardio' | 'Andere';
export type WeightUnit = 'kg' | 'lbs';

export interface ExercisePlan {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  dateAdded: string;
  muscleGroup: MuscleCategory;
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
}

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}
