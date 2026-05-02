import { GoogleGenAI, Type, Schema, Modality } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TriageResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  likelyIllness: string;
  guidance: string;
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
}

const triageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: 'The assessed risk level based on symptoms. Keep this exact string in English (Low/Medium/High) so the UI can parse it.'
    },
    likelyIllness: {
      type: Type.STRING,
      description: 'The most likely condition based on the symptoms (translated to the requested language).'
    },
    guidance: {
      type: Type.STRING,
      description: 'Actionable steps for the health worker or parent. What to do now, when to escalate, red flags (translated to the requested language).'
    }
  },
  required: ['riskLevel', 'likelyIllness', 'guidance']
};

export async function performTriage(symptoms: string, ageMonths: number, language: string = 'English', location: string = ''): Promise<TriageResult> {
  const locationContext = location ? `User Location: ${location}\n` : '';

  const prompt = `
You are a decision-support triage engine for frontline health workers, based on WHO IMCI (Integrated Management of Childhood Illness) guidelines.
Analyze the following symptoms for a child aged ${ageMonths} months.
${locationContext}
Symptoms reported: "${symptoms}"

Before providing the assessment, search for the latest health news, current disease outbreaks, and climate change-related health trends published by the Ministry of Health or local health authorities relevant to the user's location (or global trends if no location is provided). Factor these recent trends into your assessment where relevant.

Output a structured triage assessment.
- Risk Level: Low, Medium, or High.
- Likely Illness: The most likely condition. If recent local outbreaks or climate trends (e.g., floods increasing waterborne diseases, heatwaves) make a specific illness more likely, mention this connection.
- Guidance: Clear, actionable steps. Include what to do now, when to escalate, red flags, and any relevant preventative alerts based on current health or climate trends.

CRITICAL INSTRUCTION: The client has selected their language as "${language}". Please write the "likelyIllness" and "guidance" values entirely in ${language}.
Keep the "riskLevel" value exactly strictly as one of: "Low", "Medium", "High" in English.

Act as a strict rule-based decision tree but enhanced with current public health data.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: triageSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as TriageResult;
  } catch (error) {
    console.error("Triage error:", error);
    throw new Error("Failed to perform triage. Please try again.");
  }
}

export async function findLocalClinics(location: string): Promise<string> {
  const prompt = `Find the nearest health clinics or hospitals near ${location}. Provide a brief list with names and approximate locations.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.2,
      }
    });
    
    return response.text || "Could not find clinic information.";
  } catch (error) {
    console.error("Maps search error:", error);
    return "Could not find clinic information at this time.";
  }
}
