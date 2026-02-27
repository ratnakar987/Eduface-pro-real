
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Student } from "./types";

/**
 * Advanced Facial Uniqueness Verification.
 * Compares a target face against the entire registered database.
 */
export async function checkDuplicateFace(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  if (registeredStudents.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Only check the most recent 30 students to keep context window small and fast
  const gallery = registeredStudents.slice(-30).map(s => ({
    id: s.id,
    name: s.fullName,
    image: s.faceReference
  }));

  const prompt = `
    MATCH: Target (Image 1) vs Gallery (Others).
    TASK: Return the Student ID if a match exists, else "NEW".
    IDs:
    ${gallery.map(g => `${g.id}`).join(', ')}
  `;

  try {
    const parts = [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: capturedBase64.split(',')[1] || capturedBase64 } },
      ...gallery.map(g => ({
        inlineData: { mimeType: 'image/jpeg', data: g.image.split(',')[1] || g.image }
      }))
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ['matchId']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    const result = json.matchId?.trim();
    
    if (result && result !== 'NEW') {
      return registeredStudents.find(s => s.id === result) || null;
    }
  } catch (error: any) {
    console.error("Biometric Check Failed:", error);
  }

  return null;
}

/**
 * Identifies a student from a live capture for attendance.
 */
export async function identifyStudent(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  return checkDuplicateFace(capturedBase64, registeredStudents);
}
