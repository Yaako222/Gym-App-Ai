import { Type } from "@google/genai";
import { FoodItem, NutritionLog } from "../types";
import { getAI, switchToNextKey, isAIWorking } from "./aiProvider";

const NUTRITIONIST_SYSTEM_INSTRUCTION = `
You are a world-class "AI Nutritionist" in a fitness app. Your task is to analyze photos of meals and estimate precise nutritional data.

Analysis Process:
1. Identify all recognizable food items on the plate.
2. Estimate portion sizes based on visual context.
3. Determine for each component: Calories, Protein (g), Carbohydrates (g), Fats (g).
4. Consider user data (weight, goal) and training plan to provide feedback.

Additional Features:
- Provide a hint about water intake (water_hint).
- If prices for additional features (e.g., premium database) are displayed, always use Canadian Dollars (CAD).

Tone & Feedback:
- Motivating and concise.
- If the food fits the goal (e.g., muscle building) well, give a short "thumbs up" feedback.

Your response MUST be a valid JSON object.
`;

export async function analyzeMealPhoto(
  base64Image: string,
  userData: { weight: number; goal: string },
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  language: 'de' | 'en' = 'de'
): Promise<Partial<NutritionLog>> {
  const prompt = `Analyze this photo of a meal (${mealType}). 
  User weight: ${userData.weight}kg, Goal: ${userData.goal}.
  Identify the food, estimate the nutrients, and provide motivating feedback.
  CRITICAL: The entire response (feedback, food names, water hint) MUST be in ${language === 'de' ? 'German' : 'English'}.`;

  const executeRequest = async (): Promise<Partial<NutritionLog>> => {
    const ai = getAI();
    if (!ai) {
      throw new Error("AI_NOT_WORKING");
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: NUTRITIONIST_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              food_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                  },
                  required: ["name", "calories", "protein", "carbs", "fat"],
                },
              },
              total_calories: { type: Type.NUMBER },
              total_protein: { type: Type.NUMBER },
              total_carbs: { type: Type.NUMBER },
              total_fat: { type: Type.NUMBER },
              water_hint: { type: Type.STRING },
              feedback: { type: Type.STRING },
            },
            required: ["food_items", "total_calories", "total_protein", "total_carbs", "total_fat", "water_hint", "feedback"],
          },
        },
      });

      const data = JSON.parse(response.text || "{}");
      return {
        mealType,
        foodItems: data.food_items.map((item: any) => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        })),
        totalCalories: data.total_calories,
        totalProtein: data.total_protein,
        totalCarbs: data.total_carbs,
        totalFat: data.total_fat,
        feedback: data.feedback + " " + data.water_hint,
      };
    } catch (e: any) {
      if (e.message?.includes("API_KEY_INVALID") || e.message?.includes("403") || e.message?.includes("429")) {
        switchToNextKey();
        if (isAIWorking()) {
          return executeRequest();
        }
      }
      console.error("Error parsing AI response", e);
      throw new Error("Fehler bei der Analyse des Fotos.");
    }
  };

  return executeRequest();
}
