
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Student } from "./types";

/**
 * Advanced Facial Uniqueness Verification.
 * Compares a target face against the entire registered database.
 */
export async function checkDuplicateFace(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  if (registeredStudents.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Ultra-lean gallery: check only the last 20 students for maximum speed
  const gallery = registeredStudents.slice(-20);

  const prompt = `Match Image 1 to one of these IDs: ${gallery.map(g => g.id).join(', ')}. Return ID or "NEW".`;

  try {
    const parts = [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: capturedBase64.split(',')[1] || capturedBase64 } },
      ...gallery.map(g => ({
        inlineData: { mimeType: 'image/jpeg', data: g.faceReference.split(',')[1] || g.faceReference }
      }))
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', // Faster model for vision tasks
      contents: { parts },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: { type: Type.STRING }
          },
          required: ['matchId']
        }
      }
    });

    const result = JSON.parse(response.text || '{}').matchId?.trim();
    if (result && result !== 'NEW') {
      return registeredStudents.find(s => s.id === result) || null;
    }
  } catch (error: any) {
    console.error("Fast Biometric Check Failed:", error);
  }

  return null;
}

/**
 * Identifies a student from a live capture for attendance.
 */
export async function identifyStudent(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  return checkDuplicateFace(capturedBase64, registeredStudents);
}
