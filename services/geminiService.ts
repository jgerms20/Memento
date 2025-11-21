
import { GoogleGenAI, Type, FunctionDeclaration, Schema } from "@google/genai";
import { Moment, ActivationStrategy, ImageResolution, UploadedFile } from "../types";

// Helper to get a new instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract context from file
const extractContextFromFile = async (file: UploadedFile): Promise<string> => {
  const ai = getAI();
  const parts: any[] = [];
  
  const isImage = file.mimeType.startsWith('image/');
  const isPDF = file.mimeType === 'application/pdf';

  if (isImage || isPDF) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
    parts.push({ text: "Analyze this document/image. Extract the Brand Name, Campaign Goals, Target Audience, and any specific timing or location details. Summarize this into a strategic brief string." });
  } else {
     try {
        // safe decode for text
        const decodedText = atob(file.data);
        parts.push({ text: `Analyze this brief:\n${decodedText.substring(0, 30000)}\n\nExtract Brand, Goals, Audience.` });
     } catch (e) {
        // fallback if binary disguised as text or decode fail
        parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
        });
        parts.push({ text: "Analyze this file context." });
     }
  }

  try {
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts }
    });
    return res.text || "";
  } catch (e) {
    console.error("Context extraction failed", e);
    return "";
  }
};

// Helper for single field inference with optional selection list
export const inferFieldFromContext = async (field: string, files: UploadedFile[], options: string[] = []): Promise<string> => {
    if (files.length === 0) return "";
    const ai = getAI();
    const parts: any[] = [];
    
    if (!files[0].mimeType.startsWith('image/')) {
        try {
            parts.push({ text: `Document Context:\n${atob(files[0].data).substring(0, 10000)}\n` });
        } catch(e) {}
    } else {
         parts.push({ inlineData: { mimeType: files[0].mimeType, data: files[0].data }});
    }
    
    let prompt = `Based on the provided context, infer the best value for the field: "${field}".`;
    
    if (options.length > 0) {
        prompt += `\n\nConstraint: Select the top 3-5 most relevant items strictly from this list: [${options.join(', ')}].\nReturn ONLY the selected items as a comma-separated string.`;
    } else {
        prompt += ` Return ONLY the value, no explanation.`;
    }
    
    parts.push({ text: prompt });

    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });
        return res.text?.trim() || "";
    } catch (e) {
        return "";
    }
}

// 1. Fast Search & Discovery (Flash + Grounding)
export const findMoments = async (
  campaignContext: string, 
  file?: UploadedFile,
  savedMoments: Moment[] = [],
  creativityLevel: number = 50
): Promise<Moment[]> => {
  const ai = getAI();
  
  let enrichedContext = campaignContext;
  if (file) {
      try {
        const extracted = await extractContextFromFile(file);
        if (extracted) {
            enrichedContext += `\n\n[Inferred Context from Uploaded File]: ${extracted}`;
        }
      } catch (e) {
        console.warn("Skipping file extraction due to error", e);
      }
  }

  // Saved moments analysis & exclusion
  let exclusionList = "";
  let preferencePattern = "";
  
  if (savedMoments.length > 0) {
      // Limit exclusion context to prevent token overflow
      exclusionList = savedMoments.slice(0, 15).map(m => `"${m.title}"`).join(", ");
      const categories = [...new Set(savedMoments.map(m => m.category))].join(", ");
      preferencePattern = `
        USER HISTORY:
        The user has saved: ${exclusionList}.
        Preferred Categories: ${categories}.
        
        CRITICAL INSTRUCTION:
        1. DO NOT return any event with a title similar to: [${exclusionList}].
        2. Find NEW moments that fit the user's taste but are not duplicates.
      `;
  }

  // Creativity logic
  let creativityInstruction = "";
  if (creativityLevel < 30) {
      creativityInstruction = "Strategic Variance: LOW (Safe). Focus on well-known, established, major industry events. High probability of success.";
  } else if (creativityLevel > 70) {
      creativityInstruction = "Strategic Variance: HIGH (Wild). Look for niche, unexpected, emerging, or 'cool' adjacencies. Surprise the user with unique ideas.";
  } else {
      creativityInstruction = "Strategic Variance: MEDIUM (Balanced). A mix of 70% core relevant events and 30% interesting adjacencies.";
  }

  // Reduced count to 10 for stability
  const targetCount = 10;
  const tools: any[] = [{ googleSearch: {} }];
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const systemInstruction = `
    You are Momentum, a strategic planner.
    Find exactly ${targetCount} REAL, VERIFIED future cultural moments fitting the brief.
    
    CONSTRAINTS:
    1. DATE: Events must be AFTER ${currentDate}.
    2. ${creativityInstruction}
    3. ${preferencePattern}
    4. DIVERSITY: Mix of Sports, Music, Culture, Tech, Art, etc.
    5. ENRICHMENT: Provide rich details (vibe, demographics) for every event.

    OUTPUT JSON FORMAT ONLY:
    [
      {
        "title": "Event Name",
        "date": "Month DD, YYYY",
        "location": "City, Country",
        "category": "Culture|Sports|Music|Tech|Fashion|Gaming|Art|Food & Drink|Wellness|Business",
        "description": "15 word summary.",
        "longDescription": "Detailed strategic description.",
        "scale": "Local|National|Global",
        "estimatedReach": "e.g. 50k Attendees",
        "matchScore": 85,
        "matchReason": "Why it fits.",
        "websiteUrl": "https://...",
        "verificationDate": "Verified: ${currentDate}",
        "richDetails": {
            "vibe": "Atmosphere description",
            "demographics": "Audience description",
            "pastSponsors": ["Brand A"],
            "sponsorshipOpportunities": "Opportunities"
        }
      }
    ]
  `;

  const parts: any[] = [{ 
    text: `
      Current Date: ${currentDate}
      Context: "${enrichedContext.substring(0, 10000)}"
      
      TASK: Find ${targetCount} verified future events.
    ` 
  }];

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: { parts },
        config: {
            tools,
            systemInstruction,
        }
    });

    let rawText = response.text || "[]";
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let rawMoments: any[] = [];
    try {
        const jsonStart = rawText.indexOf('[');
        const jsonEnd = rawText.lastIndexOf(']') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            rawMoments = JSON.parse(rawText.substring(jsonStart, jsonEnd));
        } else {
            rawMoments = JSON.parse(rawText);
        }
    } catch (e) {
        console.error("JSON Parse Error", e);
        return [];
    }
    
    // Client-side Exclusion to enforce "Only New Moments"
    const savedTitles = new Set(savedMoments.map(m => m.title.toLowerCase().trim()));
    
    return rawMoments.filter((m: any) => {
        if (!m.title) return false;
        const isDuplicate = savedTitles.has(m.title.toLowerCase().trim());
        return !isDuplicate;
    }).map((m: any) => ({
        ...m,
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: m.imageUrl || null // Ensure field exists
    }));

  } catch (e) {
    console.error("Search failed", e);
    return [];
  }
};

// 2. Strategy Generation (Pro)
export const generateStrategy = async (brandName: string, goal: string, moment: Moment): Promise<ActivationStrategy> => {
  const ai = getAI();
  
  const prompt = `
    Act as a creative director. Develop a high-impact activation strategy for ${brandName} at ${moment.title}.
    Goal: ${goal}.
    Event Vibe: ${moment.richDetails?.vibe || moment.description}.
    
    Return JSON:
    {
      "conceptName": "Punchy Title",
      "rationale": "Why this works strategically.",
      "executionSteps": ["Step 1", "Step 2", "Step 3"],
      "pastBrandActivations": ["Example of what other brands did here"],
      "estimatedReach": "Expected engagement numbers"
    }
  `;

  const res = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(res.text || "{}");
};

// 3. Image Generation (Pro Image)
export const generateConceptImage = async (prompt: string, resolution: ImageResolution): Promise<string | null> => {
  const ai = getAI();
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                imageSize: resolution,
                aspectRatio: "16:9"
            }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
  } catch (e) {
      console.error("Image gen failed", e);
  }
  return null;
};

// 4. Quick Suggest
export const quickSuggest = async (partial: string): Promise<string[]> => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Suggest 3 search queries for a brand strategist typing: "${partial}". Return just the strings separated by newlines.`
    });
    return (res.text || "").split('\n').filter(s => s.trim().length > 0).slice(0, 3);
}

// 5. Chat Session
export const createChatSession = (systemInstruction: string) => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction }
  });
};
