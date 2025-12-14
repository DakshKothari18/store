import { GoogleGenAI, Type } from "@google/genai";

// Handle API Key for both Vite (build) and standard process.env (local)
// @ts-ignore
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) || (typeof process !== 'undefined' ? process.env.API_KEY : '') || '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProductContent = async (productName: string, category: string, keyFeatures: string) => {
  if (!ai) {
    console.error("API Key missing");
    // Return mock data if API key is missing to prevent crash
    return {
        description: `Premium ${category} featuring ${keyFeatures}. Designed for the modern streets.`,
        seoTitle: `${productName} | Thatstore Official`,
        keywords: ['streetwear', 'fashion', category.toLowerCase(), 'style', 'drip']
    };
  }

  const prompt = `
    I am adding a new product to my streetwear brand "Thatstore".
    Product Name: ${productName}
    Category: ${category}
    Key Features: ${keyFeatures}

    Please generate a catchy, edgy, streetwear-style product description (max 50 words) 
    and a list of 5 SEO keywords.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};