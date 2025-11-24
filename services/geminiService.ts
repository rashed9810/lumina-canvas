import { GoogleGenAI } from "@google/genai";

const createClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI generation features will not work. Please set GEMINI_API_KEY in your .env.local file.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSVGFromPrompt = async (prompt: string): Promise<string | null> => {
  const ai = createClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a simple, clean SVG code for the following description: "${prompt}". 
      Return ONLY the raw SVG string starting with <svg and ending with </svg>. 
      Do not include markdown code blocks, json wrappers, or any other text. 
      Ensure the SVG has a viewBox and valid dimensions.`,
    });

    let text = response.text;
    if (!text) return null;

    // Cleanup if model returns markdown blocks despite instructions
    text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    
    return text;
  } catch (error) {
    console.error("Error generating SVG:", error);
    return null;
  }
};