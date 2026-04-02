import { Type } from "@google/genai";
import { ExercisePlan } from "../types";
import { getAI, switchToNextKey, isAIWorking } from "./aiProvider";

const SYSTEM_INSTRUCTION = `
You are a world-class fitness coach. Your task is to generate a personalized weekly training plan for the GYM based on user data.
The user provides: weight, height, age, gender, and primary fitness goal.

Your output must be a JSON array of ExercisePlan objects.
CRITICAL: Each ExercisePlan object represents exactly ONE SINGLE EXERCISE, not a full workout day.
If a user should do 5 exercises on Monday, you must generate 5 separate ExercisePlan objects, all with dayOfWeek: "monday".

Each ExercisePlan needs:
- name: The name of the specific exercise (e.g., "Bench Press", "Squat", "Bicep Curls")
- dayOfWeek: One of 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
- muscleGroup: One of 'arme', 'beine', 'brust', 'rücken', 'schultern', 'bauch', 'ganzkörper', 'cardio', 'andere'
- sets: Number of sets (integer)
- reps: Number of repetitions (integer)
- instructions: A very simple, child-friendly instruction on how to perform the exercise.

Be specific and realistic based on the user's goal (Muscle Build, Weight Loss, Endurance). Generate a full week's plan consisting of multiple exercises per active day.
`;

export async function generateTrainingPlan(userData: {
  weight: number;
  height: number;
  age: number;
  gender: string;
  goal: string;
}): Promise<ExercisePlan[]> {
  const prompt = `Generate a personalized GYM training plan for:
  Weight: ${userData.weight}kg
  Height: ${userData.height}cm
  Age: ${userData.age}
  Gender: ${userData.gender}
  Goal: ${userData.goal}
  
  Ensure all exercises are suitable for a typical gym environment with weights and machines.`;

  const executeRequest = async (): Promise<ExercisePlan[]> => {
    const ai = getAI();
    if (!ai) {
      throw new Error("AI_NOT_WORKING");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dayOfWeek: { type: Type.STRING },
                muscleGroup: { type: Type.STRING },
                sets: { type: Type.INTEGER },
                reps: { type: Type.INTEGER },
                instructions: { type: Type.STRING },
              },
              required: ["name", "dayOfWeek", "muscleGroup", "sets", "reps", "instructions"],
            },
          },
        },
      });

      const plans = JSON.parse(response.text || "[]");
      return plans.map((p: any) => ({
        ...p,
        id: Math.random().toString(36).substr(2, 9),
        dateAdded: new Date().toISOString(),
      }));
    } catch (e: any) {
      if (e.message?.includes("API_KEY_INVALID") || e.message?.includes("403") || e.message?.includes("429")) {
        switchToNextKey();
        if (isAIWorking()) {
          return executeRequest();
        }
      }
      console.error("Error generating plan", e);
      throw e;
    }
  };

  return executeRequest();
}
