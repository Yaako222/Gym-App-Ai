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
  sets: number;
  reps: number;
  instructions: string;
  userId?: string;
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
  userId?: string;
  caloriesBurned?: number;
  isStrava?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntakeMl: number;
  feedback: string;
  imageUrl?: string;
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
  hasStartedDataCollection?: boolean;
  fitnessData?: {
    weight: number;
    height: number;
    age: number;
    gender: string;
    goal: string;
  };
}

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
