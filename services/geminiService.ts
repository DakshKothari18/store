
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API using process.env.API_KEY exclusively as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateProductContent = async (productName: string, category: string, keyFeatures: string) => {
  const prompt = `
    I am adding a new product to my streetwear brand "Thatstore".
    Product Name: ${productName}
    Category: ${category}
    Key Features: ${keyFeatures}

    Please generate a catchy, edgy, streetwear-style product description (max 50 words) 
    and a list of 5 SEO keywords.
  `;

  try {
    // Using gemini-3-flash-preview for text generation tasks as recommended in guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Edgy product description" },
            seoTitle: { type: Type.STRING, description: "SEO optimized title under 60 chars" },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "5 SEO keywords"
            }
          },
          required: ["description", "seoTitle", "keywords"]
        }
      }
    });

    // The .text property is a direct property, not a function.
    const text = response.text;
    if (!text) {
      throw new Error("Received an empty response from Gemini API");
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};
