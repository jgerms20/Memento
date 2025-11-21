
export interface Moment {
  id: string;
  title: string;
  date: string;
  location: string;
  category: 'Culture' | 'Sports' | 'Music' | 'Tech' | 'Fashion' | 'Other' | 'Gaming' | 'Art' | 'Food & Drink' | 'Wellness' | 'Business';
  description: string;
  longDescription?: string;
  scale: 'Local' | 'National' | 'Global';
  estimatedReach?: string; // e.g. "50k Attendees"
  groundingUrls: string[];
  websiteUrl?: string;
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
  matchScore?: number;
  matchReason?: string;
  verificationDate?: string; // e.g. "Verified: Oct 24, 2024"
  richDetails?: {
    vibe: string;
    demographics: string;
    pastSponsors: string[];
    sponsorshipOpportunities: string;
  };
}

export interface BrandProfile {
  name: string;
  campaignGoal: string; 
  targetAudience: string; 
  targetRegion: string; 
  customLocation?: string; 
  timeframe: {
    start: string;
    end: string;
  };
  fuzzyTimeframe?: string; 
  creativityLevel: number; // 0 to 100, default 50
  savedMoments: Moment[];
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // Base64 string without prefix
}

export interface ActivationStrategy {
  conceptName: string;
  rationale: string;
  executionSteps: string[];
  pastBrandActivations: string[]; 
  estimatedReach: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ImageResolution = '1K' | '2K' | '4K';
