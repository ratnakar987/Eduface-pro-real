
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Student } from "./types";

/**
 * Advanced Facial Uniqueness Verification.
 * Compares a target face against the entire registered database.
 */
export async function checkDuplicateFace(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  if (registeredStudents.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Increased gallery size to 100 for better coverage
  const gallery = registeredStudents.slice(-100);

  const prompt = `
    IDENTITY MATCHING PROTOCOL:
    Target: Image 1
    Gallery: Subsequent images
    
    Task: Identify if the person in Image 1 matches anyone in the gallery.
    Compare facial features, bone structure, and unique identifiers.
    
    Respond with the Student ID of the match, or "NEW" if no match is found.
    IDs to check: ${gallery.map(g => g.id).join(', ')}
  `;

  try {
    const parts = [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: capturedBase64.split(',')[1] || capturedBase64 } },
      ...gallery.map(g => ({
        inlineData: { mimeType: 'image/jpeg', data: g.faceReference.split(',')[1] || g.faceReference }
      }))
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // State-of-the-art model for vision accuracy
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
    console.error("Biometric Verification Failed:", error);
  }

  return null;
}

/**
 * Identifies a student from a live capture for attendance.
 */
export async function identifyStudent(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  return checkDuplicateFace(capturedBase64, registeredStudents);
}
