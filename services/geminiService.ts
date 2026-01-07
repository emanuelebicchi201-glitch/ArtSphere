
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArtworkDescription = async (title: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a sophisticated, poetic, and professional 3-sentence art gallery description for an artwork titled "${title}" in the category of "${category}". Highlight its emotional impact and technical beauty.`,
    });
    return response.text?.trim() || "A stunning piece exploring themes of existence and form.";
  } catch (error) {
    console.error("AI Error:", error);
    return "A beautiful original artwork for your collection.";
  }
};

export const generateArtImage = async (title: string, category: string, tags: string[]): Promise<string | null> => {
  try {
    const prompt = `A professional, high-resolution ${category} masterpiece titled "${title}". 
    Style: fine art. 
    Themes: ${tags.join(', ')}. 
    Lighting: gallery lighting. 
    Composition: centered, artistic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};
