
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "./types";

/**
 * Advanced Facial Uniqueness Verification.
 * Compares a target face against the entire registered database.
 */
export async function checkDuplicateFace(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  if (registeredStudents.length === 0) return null;

  // Initialize client using the strictly required syntax for the API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const gallery = registeredStudents.slice(-40).map(s => ({
    id: s.id,
    name: s.fullName,
    image: s.faceReference
  }));

  const prompt = `
    IDENTITY VERIFICATION PROTOCOL:
    Target: The first provided image.
    Gallery: The subsequent images, each corresponding to a student ID.
    
    Task: Is the person in the Target image already present in the Gallery?
    Look for identical facial structure, eye shape, nose bridge, and bone structure.
    
    Respond with the Student ID of the match if found. 
    If this is a completely NEW person not seen in the gallery, respond with "NEW".
    
    Gallery IDs and Names for reference:
    ${gallery.map(g => `${g.id}: ${g.name}`).join('\n')}
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
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: { 
              type: Type.STRING, 
              description: "The exact Student ID from the gallery that matches the target, or 'NEW' if no duplicate is found." 
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence level of the match from 0 to 1."
            }
          },
          required: ['matchId']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    const result = json.matchId?.trim();
    
    if (result && result !== 'NEW' && result !== '') {
      const match = registeredStudents.find(s => s.id === result);
      if (match) return match;
    }
  } catch (error: any) {
    console.error("Advanced Biometric Verification Failed:", error);
  }

  return null;
}

/**
 * Identifies a student from a live capture for attendance.
 */
export async function identifyStudent(capturedBase64: string, registeredStudents: Student[]): Promise<Student | null> {
  return checkDuplicateFace(capturedBase64, registeredStudents);
}
