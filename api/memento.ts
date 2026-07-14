import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'Live AI discovery is not configured' });
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    if (req.body?.action === 'strategy') {
      const { brand, moment } = req.body;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Create a concise activation territory for ${brand?.name || 'a brand'} at ${moment?.title}. Objective: ${brand?.campaignGoal || 'relevance'}. Return JSON with conceptName, rationale, executionSteps (3), pastBrandActivations (1), estimatedReach.`, config: { responseMimeType: 'application/json' } });
      return res.status(200).json({ strategy: JSON.parse(response.text || '{}') });
    }
    const { query, brand, timeframe, customLocation, audience } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Today is ${today}. Find 8 real future cultural moments for this planning brief. Query: ${query}. Brand: ${brand?.name}. Objective: ${brand?.campaignGoal}. Audience: ${audience || brand?.targetAudience}. Region: ${brand?.targetRegion}. Custom region: ${customLocation || brand?.customLocation || 'none'}. Date range: ${timeframe?.start || brand?.timeframe?.start || 'open'} through ${timeframe?.end || brand?.timeframe?.end || 'open'}. Flexible timing: ${brand?.fuzzyTimeframe}. Creativity 0-100: ${brand?.creativityLevel}. Use web search, verify dates and official URLs, exclude past events. Return only a JSON array using fields id,title,date,startDate,location,category,description,longDescription,scale,estimatedReach,groundingUrls,websiteUrl,imageUrl,matchScore,matchReason,verificationDate.`, config: { tools: [{ googleSearch: {} }] } });
    const text = (response.text || '[]').replace(/```json|```/g, '').trim();
    const start = text.indexOf('['), end = text.lastIndexOf(']');
    return res.status(200).json({ moments: JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : '[]') });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : 'Discovery failed' }); }
}
